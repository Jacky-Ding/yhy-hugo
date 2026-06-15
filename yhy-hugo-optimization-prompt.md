# AI 执行指令：优化 yhy-hugo 外贸官网

> **目标仓库**：https://github.com/Jacky-Ding/yhy-hugo.git  
> **技术栈**：Hugo 静态站点生成器 + Cloudflare Pages 部署 + Cloudflare Workers 表单后端  
> **网站域名**：https://www.yhytradehub.com  
> **支持语言**：中文（zh-CN）、英文（en）、俄文（ru）  
> **当前分支**：main

---

## 环境准备

在开始执行前，请确保：

1. `git clone https://github.com/Jacky-Ding/yhy-hugo.git`
2. 进入仓库根目录 `cd yhy-hugo`
3. 确认 Hugo 版本 >= 0.120（使用 `hugo version` 检查）
4. 本地构建验证：`hugo --config config/_default/hugo.toml,config/production/hugo.toml --minify`
5. 检查 `public/` 目录生成正常后再进行修改

---

## 任务一：修复 SEO 核心问题（最高优先级）

### 1.1 修复 `robots.txt` 中的错误域名
- **目标文件**：`static/robots.txt`
- **当前内容**：
  ```
  User-agent: *
  Allow: /
  Sitemap: https://your-domain.com/sitemap.xml
  ```
- **修改要求**：将 `https://your-domain.com/sitemap.xml` 替换为 `https://www.yhytradehub.com/sitemap.xml`
- **验证**：构建后检查 `public/robots.txt`，确保域名正确

### 1.2 修正 Cloudflare `_redirects` 配置
- **目标文件**：`static/_redirects`
- **当前内容**：
  ```
  # Redirects for Cloudflare Pages
  /*    /index.html    200
  ```
- **修改要求**：删除 `/* /index.html 200` 这一行。这是一个静态 Hugo 站点，不是 SPA，不需要 catch-all fallback。保留其他注释行即可。确保 404 页面能正常显示。
- **验证**：部署后访问 `https://www.yhytradehub.com/non-existent-page` 应显示 404 页面，而非跳转到首页

### 1.3 添加 `hreflang` 多语言标签到所有页面
- **目标文件**：`layouts/partials/head.html`
- **修改要求**：在 `<title>` 标签之后，添加以下代码片段：
  ```html
  <!-- Hreflang for multilingual SEO -->
  {{ if .IsTranslated }}
  {{ range .AllTranslations }}
  <link rel="alternate" hreflang="{{ .Language.Lang }}" href="{{ .Permalink }}" />
  {{ end }}
  <link rel="alternate" hreflang="x-default" href="{{ .Site.Home.Permalink }}" />
  {{ end }}
  ```
- **验证**：构建后检查任意页面的 HTML 源码，应包含 `<link rel="alternate" hreflang="zh" ...>`、`hreflang="en"`、`hreflang="ru"` 和 `hreflang="x-default"`

### 1.4 添加 `canonical` 规范标签
- **目标文件**：`layouts/partials/head.html`
- **修改要求**：在 `hreflang` 代码之后添加：
  ```html
  <link rel="canonical" href="{{ .Permalink }}" />
  ```
- **验证**：每个页面源码中都应包含正确的 canonical URL

### 1.5 添加 Open Graph 图片（`og:image`）
- **目标文件**：`layouts/partials/head.html`
- **修改要求**：在现有 Open Graph 标签区域（约第 18-22 行）添加：
  ```html
  <meta property="og:image" content="https://www.yhytradehub.com/images/og-banner.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{{ .Site.Title }} - {{ T "site_tagline" }}">
  ```
- **额外要求**：在 `static/images/` 目录中创建 `og-banner.png`（尺寸 1200×630），可用现有 `banner-1.webp` 重新导出。如果无法生成图片，先保留标签代码，部署前手动上传图片。
- **验证**：在 Facebook Sharing Debugger 或 LinkedIn Post Inspector 中测试任意页面分享预览

---

## 任务二：添加 Schema.org 结构化数据（高优先级）

### 2.1 添加 Organization Schema JSON-LD
- **目标文件**：`layouts/partials/head.html`
- **修改要求**：在 `</head>` 之前，添加以下 JSON-LD：
  ```html
  <!-- Schema.org Organization -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "{{ .Site.Title }}",
    "url": "{{ .Site.BaseURL }}",
    "logo": "{{ "images/logo.png" | absURL }}",
    "description": "{{ .Site.Params.description }}",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+86-186-0639-3111",
      "contactType": "sales",
      "availableLanguage": ["Chinese", "English", "Russian"],
      "areaServed": ["CN", "RU", "ZM", "ZA", "NG", "TZ", "KE", "GH", "PH", "VN", "MX"]
    },
    "sameAs": [
      "https://wa.me/8618606393111"
    ]
  }
  </script>
  ```
