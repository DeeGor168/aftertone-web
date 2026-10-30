import fs from 'node:fs';
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

const dataPath = () => fileURLToPath(new URL('../data/releases.json', import.meta.url));

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
