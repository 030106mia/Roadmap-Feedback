# Filo Roadmap

一个给项目经理使用的 **Roadmap 管理工具**：支持按板块（功能域）管理条目，给需求排期、标记优先级、记录需求来源，并把每次变动写入数据库（可追溯）。

## 功能（MVP）

- **板块（Board）**：创建/重命名/删除
- **Roadmap 条目（Item）**：
  - 短标题、描述、描述图（图片 URL）、需求来源
  - 优先级（P0/P1/P2/P3）、状态（Planned/In Progress/Done）
  - 排期（开始/结束日期）
- **变更记录（Audit Log）**：对板块/条目的新增、修改、删除会写入审计表
- **数据库**：Postgres（多人共享），使用 Prisma 管理 schema

## 本地启动

1) 安装依赖

```bash
npm i
```

2) 配置环境变量

```bash
cp env.example .env
# 然后在 .env 里填写 DATABASE_URL（Postgres）
```

3) 初始化数据库（创建表）

```bash
npm run db:push
```

4) 启动开发服务

```bash
npm run dev
```

打开 `http://localhost:3000`

## 数据库

- Prisma Schema：`prisma/schema.prisma`
- 连接串：`DATABASE_URL`（在 `.env` 或 Vercel 环境变量中配置）

## 部署到 Vercel（获得 `xxx.vercel.app`）

> 目标：把项目部署成公网地址，给其他人一起使用同一份数据。

### 1) 准备：把代码放到 GitHub

Vercel 推荐从 GitHub 导入项目做持续部署。

### 2) 在 Vercel 创建数据库（Postgres）

- 在 Vercel 控制台创建 **Postgres**（或使用 Neon/Supabase 均可）
- 拿到连接串，设置到 Vercel 项目的环境变量：
  - **`DATABASE_URL`**

### 3) 配置图片上传（可选但推荐）

本项目的“用户夸赞/反馈图片”上传在部署环境下使用 **Vercel Blob**：

- 在 Vercel 控制台创建 **Blob**
- 设置环境变量：
  - **`BLOB_READ_WRITE_TOKEN`**

不配这个变量也能跑，但上传会退化为写本地磁盘（在 Vercel 上不持久，不适合生产）。

### 4) 导入并部署

在 Vercel 里 Import 你的 GitHub repo，部署成功后会得到类似：
`https://your-project-name.vercel.app`

## 后续可扩展

- 条目拖拽排序、看板/时间轴（Gantt）视图
- 图片上传（而不仅是 URL）
- 多用户/权限、团队协作与评论
