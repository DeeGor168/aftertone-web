import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.RELEASES_REPO || 'DeeGor168/aftertone-releases';
const TOKEN = process.env.GITHUB_TOKEN || '';
const OUT = path.join(root, 'src', 'data', 'releases.json');

// 公开分发仓的稳定入口：发布时随产物上传，匿名可读、不受 API 限流影响
const MANIFEST_URL = `https://github.com/${REPO}/releases/latest/download/manifest.json`;
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

// 兼容旧版发布（无 manifest 时按文件名识别平台/架构）
const RULES = [
  { re: /AftertoneSetup-v[\d.]+\.exe$/i, platform: 'windows', arch: 'x64', kind: 'installer', recommended: true },
  { re: /linux-x64-v[\d.]+\.tar\.gz$/i, platform: 'linux', arch: 'x64', kind: 'archive', recommended: true },
  { re: /macos-v[\d.]+\.zip$/i, platform: 'macos', arch: 'universal', kind: 'archive', recommended: true },
  { re: /arm64-v8a-v[\d.]+\.apk$/i, platform: 'android', arch: 'arm64', kind: 'apk', recommended: true },
  { re: /armeabi-v7a-v[\d.]+\.apk$/i, platform: 'android', arch: 'armeabi-v7a', kind: 'apk' },
  { re: /x86_64-v[\d.]+\.apk$/i, platform: 'android', arch: 'x86_64', kind: 'apk' },
  { re: /\.aab$/i, platform: 'android', arch: 'universal', kind: 'aab' },
];

// 拉不到任何数据时写入的占位，页面据此显示空态
const EMPTY = {
  version: '0.0.0',
  publishedAt: null,
  notesUrl: `https://github.com/${REPO}/releases`,
  assets: [],
  fetchedAt: null,
  stale: true,
  source: null,
};

function classify(name) {
  return RULES.find((r) => r.re.test(name));
}

/**
 * 统一成站内数据结构。manifest 可以直接给出 platform/arch/kind，
 * 也可以只给文件名，由 RULES 推断。
 */
function normalizeAssets(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((a) => {
      const name = a.label || a.name || a.file || '';
      const url = a.url || a.browser_download_url || '';
      const rule = a.platform && a.kind ? null : classify(name);
      if (!url) return null;
      if (!a.platform && !rule) return null;
      return {
        platform: a.platform ?? rule.platform,
        arch: a.arch ?? rule.arch,
        kind: a.kind ?? rule.kind,
        recommended: a.recommended ?? Boolean(rule?.recommended),
        label: name || String(url).split('/').pop() || '',
        url,
        size: Number(a.size) || 0,
        sha256: typeof a.sha256 === 'string' ? a.sha256.toLowerCase() : null,
      };
    })
    .filter(Boolean);
}

function toRelease(data, source) {
  const assets = normalizeAssets(data.assets);
  if (!data.version || assets.length === 0) throw new Error('缺少 version 或没有可用产物');
  return {
    version: String(data.version).replace(/^[vV]/, ''),
    publishedAt: data.publishedAt ?? null,
    notesUrl: data.notesUrl ?? `https://github.com/${REPO}/releases`,
    assets,
    fetchedAt: new Date().toISOString(),
    stale: false,
    source,
  };
}

async function loadFromManifest() {
  const res = await fetch(MANIFEST_URL, {
    headers: { 'User-Agent': 'aftertone-web' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return toRelease(await res.json(), 'manifest');
}

async function fetchJson(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'aftertone-web',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchSums(assets) {
  const sumsAsset = assets.find((a) => /^SHA256SUMS(\.txt)?$/i.test(a.name));
  if (!sumsAsset) return {};
  try {
    const res = await fetch(sumsAsset.browser_download_url);
    if (!res.ok) return {};
    const text = await res.text();
    const map = {};
    for (const line of text.split('\n')) {
      const m = line.trim().match(/^([0-9a-f]{64})\s+\*?(.+)$/i);
      if (m) map[m[2].trim()] = m[1].toLowerCase();
    }
    return map;
  } catch {
    return {};
  }
}

async function loadFromApi() {
  const release = await fetchJson(API_URL);
  const sums = await fetchSums(release.assets ?? []);
  const assets = (release.assets ?? []).map((a) => ({
    label: a.name,
    url: a.browser_download_url,
    size: a.size,
    sha256: sums[a.name] ?? null,
  }));
  return toRelease(
    {
      version: release.tag_name,
      publishedAt: release.published_at ?? null,
      notesUrl: release.html_url ?? `https://github.com/${REPO}/releases`,
      assets,
    },
    'api',
  );
}

function readCurrent() {
  try {
    const parsed = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    if (Array.isArray(parsed?.assets) && parsed.assets.length > 0) return parsed;
  } catch {
    // 文件不存在或损坏
  }
  return null;
}

function write(data) {
  fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  let data = null;
  for (const [source, loader] of [
    ['manifest', loadFromManifest],
    ['api', loadFromApi],
  ]) {
    try {
      data = await loader();
      console.log(`[fetch-release] ${source} 成功：${data.version} · ${data.assets.length} 个产物`);
      break;
    } catch (err) {
      console.warn(`[fetch-release] ${source} 失败（${err.message}）`);
    }
  }

  if (data) {
    write(data);
    return;
  }

  // 源站不可用时保留上一次成功的数据，避免把下载页打空
  const previous = readCurrent();
  if (previous) {
    console.warn(
      `[fetch-release] 源站不可用，保留上次成功数据：${previous.version} · ${previous.assets.length} 个产物`,
    );
    write(previous);
    return;
  }

  console.warn('[fetch-release] 无历史数据可用，写入空数据占位');
  write(EMPTY);
}

main();
