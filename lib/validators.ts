import { z } from "zod";

export const prioritySchema = z.enum(["P0", "P1", "P2", "P3"]);
// 兼容早期的 PLANNED（会在服务端/前端统一映射到 BACKLOG）
export const statusSchema = z.enum([
  "BACKLOG",
  "NEXT_UP",
  "IN_PROGRESS",
  "DONE",
  "PLANNED"
]);

export const boardCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional().default(""),
  sortOrder: z.number().int().optional()
});

export const boardUpdateSchema = boardCreateSchema.partial().extend({
  id: z.string().min(1)
});

export const itemCreateSchema = z.object({
  boardId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(20000).optional().default(""),
  source: z.string().trim().max(2000).optional().default(""),
  jiraKey: z.string().trim().max(50).optional().default(""),
  priority: prioritySchema.optional().default("P2"),
  status: statusSchema.optional().default("PLANNED"),
  // tags：用名称传递，服务端会 upsert 并关联
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  // 用 date input（YYYY-MM-DD）更适合 roadmap 排期；后端会转成 DateTime 存库
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  sortOrder: z.number().int().optional()
});

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  id: z.string().min(1)
});

export const itemImageCreateSchema = z.object({
  itemId: z.string().min(1),
  url: z.string().url().max(4000),
  caption: z.string().trim().max(2000).optional().default("")
});

// User Feedback
export const feedbackKindSchema = z.enum(["FEEDBACK", "PRAISE"]);
export const feedbackDeviceSchema = z.enum(["IOS", "MAC", "WIN", "ANDROID", "PC", "-"]);
export const feedbackTypeSchema = z.enum(["REQUEST", "SUGGESTION", "BUG"]);
export const praiseSourceSchema = z.enum(["EMAIL", "STORE", "SOCIAL"]);
export const languageSchema = z.enum(["ZH_CN", "ZH_TW", "EN", "JA", "FR"]);

const feedbackBaseSchema = z.object({
  kind: feedbackKindSchema.optional().default("FEEDBACK"),
  userName: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  device: feedbackDeviceSchema.optional().default("-"),
  feedbackType: feedbackTypeSchema.optional(),
  source: praiseSourceSchema.optional(),
  language: languageSchema.optional(),
  // 允许空内容（选填），存库用空字符串
  content: z.string().trim().max(20000).optional().default(""),
  todo: z.string().trim().max(2000).optional().default(""),
  todoDone: z.boolean().optional().default(false),
  images: z.array(z.string().trim().max(4000)).max(12).optional().default([])
});

export const feedbackCreateSchema = feedbackBaseSchema.superRefine((val, ctx) => {
  // 至少填一项，避免全空记录
  const hasAny =
    !!val.userName.trim() ||
    !!val.email.trim() ||
    !!val.content.trim() ||
    !!val.todo.trim() ||
    (val.kind === "PRAISE" && val.images.length > 0);
  if (!hasAny) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "至少填写用户名/邮箱/内容/待办中的一项（夸赞可仅上传图片）"
    });
  }

  // FEEDBACK：如果传了 feedbackType 就校验其合法性（UI 默认会传）
  // 这里不强制必填（选填要求）
});

export const feedbackUpdateSchema = z
  .object({
    kind: feedbackKindSchema.optional(),
    userName: z.string().trim().max(120).optional(),
    email: z.string().trim().max(200).optional(),
    device: feedbackDeviceSchema.optional(),
    feedbackType: feedbackTypeSchema.optional(),
    source: praiseSourceSchema.optional(),
    language: languageSchema.optional(),
    content: z.string().trim().max(20000).optional(),
    todo: z.string().trim().max(2000).optional(),
    todoDone: z.boolean().optional(),
    images: z.array(z.string().trim().max(4000)).max(12).optional()
  })
  .extend({ id: z.string().min(1) })
  .superRefine(() => {
    // PATCH 不额外强制字段必填（都选填）
  });

