# Cloudflare Workers 联系表单部署指南

本文档详细说明如何部署联系表单的 Cloudflare Workers 后端服务。

## 准备工作

### 1. 获取 Resend API 密钥

Resend 是一个现代化的邮件发送服务，设置简单且有免费额度（100封/天）。

1. 访问 [Resend 官网](https://resend.com)
2. 注册账号（推荐使用 GitHub 登录）
3. 进入 Dashboard → API Keys → Create API Key
4. 复制生成的 API 密钥（格式：`re_xxxxxx`）

### 2. 配置接收邮件地址

在 Resend 中添加域名或使用已有的邮箱地址作为收件人：

**选项 A：添加自定义域名（推荐用于生产环境）**
- 在 Resend Dashboard → Domains 添加你的域名（如 `yhytradehub.com`）
- 按照提示添加 DNS 记录进行域名验证
- 验证通过后，可以使用 `@yhytradehub.com` 的任意邮箱作为发件人

**选项 B：使用已有邮箱（快速测试）**
- 直接使用你的企业邮箱（如 `yhy@yhytradehub.com`）作为收件人
- 发件人可以使用 Resend 提供的默认域名

## 部署步骤

### 方式一：使用 Wrangler CLI 部署（推荐）

#### 1. 安装 Wrangler

```bash
# 使用 npm 安装
npm install -g wrangler

# 或使用 pnpm
pnpm add -g wrangler

# 或使用 yarn
yarn global add wrangler
```

#### 2. 登录 Cloudflare

```bash
wrangler login
```

这会在浏览器中打开 Cloudflare 授权页面，授权后即可。

#### 3. 配置环境变量

在 `cloudflare-workers/contact-form/` 目录下设置密钥：

```bash
cd cloudflare-workers/contact-form

# 设置 Resend API 密钥（必需）
wrangler secret put RESEND_API_KEY --env production

# 系统会提示输入值，粘贴你的 Resend API 密钥

# 设置收件人邮箱（必需）
wrangler secret put TO_EMAIL --env production

# 设置发件人邮箱（可选）
wrangler secret put FROM_EMAIL --env production
# 例如：noreply@yhytradehub.com
```

#### 4. 部署到开发/预览环境

```bash
cd cloudflare-workers/contact-form

# 部署到开发环境（自动获得 .dev 域名）
wrangler dev --env dev

# 或者部署到预览环境
wrangler deploy --env dev
```

部署成功后会显示预览 URL，例如：`https://yhy-contact-form-dev.your-subdomain.workers.dev`

#### 5. 部署到生产环境

```bash
wrangler deploy --env production
```

生产环境部署后，你可以：

**选项 A：绑定自定义域名（推荐）**

1. 在 Cloudflare Dashboard → Workers & Pages 中找到你的 Worker
2. 进入 Settings → Triggers → Custom Domains
3. 点击 "Add Custom Domain"
4. 输入域名：`api.yhytradehub.com` 或 `contact.yhytradehub.com`
5. 添加 DNS 记录（通常是 CNAME 或 AAAA 记录）

**选项 B：使用 Cloudflare Pages 路由**

在 Cloudflare Pages 项目中：

1. 进入项目 Settings → Functions → Routes
2. 添加路由：`api.yhytradehub.com/*`
3. 选择对应的 Worker

### 方式二：通过 Cloudflare Dashboard 部署

#### 1. 上传代码

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 点击 "Create Application"
4. 选择 "Create Worker"
5. 粘贴 `/cloudflare-workers/contact-form/index.js` 的代码内容
6. 点击 "Deploy"

#### 2. 配置环境变量

1. 在 Worker 详情页，点击 "Settings" → "Variables"
2. 点击 "Add variable"，添加：
   - `RESEND_API_KEY`: 你的 Resend API 密钥
   - `TO_EMAIL`: 收件人邮箱
   - `FROM_EMAIL`: 发件人邮箱（可选）
3. 在 "Secret" 列勾选 API 密钥和密码字段

#### 3. 绑定自定义域名

1. 在 Worker 详情页，点击 "Triggers" → "Custom Domains"
2. 点击 "Add Custom Domain"
3. 输入自定义域名，按提示配置 DNS

## 配置网站前端

### 更新 API 端点地址

根据你的 Worker 部署方式，更新 i18n 翻译文件中的 API 地址：

**文件位置**: `i18n/zh.toml`, `i18n/en.toml`, `i18n/ru.toml`

```toml
[api_endpoint]
# 方式一：使用自定义域名
other = "https://api.yhytradehub.com/contact"

# 方式二：使用 Cloudflare Workers.dev 预览域名
other = "https://yhy-contact-form.your-subdomain.workers.dev/contact"

# 方式三：使用相对路径（如果配置了 Pages 路由）
other = "/api/contact"
```

### 本地测试

部署完成后，可以使用以下命令测试 Worker：

```bash
# 本地启动开发服务器
wrangler dev --env dev --local

# 或测试已部署的 Worker
curl -X POST https://your-worker-url/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+86 138 0013 8000",
    "message": "This is a test message",
    "lang": "zh"
  }'
```

## 常见问题

### Q1: 邮件发送失败？

**检查项：**
1. 确认 Resend API 密钥正确且有效
2. 确认收件人邮箱格式正确
3. 如果使用自定义域名发件人，确认域名已验证
4. 查看 Cloudflare Dashboard → Workers → 查看 Worker 日志

### Q2: 如何查看 Worker 日志？

```bash
# 使用 Wrangler 查看实时日志
wrangler tail --env production

# 在 Dashboard 中查看
# Workers & Pages → 选择 Worker → Logs
```

### Q3: 如何设置速率限制？

当前 Worker 已内置简单速率限制（每 IP 每分钟 5 次请求）。如需更严格的限制，可以使用 Cloudflare 的 WAF 规则或 KV 存储。

### Q4: 邮件没有收到？

1. 检查垃圾邮件文件夹
2. 确认邮箱域名没有阻止发送方
3. 在 Resend Dashboard 查看发送记录和状态

### Q5: 跨域问题（CORS）？

当前 Worker 已配置 CORS 头，允许所有来源的请求。如需限制特定域名，可以修改 `corsHeaders`：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yhytradehub.com',
  // 其他配置...
};
```

## 维护和监控

### 监控

- **Cloudflare Analytics**: Dashboard → Workers & Pages → Analytics
- **Resend Dashboard**: 查看邮件发送统计、退订情况
- **Error Tracking**: 配置错误告警，及时发现并解决问题

### 更新

代码更新后，使用以下命令重新部署：

```bash
cd cloudflare-workers/contact-form
wrangler deploy --env production
```

### 回滚

```bash
# 查看部署历史
wrangler deployments list --env production

# 回滚到指定版本
wrangler rollback <deployment-id> --env production
```

## 安全建议

1. **保护 API 密钥**：不要将密钥提交到代码仓库，使用 `wrangler secret`
2. **限制访问**：通过 Cloudflare Access 或 WAF 规则限制管理接口访问
3. **定期轮换密钥**：定期更换 Resend API 密钥
4. **监控异常**：设置异常流量告警，防止滥用
5. **使用 HTTPS**：确保所有通信都通过 HTTPS

## 费用说明

- **Cloudflare Workers**: 每天 100,000 次免费请求，超出部分 $5/百万请求
- **Resend**: 每天 100 封免费邮件，超出部分按量付费（$0.015/封起）

对于中小型商业网站，当前配置通常在免费额度内。
