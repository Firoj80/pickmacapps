import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fieldClass } from "@/components/admin-shell";

type AttachedImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  source: "uploaded" | "external";
};

export function RichGuideEditor({
  isNew,
  slug: initialSlug = "",
  title: initialTitle = "",
  excerpt: initialExcerpt = "",
  html: initialHtml = "",
  status: initialStatus = "draft",
}: {
  isNew: boolean;
  slug?: string;
  title?: string;
  excerpt?: string;
  html?: string;
  status?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialHtml || "<p></p>");
  const [status, setStatus] = useState(initialStatus || "draft");
  const [mode, setMode] = useState<"write" | "split" | "preview">("split");
  const [isSlugLocked, setIsSlugLocked] = useState(!isNew && Boolean(initialSlug));

  // Image Attachments State
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-slugify title
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isSlugLocked) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  }

  // Word count & Reading Time
  const stats = useMemo(() => {
    const textOnly = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = textOnly ? textOnly.split(" ").length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  // Insert HTML snippet at cursor position
  function insertAtCursor(before: string, after: string = "", placeholder: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || placeholder;

    const replacement = `${before}${selected}${after}`;
    const nextValue =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    setContent(nextValue);

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    }, 0);
  }

  // Upload Image File to Server
  async function handleFileUpload(file: File) {
    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed. Make sure it's a valid image.");
      }

      const data = (await res.json()) as { ok: boolean; url: string };
      if (!data.url) throw new Error("Server did not return image URL");

      const newImage: AttachedImage = {
        id: Math.random().toString(36).substring(2),
        url: data.url,
        alt: file.name.replace(/\.[^/.]+$/, ""),
        caption: "",
        source: "uploaded",
      };

      setAttachedImages((prev) => [newImage, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Add Image by URL
  function handleAddExternalImage() {
    if (!externalUrl.trim()) return;

    const newImage: AttachedImage = {
      id: Math.random().toString(36).substring(2),
      url: externalUrl.trim(),
      alt: imageAlt.trim() || "Guide illustration",
      caption: imageCaption.trim(),
      source: "external",
    };

    setAttachedImages((prev) => [newImage, ...prev]);
    setExternalUrl("");
    setImageAlt("");
    setImageCaption("");
    setShowImageModal(false);
  }

  // Insert Image Figure into Editor
  function insertImageIntoContent(img: AttachedImage) {
    const captionHtml = img.caption
      ? `\n  <figcaption class="mt-2 text-center text-xs text-muted">${img.caption}</figcaption>`
      : "";
    const figureHtml = `\n<figure class="my-6 overflow-hidden rounded-2xl border border-line bg-stone-50/50 p-2 shadow-xs">\n  <img src="${img.url}" alt="${img.alt || "Article illustration"}" class="w-full rounded-xl object-cover" />${captionHtml}\n</figure>\n`;

    insertAtCursor(figureHtml);
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/guides"
            preload="intent"
            className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-stone-50"
          >
            ← Back to Guides
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>~{stats.minutes} min read</span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              mode === "write" ? "bg-ink text-canvas shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            ✏️ Write
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              mode === "split" ? "bg-ink text-canvas shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            ⚡ Split
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              mode === "preview" ? "bg-ink text-canvas shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      <form method="post" action="/api/admin/guides" className="space-y-6">
        {isNew ? (
          <input type="hidden" name="is_new" value="1" />
        ) : (
          <input type="hidden" name="original_slug" value={initialSlug} />
        )}

        {/* Title & Slug Header */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink">
              Post Title *
            </label>
            <input
              name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. 10 Best Mac Productivity Apps for Developers in 2026"
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-display text-xl font-bold tracking-tight text-ink outline-none transition placeholder:text-muted focus:border-ink"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-ink">Slug / URL Path *</label>
                <button
                  type="button"
                  onClick={() => setIsSlugLocked(!isSlugLocked)}
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  {isSlugLocked ? "🔒 Locked (Click to edit)" : "🔓 Unlocked (Auto from title)"}
                </button>
              </div>
              <div className="mt-1 flex items-center rounded-xl border border-line bg-stone-50/50 px-3.5 py-2 text-xs text-muted">
                <span className="shrink-0 text-stone-400">/blog/</span>
                <input
                  name="slug"
                  value={slug}
                  readOnly={isSlugLocked}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-slug"
                  required
                  className="w-full bg-transparent font-mono font-medium text-ink outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-ink">Publish Status</label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option value="draft">Draft (Hidden from blog)</option>
                <option value="published">Published (Visible immediately)</option>
                <option value="unpublished">Unpublished (Archived)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-ink">
              Excerpt / Summary
            </label>
            <textarea
              name="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="A brief 1-2 sentence hook for search engines and social cards..."
              className={fieldClass}
            />
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-white p-2 shadow-xs sticky top-4 z-20">
          <button
            type="button"
            title="Heading 2"
            onClick={() => insertAtCursor('<h2 class="mt-8 text-2xl font-bold tracking-tight text-ink">', "</h2>", "Section Heading")}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-stone-100"
          >
            H2
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => insertAtCursor('<h3 class="mt-6 text-xl font-semibold text-ink">', "</h3>", "Sub-heading")}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-stone-100"
          >
            H3
          </button>
          <span className="h-4 w-px bg-line mx-1" />
          <button
            type="button"
            title="Bold"
            onClick={() => insertAtCursor("<strong>", "</strong>", "bold text")}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-stone-100"
          >
            B
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => insertAtCursor("<em>", "</em>", "italic text")}
            className="rounded-lg px-2.5 py-1.5 text-xs italic text-ink hover:bg-stone-100"
          >
            I
          </button>
          <button
            type="button"
            title="Link"
            onClick={() => {
              const url = prompt("Enter link URL:", "https://");
              if (url) insertAtCursor(`<a href="${url}" class="font-medium text-ink underline" target="_blank" rel="noreferrer">`, "</a>", "link text");
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-stone-100"
          >
            🔗 Link
          </button>
          <span className="h-4 w-px bg-line mx-1" />
          <button
            type="button"
            title="Bullet List"
            onClick={() => insertAtCursor('<ul class="my-4 list-disc space-y-2 pl-6 text-body">\n  <li>', "</li>\n  <li>Second item</li>\n</ul>", "First item")}
            className="rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-stone-100"
          >
            • List
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => insertAtCursor('<ol class="my-4 list-decimal space-y-2 pl-6 text-body">\n  <li>', "</li>\n  <li>Second item</li>\n</ol>", "Step 1")}
            className="rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-stone-100"
          >
            1. List
          </button>
          <button
            type="button"
            title="Quote"
            onClick={() => insertAtCursor('<blockquote class="my-6 border-l-4 border-ink pl-4 italic text-body">\n  ', "\n</blockquote>", "A notable quote...")}
            className="rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-stone-100"
          >
            ❝ Quote
          </button>
          <button
            type="button"
            title="Pro Tip Box"
            onClick={() => insertAtCursor('<div class="my-6 rounded-2xl border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-950">\n  <strong class="font-semibold">💡 Pro Tip:</strong> ', "\n</div>", "Here is an insider Mac workflow tip.")}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50"
          >
            💡 Tip Box
          </button>
          <span className="h-4 w-px bg-line mx-1" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-stone-200 transition"
          >
            <span>📷</span>
            <span>Upload Image</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-stone-50 transition"
          >
            <span>🌐</span>
            <span>Image by URL</span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>

        {uploadError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {uploadError}
          </p>
        ) : null}

        {isUploading ? (
          <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 animate-pulse">
            <span>⏳ Uploading image file to server...</span>
          </div>
        ) : null}

        {/* Attached Images Gallery Shelf */}
        {attachedImages.length > 0 ? (
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <span>🖼️</span> Attached Images ({attachedImages.length})
              </span>
              <span className="text-[11px] text-muted">Click &quot;Insert&quot; to place image at cursor</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {attachedImages.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-xl border border-line bg-stone-50 p-2 shadow-2xs">
                  <img src={img.url} alt={img.alt} className="h-24 w-full rounded-lg object-cover" />
                  <p className="mt-1 truncate text-[11px] font-medium text-ink">{img.alt || "Image"}</p>
                  <p className="truncate text-[10px] text-muted">{img.url}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertImageIntoContent(img)}
                      className="flex-1 rounded-lg bg-ink px-2 py-1 text-[11px] font-semibold text-canvas hover:opacity-90 transition"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(img.url)}
                      title="Copy URL"
                      className="rounded-lg border border-line bg-white px-2 py-1 text-[11px] text-muted hover:text-ink transition"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Editor Body Grid (Write / Split / Preview) */}
        <div
          className={`grid gap-4 ${
            mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Write Pane */}
          {mode !== "preview" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted">
                <span>HTML / Markdown Body Content</span>
                <span>Type content or use the toolbar above</span>
              </div>
              <textarea
                ref={textareaRef}
                name="html"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={22}
                required
                placeholder="Write your article in HTML or markdown format..."
                className="w-full rounded-2xl border border-line bg-white p-4 font-mono text-xs leading-relaxed text-ink shadow-xs outline-none transition focus:border-ink"
              />
            </div>
          ) : null}

          {/* Preview Pane */}
          {mode !== "write" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted">
                <span>Live Reader Preview</span>
                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                  Matches Public Guide Style
                </span>
              </div>
              <div className="min-h-[440px] max-h-[580px] overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xs">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {title || "Untitled Post"}
                </h1>
                {excerpt ? (
                  <p className="mt-2 text-sm leading-relaxed text-body italic border-b border-line pb-4">
                    {excerpt}
                  </p>
                ) : null}
                <div
                  className="blog-body mt-4 text-[14.5px] leading-relaxed text-body"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-line pt-5">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:opacity-90 shadow-xs"
            >
              {isNew ? "Publish Guide" : "Save Changes"}
            </button>
            <Link
              to="/admin/guides"
              preload="intent"
              className="text-sm font-medium text-muted hover:text-ink transition"
            >
              Cancel
            </Link>
          </div>

          {!isNew ? (
            <button
              type="submit"
              name="intent"
              value="delete"
              onClick={(e) => {
                if (!confirm("Are you sure you want to permanently delete this guide?")) {
                  e.preventDefault();
                }
              }}
              className="text-sm font-medium text-rose-600 hover:underline"
            >
              Delete Guide
            </button>
          ) : null}
        </div>
      </form>

      {/* External Image Dialog Modal */}
      {showImageModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-semibold text-ink text-sm">Attach Image by URL</h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-muted hover:text-ink font-bold"
              >
                ×
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink">Image URL *</label>
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink">Alt Text</label>
              <input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Brief description for accessibility"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink">Caption (Optional)</label>
              <input
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Appears directly under image"
                className={fieldClass}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-xl border border-line px-3.5 py-2 text-xs font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddExternalImage}
                disabled={!externalUrl.trim()}
                className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas disabled:opacity-50"
              >
                Attach Image
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
