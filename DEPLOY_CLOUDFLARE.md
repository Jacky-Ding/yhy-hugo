# Cloudflare Pages 部署指南

本指南说明如何将 yhy-hugo Hugo 网站部署到 Cloudflare Pages。

## 前置条件

1. GitHub 或 GitLab 账号
2. Cloudflare 账号
3. 项目代码已推送到 GitHub/GitLab 仓库

## 一、Cloudflare Pages 配置

### 1. 创建新项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages**
3. 点击 **Connect to Git**，选择你的 yhy-hugo 仓库
4. 点击 **Begin setup**

### 2. 构建设置

在 **Build settings** 中配置：

| 设置项 | 值 |
|--------|-----|
| Project name | yhy-hugo (或你喜欢的名字) |
| Production branch | main (或你的主分支名) |
| Framework preset | Hugo |
| Build command | hugo --minify |
| Build output directory | public |

### 3. 环境变量

在 **Environment variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| HUGO_VERSION | 0.121.0 | (可选) 指定 Hugo 版本 |
| HUGO_ENV | production | (可选) 设置环境 |

点击 **Save and Deploy** 开始第一次部署。

## 二、自定义域名配置

1. 部署成功后，进入项目设置 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如：yhytradehub.com）
4. 按照提示在你的域名 DNS 管理中添加 CNAME 记录

## 三、重定向配置 (_redirects 文件)

创建 `static/_redirects` 文件来处理语言重定向和其他路由：

```
# 根路径语言重定向（由 JavaScript 处理，但备用配置）
/    /zh/    302

# 确保多语言路径正确
/zh/*    /zh/:splat    200
/en/*    /en/:splat    200
/ru/*    /ru/:splat    200
```

## 四、头部配置 (_headers 文件)

创建 `static/_headers` 文件来优化性能和安全：

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# 缓存静态资源
*.css
  Cache-Control: public, max-age=31536000, immutable
*.js
  Cache-Control: public, max-age=31536000, immutable
*.jpg
  Cache-Control: public, max-age=31536000, immutable
*.jpeg
  Cache-Control: public, max-age=31536000, immutable
*.png
  Cache-Control: public, max-age=31536000, immutable
*.webp
  Cache-Control: public, max-age=31536000, immutable
*.svg
  Cache-Control: public, max-age=31536000, immutable
*.ico
  Cache-Control: public, max-age=31536000, immutable
```

## 五、部署后的检查

1. **语言切换测试**：确保切换语言时停留在当前页面
2. **自动语言检测**：使用不同浏览器语言设置访问根路径，验证是否正确重定向
3. **响应式测试**：在移动设备上测试
4. **速度测试**：使用 Cloudflare 的速度测试工具检查

## 六、后续更新流程

1. 在本地修改代码
2. 提交并推送到 GitHub/GitLab
3. Cloudflare Pages 会自动检测并重新部署

## 七、注意事项

### 关于 PHP 表单处理

Cloudflare Pages 是静态托管，不支持 PHP。如果你需要联系表单功能，有以下选择：

1. **使用 Cloudflare Workers**：创建一个 Serverless 函数处理表单
2. **使用第三方表单服务**：如 Formspree、Netlify Forms 等
3. **部署到支持 PHP 的服务器**：如原计划的宝塔面板

### 当前表单处理

当前项目的 `contact-form-handler.php` 仅适用于支持 PHP 的环境。在 Cloudflare Pages 上，你可以：

- 暂时移除表单功能，只显示联系方式
- 或使用第三方表单服务替换

## 八、回退方案

如果 Cloudflare Pages 不满足需求，可以继续使用原宝塔面板部署方案，详见 `DEPLOY_BAOTA.md`。
