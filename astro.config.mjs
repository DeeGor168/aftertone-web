import { defineConfig } from 'astro/config';

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
  build: { inlineStylesheets: 'auto' },
});
