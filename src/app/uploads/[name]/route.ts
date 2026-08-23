import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

/** Serves uploaded images at runtime (public/ is frozen at build time in production). */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w.-]+$/.test(name)) return new NextResponse("Bad name", { status: 400 });
  const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  try {
    const buf = await readFile(path.join(dir, name));
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "public, max-age=86400" } });
  } catch { return new NextResponse("Not found", { status: 404 }); }
}
