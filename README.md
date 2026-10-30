# 余音 Aftertone · 官网

> 官网独立于客户端仓库，避免混淆。技术方案见客户端 `docs/07-官网技术方案.md`。

## 仓库拓扑

| 仓库 | 可见性 | 内容 |
|---|---|---|
| `DeeGor168/aftertone` | 私有 | Flutter 客户端源码 |
| `DeeGor168/aftertone-releases` | 公开 | 纯产物分发（各平台安装包 + SHA256SUMS） |
| `DeeGor168/aftertone-web` | 公开 | 本仓库：官网源码 |

产物必须放在公开仓 —— 私有仓的 Release 未认证不可下载，也不可通过 API 读取。

## 开发

```bash
npm install
npm run dev            # http://localhost:4321
npm run fetch:release  # 单独刷新 Release 数据
npm run build          # 先拉数据再构建
npm run preview
```

首次 `dev` 前建议先跑一次 `npm run fetch:release`，否则下载页回退到
`src/data/releases.snapshot.json`（空数据占位）。

## 环境变量

复制 `.env.example` 为 `.env` 后按需修改：

| 变量 | 说明 |
|---|---|
| `PUBLIC_SITE_URL` | 站点绝对地址，canonical / sitemap / robots 全部由此派生。换域名只改这里 |
| `RELEASES_REPO` | 产物仓，默认 `DeeGor168/aftertone-releases` |
| `GITHUB_TOKEN` | 可选，提升 API 限流 |

## 目录结构

```
scripts/fetch-release.mjs   构建时拉取 Release → src/data/releases.generated.json
src/
  data/releases.snapshot.json   兜底快照（手工维护，需提交）
  i18n/ui.ts                    中英文案字典
  lib/release.ts                数据读取、体积格式化、标签本地化、镜像链接
  layouts/BaseLayout.astro      全局壳（SEO / 深浅色 / 主题切换）
  components/                   SiteHeader / SiteFooter / Seo
  pages/                        中文在根路径，英文在 /en/
  styles/tokens.css             品牌色 → CSS 变量
```

## 发布联动

客户端发版后向本仓发送 `repository_dispatch`（type `aftertone-release`），
`deploy.yml` 会重新构建，下载链接自动更新到最新版本。另有每日定时重建兜底。

## 设计约定

- 品牌色只写在 `tokens.css`，组件一律消费 CSS 变量，不写死色值
- 默认零 JS：主题切换是唯一的内联脚本
- 站点 URL 一律走 `PUBLIC_SITE_URL`，不在页面里硬编码域名