- **注意**：使用 `{{ ... }}` 模板语法，确保 Hugo 能正确渲染。电话号码不要硬编码，从 `config/_default/hugo.toml` 中读取（如果未定义，先在 `hugo.toml` 的 `[params]` 中添加 `company_phone = "+86 186 0639 3111"`）。
- **验证**：使用 Google Rich Results Test 测试首页，应检测到 Organization 结构化数据

### 2.2 添加 WebSite Schema（首页专用）
- **目标文件**：`layouts/partials/head.html`
- **修改要求**：仅在首页（`.IsHome`）添加：
  ```html
  {{ if .IsHome }}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "{{ .Site.Title }}",
    "url": "{{ .Site.BaseURL }}",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "{{ .Site.BaseURL }}?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  {{ end }}
  ```
- **验证**：Google Rich Results Test 检测首页应显示 WebSite 结构化数据

---

## 任务三：性能与加载优化（中优先级）

### 3.1 为所有非首屏图片添加 `loading="lazy"`
- **目标文件**：所有布局文件中包含 `<img>` 的部分
- **文件清单**：
  - `layouts/_default/home.html`（Hero 区域图片**不加**，其他图片加）
  - `layouts/partials/page-about.html`
  - `layouts/partials/page-products.html`
  - `layouts/partials/page-global.html`
  - `layouts/partials/page-contact.html`
  - `layouts/partials/page-services.html`
- **修改要求**：
  - 首屏可见的 `<img>`（如 Hero Banner、Logo）**不加** `loading="lazy"`，保持默认 `eager`
  - 所有其他 `<img>` 标签添加 `loading="lazy"` 属性
  - 同时确保所有 `<img>` 都有 `alt` 属性（已完成的跳过）
- **示例**：
  ```html
  <!-- 首屏不加 lazy -->
  <img src="{{ "images/hero-truck.webp" | relURL }}" alt="Hero Banner">
  
  <!-- 非首屏加 lazy -->
  <img src="{{ "images/zambia-exterior.webp" | relURL }}" alt="Zambia Office" loading="lazy">
  ```
- **验证**：在 Chrome DevTools 的 Network 面板中检查，非首屏图片应在滚动到视口时才加载

### 3.2 添加图片 `width` 和 `height` 属性（防止布局偏移 CLS）
- **目标文件**：所有布局文件中的 `<img>` 标签
- **修改要求**：为重要图片添加 `width` 和 `height` 属性。如果不知道确切尺寸，可以省略，但优先为 Logo、Banner 等关键图片添加。
- **示例**：
  ```html
  <img src="{{ "images/logo.png" | relURL }}" alt="{{ .Site.Title }}" width="48" height="48">
  ```
- **验证**：使用 Google PageSpeed Insights 检查 CLS 指标，应接近 0

### 3.3 优化 Google Fonts 加载策略
- **目标文件**：`layouts/partials/head.html` 第 11-13 行
- **当前代码**：
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  ```
- **修改要求**：添加 `display=swap` 已在 URL 中，但确保 CSS 中有 `font-display: swap`。修改 CSS 加载链接为：
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  ```
  确认 `display=swap` 参数已存在（已存在）。同时检查 CSS 中是否使用了 `font-display: swap`，在 `static/css/style.css` 的 `@font-face` 规则中（如果有自定义字体）添加。
- **进阶（可选）**：如果追求最佳性能，可将字体文件下载到 `static/fonts/` 并自托管，减少外部依赖。但此步骤为可选，优先级较低。

---

## 任务四：代码质量与安全性优化（中优先级）

### 4.1 将硬编码 WhatsApp 号码提取到配置
- **目标文件**：`layouts/partials/footer.html` 第 9 行
- **修改要求**：
  1. 在 `config/_default/hugo.toml` 的 `[params]` 部分添加：
     ```toml
     [params]
     company_phone = "+86 186 0639 3111"
     whatsapp_number = "8618606393111"
     ```
  2. 在 `footer.html` 中，将 `<a href="https://wa.me/8618606393111">` 替换为：
     ```html
     <a href="https://wa.me/{{ .Site.Params.whatsapp_number }}" target="_blank" rel="noopener" aria-label="WhatsApp">
     ```
  3. 在 `footer.html` 中，将 `+86 186 0639 3111` 文本替换为：
     ```html
     {{ .Site.Params.company_phone }}
     ```
- **验证**：构建后页面应正常显示，WhatsApp 链接仍能正常跳转

