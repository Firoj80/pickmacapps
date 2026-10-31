export function GuideForm({
  isNew,
  slug,
  title,
  excerpt,
  html,
  status,
}: {
  isNew: boolean;
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  status: string;
}) {
  return (
    <form method="post" action="/api/admin/guides" className="mt-6 space-y-3">
      {isNew ? <input type="hidden" name="is_new" value="1" /> : <input type="hidden" name="original_slug" value={slug} />}
      <input name="title" defaultValue={title} required aria-label="Title" className="w-full rounded-lg border border-line px-3 py-2" />
      <input name="slug" defaultValue={slug} aria-label="Slug" placeholder="slug" className="w-full rounded-lg border border-line px-3 py-2" />
      <input name="excerpt" defaultValue={excerpt} aria-label="Excerpt" className="w-full rounded-lg border border-line px-3 py-2" />
      <textarea name="html" defaultValue={html} aria-label="HTML" rows={16} className="w-full rounded-lg border border-line px-3 py-2 font-mono text-xs" />
      <select name="status" defaultValue={status} aria-label="Status" className="w-full rounded-lg border border-line px-3 py-2">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="unpublished">Unpublished</option>
      </select>
      <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-canvas">
        Save
      </button>
      {isNew ? null : (
        <button type="submit" name="intent" value="delete" className="ml-4 text-sm text-amber-900 underline">
          Delete
        </button>
      )}
    </form>
  );
}
