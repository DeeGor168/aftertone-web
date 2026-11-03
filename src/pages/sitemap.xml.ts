import type { APIRoute } from 'astro';

const pages = ['/', '/download', '/docs', '/changelog', '/about', '/privacy'];
const locales = ['zh', 'en'] as const;

function urlFor(base: string, locale: (typeof locales)[number], page: string): string {
  return `${base}${locale === 'en' ? '/en' : ''}${page}`;
}

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://aftertone-web.pages.dev').replace(/\/$/, '');

  const entries = pages
    .flatMap((page) => locales.map((locale) => ({ page, locale })))
    .map(({ page, locale }) => {
      const alternates = locales
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l === 'zh' ? 'zh-CN' : 'en'}" href="${urlFor(
              base,
              l,
              page,
            )}" />`,
        )
        .join('\n');
      return `  <url>\n    <loc>${urlFor(base, locale, page)}</loc>\n${alternates}\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
