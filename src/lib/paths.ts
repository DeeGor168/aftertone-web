const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** 给站内绝对路径补上部署前缀，例如 /download → /aftertone-web/download */
export function withBase(path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