### 4.2 将 Cloudflare Worker 密码改为环境变量
- **目标文件**：`cloudflare-workers/contact-form/index.js`
- **当前代码**（第 18 行）：
  ```javascript
  const ADMIN_PASSWORD = 'yhytradehub2024';
  ```
- **修改要求**：
  1. 改为从环境变量读取：
     ```javascript
     const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'yhytradehub2024';
     ```
  2. 在 `cloudflare-workers/contact-form/wrangler.toml` 中添加注释说明：
     ```toml
     # 在 Cloudflare Dashboard 中设置 Secret: ADMIN_PASSWORD
     # 或运行: wrangler secret put ADMIN_PASSWORD
     ```
  3. 更新 `DEPLOY_CLOUDFLARE.md` 或 `cloudflare-workers/contact-form/README.md`，添加设置 Secret 的说明。
- **注意**：不要在上传的代码中提交真实密码，生产环境必须通过 `wrangler secret put` 设置。
- **验证**：Worker 部署后，使用 `curl` 测试 GET 请求，正确密码应返回 submissions，错误密码应返回 401

### 4.3 将 Leaflet CDN 资源本地备份（可选但推荐）
- **目标文件**：`layouts/partials/page-contact.html`
- **当前代码**：
  ```html
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  ```
- **修改要求**：
  1. 下载 `leaflet.css` 和 `leaflet.js` 到 `static/lib/leaflet/`
  2. 修改引用路径为本地：
     ```html
     <link rel="stylesheet" href="{{ "lib/leaflet/leaflet.css" | relURL }}" />
     <script src="{{ "lib/leaflet/leaflet.js" | relURL }}"></script>
     ```
  3. 如果无法下载，保留 CDN 但添加 SRI 校验：
     ```html
     <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
           integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
     ```
- **验证**：在禁用外部网络的环境中（或 Russia/Africa 等 CDN 不稳定地区），地图应正常加载

---

## 任务五：内容优化（低优先级，长期提升）

### 5.1 生成并提交 XML Sitemap
- **确认**：Hugo 默认会生成 `public/sitemap.xml`，但多语言站点的 sitemap 应该是 `public/sitemap.xml` 和 `public/zh/sitemap.xml`、`public/en/sitemap.xml`、`public/ru/sitemap.xml`。
- **检查**：构建后确认 `public/sitemap.xml` 存在且包含所有语言版本的页面。
- **提交**：将 `https://www.yhytradehub.com/sitemap.xml` 提交到：
  - Google Search Console（https://search.google.com/search-console）
  - Bing Webmaster Tools（https://www.bing.com/webmasters）
  - Yandex Webmaster（针对俄罗斯市场，https://webmaster.yandex.ru）

### 5.2 创建 `og-banner.png` 图片
- **目标文件**：`static/images/og-banner.png`
- **要求**：尺寸 1200×630 像素，内容包含公司 Logo 和标语，文件大小控制在 300KB 以内。如果没有设计能力，可以暂时使用现有 `banner-1.webp` 转换后的 PNG 版本。
- **验证**：在 Facebook Sharing Debugger 或 https://www.opengraph.xyz/ 测试首页分享预览

### 5.3 添加 `lang` 属性精确化
- **目标文件**：`config/_default/hugo.toml`
- **当前配置**：
  ```toml
  [languages.zh]
  languageCode = 'zh-CN'
  ```
- **确认**：确保中文语言代码为 `zh-CN`，英文为 `en`，俄文为 `ru`。当前配置看起来正确，但构建后检查 `<html lang="...">` 标签是否匹配。
- **注意**：`hreflang` 标签中的 `zh` 与 `languageCode = 'zh-CN'` 有差异。建议将 `hreflang` 的生成改为：
  ```html
  <link rel="alternate" hreflang="{{ .Language.LanguageCode }}" href="{{ .Permalink }}" />
  ```
  而不是 `.Language.Lang`，这样 hreflang 会是 `zh-CN`、`en`、`ru` 更精确。或者保持为 `zh`、`en`、`ru`（两种都接受，但建议统一）。
- **统一决策**：使用 `{{ .Language.LanguageCode }}` 生成 hreflang，所以中文是 `zh-CN`，英文是 `en`，俄文是 `ru`。

### 5.4 检查并优化 CSS 体积
- **目标文件**：`static/css/style.css`（3575 行）
- **检查**：确认 Hugo 构建时是否使用了 CSS 压缩。在构建命令中确保有 `--minify` 参数。
- **当前构建命令**：确认 `hugo --minify` 是否能压缩 CSS。如果不能，检查 `config/_default/hugo.toml` 中是否启用了 `minify`：
  ```toml
  [minify]
    disableCSS = false
  ```
- **进阶**：如果使用了 PurgeCSS 或类似工具更好，但当前纯手写 CSS 已足够。

