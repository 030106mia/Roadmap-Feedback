export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function extFromMime(mime: string) {
  const m = mime.toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new NextResponse("file is required", { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return new NextResponse("only image upload is supported", { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return new NextResponse("image too large (max 5MB)", { status: 400 });
    }

    const ext = extFromMime(file.type) || file.name.split(".").pop() || "png";
    const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "png";
    const filename = `${randomUUID()}.${safeExt}`;

    const buf = Buffer.from(await file.arrayBuffer());

    // Prefer Vercel Blob in production / shared environment.
    // Fallback to local filesystem in local dev when token is not provided.
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      const blob = await put(`feedback/${filename}`, buf, {
        access: "public",
        contentType: file.type,
        token
      });
      return NextResponse.json({ url: blob.url });
    }

    // Local dev fallback (NOT suitable for Vercel production)
    const dir = path.join(process.cwd(), "public", "uploads", "feedback");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
    return NextResponse.json({ url: `/uploads/feedback/${filename}` });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Bad Request", { status: 400 });
  }
}

