# 钰弘源 Hugo 网站部署指南

## 前置条件

- 阿里云香港服务器 + 宝塔面板（已搭建）
- 服务器已安装 Nginx 或 Apache
- Cloudflare CDN 已配置

## 一、本地构建

在本地电脑上执行：

```bash
# 进入 Hugo 项目目录
cd yhy-hugo

# 构建静态文件（输出到 public/ 目录）
hugo --minify
```

构建完成后，`public/` 目录即为静态网站文件。

## 二、上传到宝塔面板

### 方式一：宝塔面板直接上传（推荐）

1. 登录宝塔面板
2. 进入「网站」
3. 找到对应网站，点击「根目录」或进入「文件」
4. 将 `public/` 目录下的所有文件打包成 zip：
   ```bash
   cd yhy-hugo/public
   zip -r ~/yhy-website.zip .
   ```
5. 在宝塔文件管理中上传 zip 包，解压到网站根目录

### 方式二：SFTP 上传

```bash
# 使用 SFTP 客户端（FileZilla / Transmit）或命令行
scp -r public/* root@your-server-ip:/www/wwwroot/your-site-directory/
```

## 三、Nginx 配置（关键）

宝塔面板 → 网站 → 设置 → 配置文件，添加以下配置：

```nginx
# URL 重写：确保 Hugo 的多语言路径正常工作
location / {
    try_files $uri $uri/ =404;
    
    # 语言检测：根路径重定向
    if ($http_accept_language ~* "^zh") {
        rewrite ^/$ /zh/ redirect;
    }
    if ($http_accept_language ~* "^ru") {
        rewrite ^/$ /ru/ redirect;
    }
}

# 404 页面
error_page 404 /404.html;

# 缓存静态资源
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# 禁止访问隐藏文件
location ~ /\. {
    deny all;
}

# Gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
gzip_min_length 1000;
```

如果使用 Cloudflare CDN，可以将缓存时间缩短，因为 Cloudflare 会处理缓存：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 1d;
    add_header Cache-Control "public";
}
```

## 四、Cloudflare 配置注意事项

1. **Always Online**：不建议开启，Hugo 纯静态不需要
2. **Auto Minify**：建议关闭（Hugo 构建时已做压缩），避免与 Cloudflare 压缩冲突
3. **页面规则**：
   - `example.com/zh/*` — Cache Level: Standard
   - `example.com/en/*` — Cache Level: Standard
   - `example.com/ru/*` — Cache Level: Standard
4. **SSL/TLS**：设置为 Full (strict)
5. **语言页面规则**：
   - 如果有特定国家定向需求，可以添加 Cloudflare 的 `country` 头转发
   - Nginx 端通过 `$http_cf_ipcountry` 做更精准的地理定位

## 五、多语言 SEO 配置

### Sitemap

Hugo 会自动生成多语言 sitemap，访问：
- `https://your-domain.com/sitemap.xml`

向 Google Search Console 提交时，确保每个语言版本都已提交。

### hreflang 标签

Hugo 会自动在页面中插入 hreflang 标签，确保搜索引擎正确识别多语言页面关系。

### robots.txt

创建 `static/robots.txt`：

```
User-agent: *
Allow: /
Sitemap: https://your-domain.com/sitemap.xml
```

## 六、后续更新流程

1. 本地修改代码或内容
2. 重新构建：`hugo --minify`
3. 上传 `public/` 目录覆盖旧文件
4. 如需清缓存：Cloudflare → 缓存 → 清除缓存

建议使用 rsync 增量上传提高效率：
```bash
rsync -avz --delete public/ root@your-server:/www/wwwroot/your-site/
```

## 七、待替换的图片资源

当前使用的是占位图片，需要替换为实际图片：

| 文件 | 说明 | 建议尺寸 |
|------|------|----------|
| `images/logo.png` | 网站 Logo | 200×60px |
| `images/favicon.png` | 浏览器图标 | 32×32px |
| `images/banner-1.png` | 首页轮播图1 | 1200×520px |
| `images/banner-2.png` | 首页轮播图2 | 1200×520px |
| `images/banner-3.png` | 首页轮播图3 | 1200×520px |

替换后建议转换为 WebP 格式以减小文件体积：
```bash
# macOS (需安装 libwebp)
brew install webp
cwebp -q 80 input.png -o output.webp

# 批量转换
for f in *.png; do cwebp -q 80 "$f" -o "${f%.png}.webp"; done
```

转换后记得更新 HTML 模板中的图片引用路径（`.png` → `.webp`）。