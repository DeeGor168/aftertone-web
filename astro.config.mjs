import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL || 'https://aftertone-web.pages.dev';

export default defineConfig({
  site,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectDefaultLocale: false,
    },
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'zh', locales: { zh: 'zh-CN', en: 'en' } } })],
  build: { inlineStylesheets: 'auto' },
});
