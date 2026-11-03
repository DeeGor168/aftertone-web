# 余音 Aftertone · 官网

> 官网独立于客户端仓库，避免混淆。技术方案见客户端 `docs/07-官网技术方案.md`。

## 仓库拓扑

| 仓库 | 可见性 | 内容 |
|---|---|---|
| `DeeGor168/aftertone` | 私有 | Flutter 客户端源码 |
| `DeeGor168/aftertone-releases` | 公开 | 纯产物分发（各平台安装包 + SHA256SUMS + `manifest.json`），不含源码 |
| `DeeGor168/aftertone-web` | 公开 | 本仓库：官网源码 |

客户端仓私有，其 Release 资产匿名不可下载，因此产物统一发布到公开的
`aftertone-releases`；官网构建只从公开产物仓取数，不受客户端仓可见性影响。
官网仓保持公开，继续使用 GitHub Pages 托管，Cloudflare Pages 作为可选镜像。

## 开发

```bash
npm install
npm run dev            # http://localhost:4321
npm run fetch:release  # 单独刷新 Release 数据
npm run build          # 先拉数据再构建
npm run preview
```

首次 `dev` 前建议先跑一次 `npm run fetch:release`，否则下载页读取
`src/data/releases.json` 的当前内容（初始为空数据占位）。

`fetch-release` 按顺序尝试：分发仓 `manifest.json` 直链 → GitHub API → 仓内上一次成功的数据。
全部失败时保留原有数据，不会把下载页打空。

## 环境变量

复制 `.env.example` 为 `.env` 后按需修改：

| 变量 | 说明 |
|---|---|
| `PUBLIC_SITE_URL` | 站点绝对地址，canonical / sitemap / robots 全部由此派生。换域名只改这里 |
| `RELEASES_REPO` | 产物仓，默认 `DeeGor168/aftertone-releases` |
| `GITHUB_TOKEN` | 可选，提升 API 限流 |

## 目录结构

```
scripts/fetch-release.mjs   拉取 Release → src/data/releases.json
src/
  data/releases.json           最近一次成功拉取的发布数据（脚本写入，需提交）
  i18n/ui.ts                    中英文案字典
  lib/release.ts                数据读取、体积格式化、标签本地化、镜像链接
  layouts/BaseLayout.astro      全局壳（SEO / 深浅色 / 主题切换）
  components/                   SiteHeader / SiteFooter / Seo
  pages/                        中文在根路径，英文在 /en/
  styles/tokens.css             品牌色 → CSS 变量
```

## 发布联动

数据契约放在公开分发仓：客户端 CI 在发布时除产物外再上传一份 `manifest.json`，
官网通过
`https://github.com/<RELEASES_REPO>/releases/latest/download/manifest.json`
匿名读取，不依赖 GitHub API 与跨仓凭据。

manifest 字段（与 `src/lib/release.ts` 的 `ReleaseData` 一致）：

```json
{
  "version": "0.5.0",
  "publishedAt": "2026-10-01T00:00:00Z",
  "notesUrl": "https://github.com/DeeGor168/aftertone-releases/releases/tag/v0.5.0",
  "assets": [
    {
      "platform": "windows",
      "arch": "x64",
      "kind": "installer",
      "recommended": true,
      "label": "AftertoneSetup-v0.5.0.exe",
      "url": "https://github.com/DeeGor168/aftertone-releases/releases/download/v0.5.0/AftertoneSetup-v0.5.0.exe",
      "size": 12345678,
      "sha256": "…"
    }
  ]
}
```

`platform/arch/kind` 可省略，此时按文件名推断（见 `RULES`）。产物只需带
`label` + `url`，`size`/`sha256` 缺省时页面显示 `—`。

触发方式：

- `repository_dispatch`（type `aftertone-release`）：客户端发版后触发
- 每 4 小时定时兜底
- `push` 到 `main`、手动 `workflow_dispatch`

同一个 workflow 内完成"拉数据 → 有变化则提交 `releases.json` → 构建 → 部署"，
提交信息带 `[release-sync]` 标记，不会二次触发构建。同步失败时沿用上一次
成功的数据继续部署，下载页不会退化成空态。

## 设计约定

- 品牌色只写在 `tokens.css`，组件一律消费 CSS 变量，不写死色值
- 默认零 JS：主题切换是唯一的内联脚本
- 站点 URL 一律走 `PUBLIC_SITE_URL`，不在页面里硬编码域名
