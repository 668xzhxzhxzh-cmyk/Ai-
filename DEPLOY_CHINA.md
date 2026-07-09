# 中国境内可访问部署方案

本项目已经改成浏览器只请求本站同源 `/api/*`，Supabase 和 DeepSeek 都由 Next.js 服务端调用。这样会员手机不需要直接访问 Supabase，也不会加载海外图片 CDN。

## 推荐入口

首选用 EdgeOne Makers / 腾讯云部署一个中国境内更稳定可访问的正式入口。Vercel 可以继续保留为全球备用站，但不建议把 `*.vercel.app` 当作大陆会员主入口。

依据：

- Vercel 官方知识库说明，Vercel 没有中国大陆基础设施，`.vercel.app` 子域名在大陆可能被阻断或限速。
- EdgeOne Makers 官方 Next.js 文档说明支持 Next.js 13.5+、14、15、16，并支持 App Router、SSR、Route Handlers、RSC。
- EdgeOne Makers 默认 Next.js 构建命令是 `npm run build`，输出目录是 `.next`。
- EdgeOne Makers 构建文档支持在平台里配置环境变量，也支持批量导入 `.env` 格式变量。

官方文档：

- https://vercel.com/kb/guide/accessing-vercel-hosted-sites-from-mainland-china
- https://pages.edgeone.ai/document/framework-nextjs
- https://pages.edgeone.ai/document/build-guide
- https://pages.edgeone.ai/document/deployment-overview

## EdgeOne Makers 配置

1. 在 EdgeOne Makers 新建项目，导入 GitHub 仓库 `668xzhxzhxzh-cmyk/Ai-`。
2. Framework 选择 Next.js。
3. Build command 使用 `npm run build`。
4. Output directory 使用 `.next`。
5. 生产环境变量填写下面这些名字和值。

```bash
SUPABASE_URL=https://rufkeckqicyqzmfaeual.supabase.co
SUPABASE_ANON_KEY=填 Supabase Publishable key 或 anon public key
SUPABASE_SERVICE_ROLE_KEY=填 Supabase Secret key 或 service_role key
DEEPSEEK_API_KEY=填 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=填你的正式国内访问域名
```

不要把真实 key 写进代码、README、截图或 GitHub。只填在部署平台环境变量里。

## GitHub Actions 手动部署

仓库里已经提供 `.github/workflows/deploy-edgeone.yml`。它不会自动运行，需要在 GitHub Actions 里手动触发。

先在 GitHub 仓库 Settings -> Secrets and variables -> Actions 添加：

```text
EDGEONE_PAGES_API_TOKEN
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
NEXT_PUBLIC_SITE_URL
```

然后进入 Actions -> Deploy EdgeOne Makers -> Run workflow。默认项目名是：

```text
ai-shaofeng-fitness
```

这个 workflow 会先跑 `npm run build`，再执行：

```bash
npx edgeone makers deploy -n ai-shaofeng-fitness -e production -a global -t "$EDGEONE_PAGES_API_TOKEN" --json
```

注意：运行时环境变量仍建议在 EdgeOne Makers 控制台的项目环境变量里配置一份，确保服务端函数运行时也能读取 Supabase 和 DeepSeek key。

## Supabase 配置

Supabase Auth 的 Site URL 和 Redirect URLs 需要加入正式国内域名：

```text
https://你的正式国内域名
https://你的正式国内域名/auth
```

如果继续保留 Vercel 备用站，也保留对应的 Vercel 域名。

## 验证清单

部署完成后打开：

```text
https://你的正式国内域名/api/health
```

期望看到：

- `checks.app` 为 `true`
- `checks.supabase` 为 `true`
- `checks.deepseek` 为 `true`

然后用手机不连 VPN 访问正式国内域名，检查：

- 首页
- 登录/注册
- 仪表盘
- 计划
- 打卡
- 进度
- 问答
- 后台

## 如果 Supabase 仍然慢或不可达

当前代码支持服务端代理：

```bash
SUPABASE_FETCH_PROXY=http://your-proxy
```

只有当 EdgeOne/腾讯云服务端访问 Supabase 仍不稳定时才需要使用。长期最稳方案是把数据库和认证迁移到国内可用的 PostgreSQL/Auth 服务。
