# 钰弘源 Hugo 官网 — 宝塔面板部署指南

**域名**: www.yhytradehub.com  
**服务器**: 阿里云香港 + 宝塔 Linux 面板 + Nginx  
**本地项目路径**: `/Users/Zhuanz/.qclaw/workspace/yhy-hugo/`

---

## 一、构建静态文件

```bash
cd /Users/Zhuanz/.qclaw/workspace/yhy-hugo
~/.local/bin/hugo --buildFuture
```

产物在 `public/` 目录。当前约 24 个 HTML 页面 + 33 个静态文件（图片、CSS、JS、PHP）。

---

## 二、上传到服务器

### 方法 1：宝塔 Web 上传
1. 登录宝塔面板 → **文件** → 进入 `/www/wwwroot/www.yhytradehub.com/`
2. 把本地 `public/` 文件夹内容全部拖进去（不是 public 文件夹本身，是里面的内容）

### 方法 2：SCP
```bash
scp -r /Users/Zhuanz/.qclaw/workspace/yhy-hugo/public/* root@你的服务器IP:/www/wwwroot/www.yhytradehub.com/
```

---

## 三、宝塔站点配置

### 1. 添加站点
- 域名：`www.yhytradehub.com` + `yhytradehub.com`
- 根目录：`/www/wwwroot/www.yhytradehub.com`
- PHP 版本：选 **PHP 7.4 或 8.0**（⚠️ 必须选 PHP！表单提交需要 PHP 处理）

### 2. Nginx 配置文件

点站点右侧 **设置** → **配置文件**，替换为：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name www.yhytradehub.com yhytradehub.com;
    root /www/wwwroot/www.yhytradehub.com;
    index index.html index.htm index.php;

    # === 安全限制 ===
    location ~ /\. {
        deny all;
    }

    # === 表单处理（PHP） ===
    location /contact-form-handler.php {
        include enable-php-74.conf;   # 改成你选的 PHP 版本
    }

    # === 语言页面（静态 HTML） ===
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # === 缓存静态资源 ===
    location ~* \.(css|js|png|jpg|jpeg|webp|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # === 404 页面 ===
    error_page 404 /404.html;
}
```

保存后点 **重启 Nginx**。

### 3. 配置 PHP mail() 发送邮件

表单提交后通过 PHP `mail()` 发邮件到 `yhy@yhytradehub.com`。

**推荐方法：用宝塔安装 Postfix**

```bash
# SSH 登录服务器执行
yum install postfix -y       # CentOS
# 或
apt install postfix -y       # Ubuntu/Debian

systemctl enable postfix
systemctl start postfix
```

或者用宝塔的 **软件商店** → 搜索 **Postfix** → 安装。

**备选：SMTP 发送（更稳定）**

如果服务器不发邮件，可以用第三方的 SMTP（如 QQ邮箱、阿里云邮件推送），在 `contact-form-handler.php` 里配置。

### 4. SSL 证书（HTTPS）

站点设置 → **SSL** → **Let's Encrypt** → 勾选两个域名 → 申请 → 开启强制 HTTPS。

如果域名走 Cloudflare CDN：
- Cloudflare SSL/TLS 设为 **Full (strict)**
- 宝塔端同样申请 Let's Encrypt 证书（不需要 Cloudflare 的）

---

## 四、多语言 URL 结构

| 语言 | URL 示例 |
|------|---------|
| 中文 | `https://www.yhytradehub.com/zh/` |
| English | `https://www.yhytradehub.com/en/` |
| Русский | `https://www.yhytradehub.com/ru/` |

首页 `/` 自动重定向到 `/zh/`（也可根据浏览器语言自动跳转中文/英文/俄文）。

---

## 五、联系我们表单 — 工作流程

1. 客户在网页填写姓名、邮箱、电话、留言 → 提交
2. 前端 JS 发送 JSON 到 `/contact-form-handler.php`
3. PHP 验证数据 → 调用 `mail()` 发送邮件到 `yhy@yhytradehub.com`
4. 同时给客户发一封自动确认邮件
5. 返回成功/失败提示

⚠️ **确保服务器 PHP 的 `mail()` 可用**（安装 Postfix 即可）。

---

## 六、验证清单

- [ ] 首页 `https://www.yhytradehub.com/` → 自动跳转 `/zh/`
- [ ] 所有页面能正常访问（首页、关于、产品、服务、全球布局、联系我们）
- [ ] 语言切换正常（中文 ↔ English ↔ Русский）
- [ ] Logo 显示正常（凤凰 logo + 公司全名）
- [ ] 品牌墙 8 个 logo 图片加载正常
- [ ] 联系我们页面：6 个二维码 + Leaflet 地图正常
- [ ] 联系表单提交成功 → 收到邮件通知
- [ ] 移动端响应式布局正常
- [ ] SSL 证书生效（浏览器显示🔒）

---

## 七、日常更新

```bash
# 1. 修改内容后本地构建
cd /Users/Zhuanz/.qclaw/workspace/yhy-hugo
~/.local/bin/hugo --buildFuture

# 2. 上传到服务器
scp -r public/* root@你的IP:/www/wwwroot/www.yhytradehub.com/
```

---

## 八、故障排查

| 现象 | 原因 & 解决 |
|------|------------|
| 首页 404 | Nginx 配置不对，确认 `try_files $uri $uri/ $uri/index.html =404;` |
| 语言切换 404 | 确认 `public/zh/`、`public/en/`、`public/ru/` 都有 `index.html` |
| 表单提交不成功 | 检查 PHP 是否启用；看 Nginx 日志 `/var/log/nginx/error.log` |
| 收不到表单邮件 | 检查 Postfix 是否启动：`systemctl status postfix`；看 PHP 错误日志 |
| 图片不显示 | 检查 `images/` 目录是否完整上传 |
| CSS/JS 不更新 | 清除浏览器缓存 (Cmd+Shift+R)；或给资源 URL 加版本参数 |