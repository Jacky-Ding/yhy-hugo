# 钰弘源 Hugo 静态网站 — 宝塔面板部署指南

## 一、本地构建

```bash
cd /Users/Zhuanz/.qclaw/workspace/yhy-hugo
~/.local/bin/hugo --minify --baseURL "https://new.yhytradehub.com/"
```

构建成功后，`public/` 目录即为完整静态网站，可上传至服务器。

---

## 二、宝塔面板上传步骤

### 方法 A：直接上传 public/ 目录（推荐）

1. 打开宝塔面板 → **文件**
2. 进入网站根目录（如 `/www/wwwroot/new.yhytradehub.com/`）
3. 点击 **上传** → **上传目录** → 选择本地 `public/` 目录
4. 上传完成后，确保文件结构如下：
   ```
   /www/wwwroot/new.yhytradehub.com/
   ├── index.html          ← 根目录入口（自动语言跳转）
   ├── zh/
   ├── en/
   ├── ru/
   ├── css/
   ├── js/
   ├── images/
   └── ...
   ```

### 方法 B：先压缩再上传（适合网速慢的情况）

```bash
cd /Users/Zhuanz/.qclaw/workspace/yhy-hugo
tar czf yhy-hugo-public.tar.gz -C public .
```

1. 宝塔面板 → **文件** → 上传 `yhy-hugo-public.tar.gz`
2. 右键 → **终端** → 解压：
   ```bash
   cd /www/wwwroot/new.yhytradehub.com/
   tar xzf yhy-hugo-public.tar.gz
   ```

---

## 三、宝塔 Nginx 配置（重要）

在宝塔 → **网站** → 对应站点 → **配置文件** 中，添加以下内容以支持干净 URL（去掉 `.html` 后缀）和 SPA 式路由：

```nginx
# 强制 HTTPS（Cloudflare 场景）
if ($scheme = http) {
    return 301 https://$host$request_uri;
}

# 语言目录静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|webp|svg|ico|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# 根路径 / 行为由 index.html 处理（含 JS 语言重定向）
location = / {
    try_files /index.html =404;
}

# 多语言子目录路由
location /zh/ {
    try_files $uri $uri/ /zh/index.html;
}
location /en/ {
    try_files $uri $uri/ /en/index.html;
}
location /ru/ {
    try_files $uri $uri/ /ru/index.html;
}
```

---

## 四、Cloudflare CDN 配置

1. 登录 Cloudflare → 选择域名 `yhytradehub.com`
2. **SSL/TLS** → 加密模式设为 **Full** 或 **Full (strict)**
3. **Speed** → Optimization → 开启 **Auto Minify**（HTML/CSS/JS）
4. **Caching** → Configuration → 设为 **Standard**
5. **Page Rules** 添加规则：
   - URL: `new.yhytradehub.com/images/*` → Cache Level: **Cache Everything**, Edge Cache TTL: **1 month**

---

## 五、验证部署

在浏览器访问以下地址，确认全部返回 200：

```
https://new.yhytradehub.com/          ← 应自动跳转至 /zh/（中文浏览器）
https://new.yhytradehub.com/zh/        ← 中文首页
https://new.yhytradehub.com/en/        ← 英文首页
https://new.yhytradehub.com/ru/        ← 俄文首页
https://new.yhytradehub.com/zh/about/  ← 关于我们
https://new.yhytradehub.com/zh/products/
https://new.yhytradehub.com/zh/services/
https://new.yhytradehub.com/zh/global/
https://new.yhytradehub.com/zh/contact/
```

---

## 六、常见问题

### Q: 中文首页闪烁/刷新？
**A**: 已修复。`lang-detect.js` 逻辑已改为内联在 `<head>` 中执行，且在 `sessionStorage` 中设置防重入标记，不会反复跳转。

### Q: 图片 404？
**A**: 确认 `public/images/` 目录下有以下文件：
- `logo.svg`（SVG 矢量 Logo）
- `banner-1.webp`、`banner-3.webp`（首页轮播图）
- `shanqi.webp`、`weichai.webp`、`zhongqi2.webp`、`JIEFANG2.webp` 等品牌图

### Q: 如何更新网站内容？
**A**: 修改 `content/` 下的 Markdown 文件或 `i18n/*.toml` 翻译文件，重新运行 `hugo --minify`，然后重新上传 `public/` 目录。

---

## 七、文件清单

```
yhy-hugo/
├── config/_default/hugo.toml     ← Hugo 主配置
├── i18n/
│   ├── zh.toml                   ← 中文翻译（~12KB）
│   ├── en.toml                   ← 英文翻译（~25KB）
│   └── ru.toml                   ← 俄文翻译（~28KB）
├── layouts/
│   ├── _default/
│   │   ├── baseof.html           ← 基础模板
│   │   ├── home.html             ← 首页（含轮播 + 品牌展示）
│   │   ├── single.html           ← 通用单页模板
│   │   └── 404.html             ← 自定义 404 页面
│   └── partials/
│       ├── head.html             ← <head> 含内联语言检测 JS
│       ├── header.html           ← 顶部导航（含首页链接）
│       ├── footer.html           ← 页脚
│       ├── lang-switcher.html    ← 语言切换下拉
│       ├── page-about.html      ← 关于我们
│       ├── page-products.html   ← 产品中心
│       ├── page-services.html   ← 服务体系
│       ├── page-global.html     ← 全球布局
│       └── page-contact.html    ← 联系我们
├── static/
│   ├── css/style.css            ← 完整响应式样式
│   ├── js/main.js               ← 轮播/移动菜单/FAQ 交互
│   ├── js/lang-detect.js        ← 语言自动检测（备用）
│   └── images/                  ← 图片资源（logo/banner/品牌等）
└── content/                     ← Hugo 内容文件（每语言）
    ├── _index.zh.md
    ├── _index.en.md
    ├── _index.ru.md
    ├── about/_index.md (x3)
    ├── products/_index.md (x3)
    ├── services/_index.md (x3)
    ├── global/_index.md (x3)
    └── contact/_index.md (x3)
```
