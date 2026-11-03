import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL || 'https://aftertone-web.pages.dev';
// GitHub Pages 项目站点部署在 /<repo>/ 子路径下，base 需与 site 的 pathname 一致；
// 本地开发或自定义域名部署可用 PUBLIC_BASE_PATH 覆盖（留空表示根路径）。
const base = process.env.PUBLIC_BASE_PATH ?? new URL(site).pathname.replace(/\/$/, '');

export default defineConfig({
  site,
  base,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectDefaultLocale: false,
    },
  },
  build: { inlineStylesheets: 'auto' },
});
