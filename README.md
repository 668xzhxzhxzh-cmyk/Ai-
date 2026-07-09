# AI邵峰健身

一个可本地运行、可部署到 Vercel 或 EdgeOne Makers 的 AI + 真人监督健身会员管理 MVP。技术栈：Next.js、TypeScript、Tailwind CSS、Supabase Auth/Database、DeepSeek API、Recharts。

## 功能

- 注册/登录：Supabase Auth，按 `profiles.role` 区分 member/admin
- 会员端：`/onboarding` 资料填写、`/plans` 训练计划和饮食建议、`/checkin` 每日打卡、AI 每日分析、`/chat` AI 问答、`/progress` 进度曲线
- 管理端：`/admin` 会员列表、风险提醒、未打卡提醒，`/admin/members/[id]` 单个会员详情、处理任务、一键生成下周计划
- AI：所有生成和问答都在 API route 服务端调用 DeepSeek，不把 API Key 暴露到前端
- 国内访问：浏览器只请求本站同源 `/api/*`，Supabase 和 DeepSeek 由服务端调用，减少大陆会员直连海外服务失败的概率
- 安全：风险关键词、疼痛/疲劳/睡眠阈值检测，自动创建 `admin_tasks`
- 双语：中文/英文切换，AI 输出按用户语言生成

## 页面

- `/`：品牌介绍和登录/注册入口，不展示假打卡数据
- `/auth`：Supabase Auth 登录/注册
- `/onboarding`：首次登录后填写完整会员资料，保存到 `member_profiles`
- `/dashboard`：会员真实资料、最新训练计划、最新饮食计划、今日打卡入口、AI 最新建议
- `/plans`：分别调用 DeepSeek 生成训练计划、饮食建议，并保存到 `training_plans`、`nutrition_plans`
- `/checkin`：每日打卡，保存到 `daily_checkins`，再调用 DeepSeek 生成 `ai_daily_reviews`
- `/progress`：使用真实打卡数据绘制体重、训练、饮食、睡眠、疲劳、疼痛趋势
- `/chat`：DeepSeek 问答，聊天记录保存到 `ai_chat_messages`
- `/admin`：管理员查看所有会员、最近打卡、风险状态、人工跟进状态
- `/admin/members/[id]`：管理员查看单个会员资料、计划、打卡、AI 分析、聊天、风险提醒

## 本地安装

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=

# 兼容旧 Vercel 配置，可留空。新部署优先使用 SUPABASE_URL / SUPABASE_ANON_KEY。
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 和 `DEEPSEEK_API_KEY` 都只放在部署平台或 `.env.local`，不能写进前端代码。`NEXT_PUBLIC_SUPABASE_*` 仅用于兼容旧 Vercel 环境变量，本项目浏览器端不再直接创建 Supabase 客户端。

## 配置 Supabase

1. 在 Supabase 创建项目。
2. Project Settings -> API 复制 Project URL、anon public key、service_role key。
3. SQL Editor 中执行 `supabase/schema.sql`。
4. Authentication -> Providers 确认 Email 可用。
5. Authentication -> URL Configuration：
   - 生产 Site URL: `https://你的正式域名`
   - Redirect URLs 添加：
     - `https://你的正式域名`
     - `https://你的正式域名/auth`
     - `http://127.0.0.1:3000`
     - `http://127.0.0.1:3000/auth`
     - `http://localhost:3000`
     - `http://localhost:3000/auth`

## 创建管理员账号

先在网站注册一个账号，然后到 Supabase SQL Editor 执行：

```sql
update public.profiles
set role = 'admin', name = 'Admin'
where user_id = (
  select id from auth.users where email = '你的管理员邮箱'
);
```

重新登录后会进入管理员后台。

## 配置 DeepSeek

在 DeepSeek 控制台创建 API Key，填入：

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

如果本地暂时没有配置 `DEEPSEEK_API_KEY`，普通页面仍可打开；点击生成计划、提交 AI 分析或聊天时，页面会提示 `DeepSeek API 未配置`，不会写入假的 AI 内容。

## 本地完整测试流程