---

## 任务六：验证清单（每次修改后执行）

### 6.1 本地构建验证
```bash
hugo --config config/_default/hugo.toml,config/production/hugo.toml --minify
```
确保没有 ERROR 或 WARNING。

### 6.2 关键页面检查
构建后检查 `public/` 目录：
- [ ] `public/robots.txt` 域名正确
- [ ] `public/404.html` 存在且内容正常
- [ ] `public/sitemap.xml` 存在
- [ ] `public/zh/index.html` 源码包含 hreflang、canonical、OG 标签
- [ ] `public/en/index.html` 同上
- [ ] `public/ru/index.html` 同上
- [ ] `public/zh/about/index.html` 等子页面也包含 hreflang
- [ ] 所有 `<img>` 非首屏图片都有 `loading="lazy"`

### 6.3 部署前检查
- [ ] `git status` 确认没有提交 Worker 密码等敏感信息
- [ ] `static/_redirects` 中没有 `/* /index.html 200`
- [ ] Cloudflare Worker 的 `ADMIN_PASSWORD` 已通过 `wrangler secret put` 设置
- [ ] `og-banner.png` 已上传到 `static/images/`
- [ ] 所有图片 WebP 格式正确

### 6.4 部署后验证
- [ ] 访问 `https://www.yhytradehub.com/robots.txt` 确认域名正确
- [ ] 访问 `https://www.yhytradehub.com/non-existent-page` 确认 404 页面正常显示
- [ ] 使用 Google Rich Results Test 测试首页结构化数据
- [ ] 使用 Facebook Sharing Debugger 测试分享预览
- [ ] 使用 Google PageSpeed Insights 检查性能分数（目标：移动端 > 70，桌面端 > 90）
- [ ] 使用 Yandex Webmaster（俄罗斯市场）检查索引状态

---

## 已知文件路径速查表

| 文件用途 | 路径 |
|----------|------|
| Hugo 默认配置 | `config/_default/hugo.toml` |
| Hugo 生产配置 | `config/production/hugo.toml` |
| 基础布局模板 | `layouts/_default/baseof.html` |
| 页面头部（head） | `layouts/partials/head.html` |
| 页面头部（header） | `layouts/partials/header.html` |
| 页面底部（footer） | `layouts/partials/footer.html` |
| 语言切换器 | `layouts/partials/lang-switcher.html` |
| 首页布局 | `layouts/_default/home.html` |
| 列表页布局 | `layouts/_default/list.html` |
| 单页布局 | `layouts/_default/single.html` |
| 404 页面 | `layouts/_default/404.html` |
| 关于页面内容 | `layouts/partials/page-about.html` |
| 产品页面内容 | `layouts/partials/page-products.html` |
| 服务页面内容 | `layouts/partials/page-services.html` |
| 全球页面内容 | `layouts/partials/page-global.html` |
| 联系页面内容 | `layouts/partials/page-contact.html` |
| 中文翻译 | `i18n/zh.toml` |
| 英文翻译 | `i18n/en.toml` |
| 俄文翻译 | `i18n/ru.toml` |
| 主样式表 | `static/css/style.css` |
| 主 JS 文件 | `static/js/main.js` |
| 语言检测 JS | `static/js/lang-detect.js` |
| 根目录重定向 | `static/index.html` |
| robots.txt | `static/robots.txt` |
| Cloudflare 重定向 | `static/_redirects` |
| Cloudflare 安全头 | `static/_headers` |
| 联系表单 Worker | `cloudflare-workers/contact-form/index.js` |
| Worker 配置 | `cloudflare-workers/contact-form/wrangler.toml` |

---

## 执行优先级建议

| 批次 | 任务 | 预计时间 | 影响 |
|------|------|----------|------|
| 第一批（立即） | 1.1 修复 robots.txt、1.2 修正 redirects、1.3 添加 hreflang、1.4 添加 canonical | 30 分钟 | SEO 核心修复 |
| 第二批（本周） | 1.5 添加 og:image、2.1 添加 Schema、3.1 图片 lazy loading、3.2 图片尺寸 | 1-2 小时 | SEO + 性能 |
| 第三批（下周） | 4.1 提取配置、4.2 Worker 安全、3.3 字体优化、4.3 Leaflet 本地 | 1-2 小时 | 安全 + 性能 |
| 第四批（长期） | 5.1 提交 sitemap、5.2 创建 OG 图片、5.4 CSS 优化 | 按需 | 长期运营 |

---

> **注意**：所有修改完成后，请在本地执行 `hugo --minify` 并检查 `public/` 目录，确保没有报错后再提交到 Git 并部署到 Cloudflare Pages。
