import { Field, fieldClass } from "@/components/admin-shell";

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
    <form method="post" action="/api/admin/guides" className="space-y-4">
      {isNew ? <input type="hidden" name="is_new" value="1" /> : <input type="hidden" name="original_slug" value={slug} />}
      <Field label="Title">
        <input name="title" defaultValue={title} required className={fieldClass} />
      </Field>
      <Field label="Slug" hint="Used in the guide URL.">
        <input name="slug" defaultValue={slug} placeholder="best-clipboard-app" className={fieldClass} />
      </Field>
      <Field label="Excerpt">
        <input name="excerpt" defaultValue={excerpt} className={fieldClass} />
      </Field>
      <Field label="HTML">
        <textarea name="html" defaultValue={html} rows={16} className={`${fieldClass} font-mono text-xs`} />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </Field>
      <div className="flex items-center gap-4">
        <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas">
          Save guide
        </button>
        {isNew ? null : (
          <button type="submit" name="intent" value="delete" className="text-sm text-amber-900 underline">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