1. 执行 `npm install`。
2. 在 Supabase SQL Editor 执行 [supabase/schema.sql](supabase/schema.sql)。
3. 配置 `.env.local` 里的 Supabase 和 DeepSeek 环境变量。
4. 执行 `npm run dev`，打开 `http://localhost:3000`。
5. 打开 `/auth` 注册普通会员。
6. 登录后进入 `/onboarding`，填写身体资料并保存。
7. 进入 `/dashboard`，确认看到真实会员资料入口和计划/打卡/进度/问答入口。
8. 打开 `/plans`，分别点击生成训练计划、生成饮食建议。
9. 打开 `/checkin`，提交体重、训练完成度、饮食执行率、睡眠、疲劳、疼痛、备注。
10. 查看打卡后生成的 AI 每日分析。
11. 打开 `/progress`，确认图表来自刚才的打卡数据。
12. 打开 `/chat`，提问训练或饮食问题，确认聊天记录保存。
13. 注册第二个账号，按“创建管理员账号”的 SQL 把它设为 `admin`。
14. 管理员登录 `/admin`，查看会员列表、最近打卡、风险状态。
15. 点击会员详情进入 `/admin/members/[id]`，查看资料、计划、打卡、AI 分析、聊天、风险提醒。

## 风险提醒测试

在会员资料、每日打卡备注或聊天问题里输入 `胸痛`、`头晕`、`呕吐`、`膝盖痛`、`断食` 等关键词。系统会：

- 标记 `need_human_review = true`
- 创建 `admin_tasks`
- 管理员后台显示风险提醒
- DeepSeek prompt 会要求保守回复，避免激进训练和极端饮食建议

## 部署到 Vercel

1. 创建 GitHub 仓库并推送：

```bash
git init
git add .
git commit -m "chore: prepare production deployment"
git branch -M main
git remote add origin https://github.com/你的用户名/ai-shaofeng-fitness.git
git push -u origin main
```

2. 在 Vercel 导入 GitHub 项目。
3. Framework 选择 Next.js。
4. Environment Variables 中配置 `.env.local` 里的所有变量。
5. 部署完成后，把 Vercel 域名加入 Supabase Auth 的 Site URL 和 Redirect URLs。

## 中国境内免 VPN 访问

Vercel 官方知识库说明，Vercel 没有中国大陆基础设施，`.vercel.app` 子域名在大陆可能被阻断或限速。因此大陆会员主入口建议部署到 EdgeOne Makers / 腾讯云，并绑定正式国内可访问域名。

本项目的国内部署说明见 [DEPLOY_CHINA.md](DEPLOY_CHINA.md)。

关键点：

- EdgeOne Makers 支持 Next.js 13.5+、14、15、16，并支持 App Router、SSR、Route Handlers。
- 构建命令：`npm run build`
- 输出目录：`.next`
- 环境变量使用 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`DEEPSEEK_API_KEY` 等服务端变量。
- 真实 Key 只填在部署平台，不提交到 GitHub。
- 部署后打开 `/api/health` 检查 Supabase 和 DeepSeek 是否连通。
- 仓库包含手动触发的 GitHub Actions：`Deploy EdgeOne Makers`，需要先添加 `EDGEONE_PAGES_API_TOKEN` 等 GitHub Secrets。

## Cloudflare 绑定正式域名

1. 在 Cloudflare 添加你的域名并按提示切换 nameserver。
2. 在 Vercel Project -> Settings -> Domains 添加自定义域名。
3. 按 Vercel 提示在 Cloudflare DNS 中添加 CNAME 或 A 记录。
4. 代理状态可先使用 DNS only，确认成功后再按需要开启 Cloudflare 代理。
5. 把正式域名加入 Supabase Auth URL Configuration。

## 为什么不能用 GitHub Pages

GitHub Pages 只适合静态站点。本项目需要登录、数据库、服务端 DeepSeek API 调用、管理员后台和私密环境变量，所以必须部署到 Vercel、Node.js 服务器或其他支持服务端运行时的平台。

## 以后迁移到阿里云 / 腾讯云服务器

项目是标准 Next.js 应用，可以迁移到自有服务器：

1. 在服务器安装 Node.js。
2. 配置同样的环境变量。
3. 执行 `npm install && npm run build && npm run start`。
4. 用 Nginx/Caddy 做 HTTPS 和反向代理。
5. Supabase 可继续托管使用，也可以后续迁移到自建 PostgreSQL 与认证系统。

## 重要安全原则

- DeepSeek Key 和 Supabase Service Role Key 只允许服务端读取。
- 高风险资料、打卡、聊天会写入 `admin_tasks`。
- AI 对疼痛、伤病、疾病、药物、极端节食等只给保守建议，并提示人工教练或医生评估。
