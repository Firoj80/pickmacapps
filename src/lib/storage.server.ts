import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_BUCKET = "app-images";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
};

let bucketChecked = false;

async function ensurePublicBucket(supabaseUrl: string, serviceKey: string, bucket: string) {
  if (bucketChecked) return;
  const checkRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
    },
  });
  if (checkRes.ok) {
    bucketChecked = true;
    return;
  }
  const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: MAX_UPLOAD_BYTES,
      allowed_mime_types: ["image/webp", "image/png", "image/jpeg", "image/gif"],
    }),
  });
  if (createRes.ok || createRes.status === 409) {
    bucketChecked = true;
    return;
  }
  const errText = await createRes.text().catch(() => "");
  throw new Error(`Supabase bucket setup failed (${createRes.status}): ${errText}`);
}

/**
 * Uploads an image Blob to Supabase Storage (`app-images` public bucket) when configured,
 * falling back to local `public/uploads/` in local dev when Supabase env vars are absent.
 */
export async function uploadAppImage(
  file: Blob,
  folder: "submissions" | "admin" | "gallery" = "gallery",
): Promise<{ url: string }> {
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();
  const ext = ALLOWED_MIME_EXT[mime];
  if (!ext) {
    throw new Error("Unsupported image format. Please upload WebP, PNG, JPG, or GIF.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error("Uploaded image file is empty.");
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error("Image exceeds the 5 MB limit.");
  }

  const filename = `${folder}/${randomUUID()}.${ext}`;
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceKey) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
    await ensurePublicBucket(supabaseUrl, serviceKey, bucket);

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${filename}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        "content-type": mime,
        "x-upsert": "true",
        "cache-control": "31536000",
      },
      body: bytes,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      throw new Error(`Supabase upload failed (${uploadRes.status}): ${errText}`);
    }

    return {
      url: `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${filename}`,
    };
  }

  // Local dev fallback when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set
  const localName = `${randomUUID()}.${ext}`;
  const uploadDir = path.resolve(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(uploadDir, { recursive: true });
  await fs.promises.writeFile(path.join(uploadDir, localName), bytes);
  return { url: `/uploads/${localName}` };
}
