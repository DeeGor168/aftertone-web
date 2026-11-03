import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Lang } from '../i18n/ui';

export type Asset = {
  platform: 'windows' | 'macos' | 'linux' | 'android';
  arch: string;
  kind: 'installer' | 'portable' | 'apk' | 'aab' | 'archive';
  recommended: boolean;
  label: string;
  url: string;
  size: number;
  sha256: string | null;
};

export type ReleaseData = {
  version: string;
  publishedAt: string | null;
  notesUrl: string;
  assets: Asset[];
  fetchedAt: string | null;
  stale: boolean;
  source?: string | null;
};

// Astro 静态构建会把页面代码打进 SSR bundle，此时 import.meta.url 指向构建产物
// 而不是源码目录，按它拼出的 ../data/releases.json 读不到文件，页面会静默退回
// 空态。这里依次尝试「按当前模块定位」与「按仓库根目录定位」，取第一个存在的
// 路径，保证 build/dev 两种环境下都能读到构建前由 fetch-release 写入的数据。
const dataPath = () => {
  const candidates: string[] = [];
  try {
    candidates.push(
      fileURLToPath(new URL('../data/releases.json', import.meta.url)),
    );
  } catch {
    // import.meta.url 不是 file: 协议时忽略该候选
  }
  candidates.push(path.join(process.cwd(), 'src', 'data', 'releases.json'));
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // 忽略不可访问的候选路径
    }
  }
  return candidates[0];
};

const EMPTY: ReleaseData = {
  version: '0.0.0',
  publishedAt: null,
  notesUrl: 'https://github.com/DeeGor168/aftertone-releases/releases',
  assets: [],
  fetchedAt: null,
  stale: true,
  source: null,
};

export function loadRelease(): ReleaseData {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath(), 'utf8')) as ReleaseData;
    if (Array.isArray(parsed?.assets)) return parsed;
  } catch {
    // 数据文件缺失或损坏时退回空态
  }
  return EMPTY;
}

export function formatSize(bytes: number | undefined, lang: Lang = 'zh'): string {
  if (!bytes || bytes <= 0) return '—';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const platformNames: Record<string, Record<Lang, string>> = {
  windows: { zh: 'Windows', en: 'Windows' },
  macos: { zh: 'macOS', en: 'macOS' },
  linux: { zh: 'Linux', en: 'Linux' },
  android: { zh: 'Android', en: 'Android' },
};

const kindNames: Record<string, Record<Lang, string>> = {
  installer: { zh: '安装包', en: 'Installer' },
  portable: { zh: '便携版', en: 'Portable' },
  apk: { zh: 'APK', en: 'APK' },
  aab: { zh: 'AAB（应用商店）', en: 'AAB (store)' },
  archive: { zh: '压缩包', en: 'Archive' },
};

export function assetLabel(a: Asset, lang: Lang): string {
  const p = platformNames[a.platform]?.[lang] ?? a.platform;
  const k = kindNames[a.kind]?.[lang] ?? a.kind;
  const arch = a.arch === 'universal' ? '' : a.arch;
  return arch ? `${p} · ${k} · ${arch}` : `${p} · ${k}`;
}

export function recommendedFor(platform: string, assets: Asset[]): Asset | undefined {
  return assets.find((a) => a.platform === platform && a.recommended);
}

export function mirrorUrl(url: string): string {
  return `https://ghproxy.net/${url}`;
}
