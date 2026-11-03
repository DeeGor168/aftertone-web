export const defaultLang = 'zh';
export type Lang = 'zh' | 'en';

export const ui = {
  zh: {
    'nav.download': '下载',
    'nav.docs': '文档',
    'nav.changelog': '更新日志',
    'nav.about': '关于',
    'lang.switch': 'English',
    'lang.switchTo': '/en/',
    'theme.toggle': '切换主题',
    'footer.made': '余音 Aftertone · 你的私人音乐馆',
    'footer.privacy': '无追踪、无广告、无算法',
    'footer.privacyLink': '隐私政策',
    'download.title': '下载余音',
    'download.recommended': '推荐',
    'download.all': '全部下载',
    'download.sha256': 'SHA256',
    'download.size': '大小',
    'download.updated': '发布于',
    'download.empty': '暂无可用下载，请稍后再来。',
    'download.mirror': '镜像下载（第三方）',
    'download.mirrorHint': '镜像由第三方提供，内容未经本站核验，下载后请比对 SHA256',
  },
  en: {
    'nav.download': 'Download',
    'nav.docs': 'Docs',
    'nav.changelog': 'Changelog',
    'nav.about': 'About',
    'lang.switch': '简体中文',
    'lang.switchTo': '/',
    'theme.toggle': 'Toggle theme',
    'footer.made': 'Aftertone · Your private music hall',
    'footer.privacy': 'No tracking. No ads. No algorithm.',
    'footer.privacyLink': 'Privacy Policy',
    'download.title': 'Download Aftertone',
    'download.recommended': 'Recommended',
    'download.all': 'All downloads',
    'download.sha256': 'SHA256',
    'download.size': 'Size',
    'download.updated': 'Released',
    'download.empty': 'No downloads available yet.',
    'download.mirror': 'Mirror (third party)',
    'download.mirrorHint': 'Mirrors are third-party and unverified — check SHA256 after download',
  },
} as const;

export type UIKey = keyof (typeof ui)['zh'];

export function t(lang: Lang, key: UIKey): string {
  const table = ui[lang] ?? ui[defaultLang];
  return (table as Record<string, string>)[key] ?? (ui[defaultLang] as Record<string, string>)[key];
}
