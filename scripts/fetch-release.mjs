import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.RELEASES_REPO || 'DeeGor168/aftertone-releases';
const TOKEN = process.env.GITHUB_TOKEN || '';
const OUT = path.join(root, 'src', 'data', 'releases.generated.json');
const SNAPSHOT = path.join(root, 'src', 'data', 'releases.snapshot.json');

const RULES = [
  { re: /AftertoneSetup-v[\d.]+\.exe$/i, platform: 'windows', arch: 'x64', kind: 'installer', recommended: true },
  { re: /linux-x64-v[\d.]+\.tar\.gz$/i, platform: 'linux', arch: 'x64', kind: 'archive', recommended: true },
  { re: /macos-v[\d.]+\.zip$/i, platform: 'macos', arch: 'universal', kind: 'archive', recommended: true },
  { re: /arm64-v8a-v[\d.]+\.apk$/i, platform: 'android', arch: 'arm64', kind: 'apk', recommended: true },
  { re: /armeabi-v7a-v[\d.]+\.apk$/i, platform: 'android', arch: 'armeabi-v7a', kind: 'apk' },
  { re: /x86_64-v[\d.]+\.apk$/i, platform: 'android', arch: 'x86_64', kind: 'apk' },
  { re: /\.aab$/i, platform: 'android', arch: 'universal', kind: 'aab' },
];

function classify(name) {
  return RULES.find((r) => r.re.test(name));
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

async function main() {
  try {
    const release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`);
    const sums = await fetchSums(release.assets ?? []);
    const assets = (release.assets ?? [])
      .map((a) => {
        const rule = classify(a.name);
        if (!rule) return null;
        return {
          platform: rule.platform,
          arch: rule.arch,
          kind: rule.kind,
          recommended: Boolean(rule.recommended),
          label: a.name,
          url: a.browser_download_url,
          size: a.size,
          sha256: sums[a.name] ?? null,
        };
      })
      .filter(Boolean);

    const data = {
      version: String(release.tag_name || '').replace(/^[vV]/, ''),
      publishedAt: release.published_at ?? null,
      notesUrl: release.html_url ?? `https://github.com/${REPO}/releases`,
      assets,
      fetchedAt: new Date().toISOString(),
      stale: false,
    };

    fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`[fetch-release] ${data.version} · ${assets.length} 个产物`);
  } catch (err) {
    console.warn(`[fetch-release] 拉取失败（${err.message}），回退到 snapshot`);
    fs.copyFileSync(SNAPSHOT, OUT);
  }
}

main();
