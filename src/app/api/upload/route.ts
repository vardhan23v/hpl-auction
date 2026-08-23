import { v2 as cloudinary } from "cloudinary";
import { json, fail } from "@/lib/api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("file required");
  if (file.size > 5 * 1024 * 1024) return fail("Max 5MB");
  if (!file.type.startsWith("image/")) return fail("Images only");
  const buf = Buffer.from(await file.arrayBuffer());

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: "hpl", resource_type: "image" }, (err, res) => (err || !res ? reject(err) : resolve(res.secure_url))).end(buf);
    });
    return json({ url });
  }
  // Fallback for local dev without Cloudinary: write to public/uploads
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.name) || ".jpg"}`;
  await writeFile(path.join(dir, name), buf);
  return json({ url: `/uploads/${name}` });
}
