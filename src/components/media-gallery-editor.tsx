import { useRef, useState } from "react";
import { MAX_GALLERY_IMAGES, parseYouTubeVideoId } from "@/lib/catalog";

async function compressToWebP(file: File): Promise<Blob> {
  // Keep animated GIFs or non-browser environments untouched
  if (file.type === "image/gif" || typeof document === "undefined") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const maxW = 1600;
    const scale = bitmap.width > maxW ? maxW / bitmap.width : 1;
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.82);
    });
    if (webpBlob && webpBlob.size > 0 && webpBlob.size < file.size * 1.15) {
      return webpBlob;
    }
    return file;
  } catch {
    return file;
  }
}

export function MediaGalleryEditor({
  galleryImages,
  onGalleryChange,
  youtubeUrl,
  onYoutubeChange,
  includeHiddenInputs = false,
  uploadEndpoint = "/api/upload",
}: {
  galleryImages: string[];
  onGalleryChange: (next: string[]) => void;
  youtubeUrl: string;
  onYoutubeChange: (next: string) => void;
  includeHiddenInputs?: boolean;
  uploadEndpoint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const remaining = Math.max(0, MAX_GALLERY_IMAGES - galleryImages.length);
  const youtubeId = parseYouTubeVideoId(youtubeUrl);
  const youtubeInvalid = Boolean(youtubeUrl.trim()) && !youtubeId;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed.`);
      return;
    }
    setUploadError("");
    const selected = Array.from(files).slice(0, remaining);
    setUploadingCount(selected.length);

    const uploadedUrls: string[] = [];
    try {
      for (const file of selected) {
        const compressed = await compressToWebP(file);
        const ext = compressed.type === "image/webp" ? "webp" : file.name.split(".").pop() || "png";
        const form = new FormData();
        form.append("file", compressed, `gallery-${Date.now()}.${ext}`);

        const res = await fetch(uploadEndpoint, { method: "POST", body: form });
        const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok || !data.url) {
          throw new Error(data.error || "Image upload failed");
        }
        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        const merged = [...galleryImages, ...uploadedUrls].slice(0, MAX_GALLERY_IMAGES);
        onGalleryChange(merged);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload one or more images.");
    } finally {
      setUploadingCount(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
      setUploadError("Please enter a valid image URL starting with https://");
      return;
    }
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      setUploadError(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed.`);
      return;
    }
    if (galleryImages.includes(trimmed)) {
      setUrlInput("");
      return;
    }
    setUploadError("");
    onGalleryChange([...galleryImages, trimmed].slice(0, MAX_GALLERY_IMAGES));
    setUrlInput("");
  }

  function removeAt(index: number) {
    onGalleryChange(galleryImages.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= galleryImages.length) return;
    const next = [...galleryImages];
    [next[index], next[target]] = [next[target], next[index]];
    onGalleryChange(next);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface-2/40 p-4 sm:p-5">
      {includeHiddenInputs && (
        <>
          <input type="hidden" name="gallery_images" value={JSON.stringify(galleryImages)} />
          <input type="hidden" name="youtube_url" value={youtubeUrl} />
        </>
      )}

      {/* Gallery Upload Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-ink">
              App Gallery Screenshots{" "}
              <span className="font-normal text-muted">(Max {MAX_GALLERY_IMAGES} images, auto-compressed to WebP)</span>
            </p>
            <p className="text-[11px] text-muted">
              Upload screenshots or paste image URLs to showcase your app on its detail page.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink tabular-nums">
            {galleryImages.length} / {MAX_GALLERY_IMAGES}
          </span>
        </div>

        {/* Upload & URL Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={remaining === 0 || uploadingCount > 0}
            onClick={() => fileRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
          >
            {uploadingCount > 0 ? (
              <span>Uploading {uploadingCount}...</span>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload Images</span>
              </>
            )}
          </button>

          <div className="flex flex-1 gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              disabled={remaining === 0}
              placeholder="Or paste screenshot URL (https://...)"
              className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              disabled={remaining === 0 || !urlInput.trim()}
              onClick={handleAddUrl}
              className="shrink-0 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
            >
              Add URL
            </button>
          </div>
        </div>

        {uploadError && <p className="text-xs font-medium text-rose-600">{uploadError}</p>}

        {/* Thumbnail Grid */}
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {galleryImages.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-surface shadow-2xs"
              >
                <img
                  src={src}
                  alt={`Gallery screenshot ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  #{idx + 1}
                </div>
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      title="Move left"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-black/75 text-[11px] font-bold text-white hover:bg-black cursor-pointer"
                    >
                      ←
                    </button>
                  )}
                  {idx < galleryImages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      title="Move right"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-black/75 text-[11px] font-bold text-white hover:bg-black cursor-pointer"
                    >
                      →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    title="Remove image"
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-600/90 text-xs font-bold text-white hover:bg-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* YouTube Video URL Section */}
      <div className="space-y-2 border-t border-line/70 pt-4">
        <label className="block text-xs font-semibold text-ink">
          YouTube Demo Video URL <span className="font-normal text-muted">(Optional)</span>
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => onYoutubeChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
          className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
        {youtubeInvalid && (
          <p className="text-[11px] text-amber-600">
            Enter a valid YouTube link (youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...).
          </p>
        )}
        {youtubeId && (
          <div className="mt-2 overflow-hidden rounded-xl border border-line bg-black aspect-video max-w-md">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title="YouTube video preview"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}
