export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

function contentTypeFromPathname(p: string) {
  const ext = p.toLowerCase().split(".").pop() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

function extractOutputText(payload: any): string {
  if (!payload) return "";
  if (typeof payload.output_text === "string") return payload.output_text;

  const out: string[] = [];
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (typeof c?.text === "string") out.push(c.text);
      if (typeof c?.output_text === "string") out.push(c.output_text);
    }
  }
  return out.join("\n").trim();
}

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-openai-api-key")?.trim();
    const apiKey = headerKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new NextResponse("OPENAI_API_KEY is not set", { status: 500 });
    }

    const body = (await req.json().catch(() => null)) as null | { url?: unknown };
    const url = typeof body?.url === "string" ? body.url : "";
    if (!url) return new NextResponse("url is required", { status: 400 });

    let buf: Buffer;
    let contentType = "application/octet-stream";

    if (url.startsWith("/")) {
      // Only allow reading from /public to avoid arbitrary file reads.
      const safe = url.replace(/^\/+/, "");
      const abs = path.join(process.cwd(), "public", safe);
      const publicRoot = path.join(process.cwd(), "public") + path.sep;
      if (!abs.startsWith(publicRoot)) {
        return new NextResponse("invalid url", { status: 400 });
      }
      buf = await readFile(abs);
      contentType = contentTypeFromPathname(abs);
    } else {
      const r = await fetch(url);
      if (!r.ok) return new NextResponse(await r.text(), { status: r.status });
      const ab = await r.arrayBuffer();
      buf = Buffer.from(ab);
      contentType = r.headers.get("content-type") || contentType;
    }

    const b64 = buf.toString("base64");
    const dataUrl = `data:${contentType};base64,${b64}`;

    const prompt =
      "请从这张截图中提取所有可读文字，只输出纯文本（保留换行），不要解释，不要加标题。";

    const oai = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: dataUrl }
            ]
          }
        ],
        temperature: 0
      })
    });

    if (!oai.ok) {
      const errText = await oai.text();
      return new NextResponse(errText || "OpenAI request failed", {
        status: 500
      });
    }

    const payload = await oai.json();
    const text = extractOutputText(payload);
    return NextResponse.json({ text });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Bad Request", { status: 400 });
  }
}

