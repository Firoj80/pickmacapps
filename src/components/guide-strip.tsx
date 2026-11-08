import { Link } from "@tanstack/react-router";
import type { Post } from "@/lib/catalog";

export const guideWashes = ["#0f172a", "#1e1b4b", "#3f1d38", "#1f2937", "#3b1d1d", "#14261c"];

export function GuideStrip({ posts }: { posts: Post[] }) {
  const shown = posts.slice(0, 6);
  if (!shown.length) return null;
  return (
    <section className="mt-20">
      <div className="flex items-center gap-5">
        <h2 className="shrink-0 text-[19px] font-[550] tracking-[-0.025em] text-ink">Guides to the best Mac apps</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <Link
          to="/blog"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-body transition-colors hover:border-line-2 hover:text-ink"
        >
          Read the blog
          <Arrow />
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((post, index) => (
          <GuideCard key={post.slug} post={post} wash={guideWashes[index % guideWashes.length]} />
        ))}
      </div>
    </section>
  );
}

export function GuideCard({ post, wash = "#0f172a" }: { post: Post; wash?: string }) {
  const thumbnailSrc = `/guides/${post.slug}.jpg`;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:border-line-2 hover:shadow-xs"
    >
      <div className="overflow-hidden border-b border-line bg-[#0c0c0e]">
        <div className="relative aspect-[1200/630] overflow-hidden">
          <img
            src={thumbnailSrc}
            alt={post.title}
            loading="lazy"
            decoding="async"
            width={600}
            height={315}
            onError={(e) => {
              // Fallback to stylized gradient banner if custom image fails to load
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.parentElement?.querySelector(".guide-fallback");
              if (fallback) (fallback as HTMLElement).style.display = "flex";
            }}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <div
            className="guide-fallback absolute inset-0 hidden flex-col justify-end p-4"
            style={{ background: `linear-gradient(135deg, ${wash} 0%, #334155 100%)` }}
          >
            <p className="text-base font-semibold tracking-tight text-white">{post.title}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[12px] text-muted">{post.dateLabel}</p>
        <p className="clamp-2 mt-2 text-[14px] leading-relaxed text-body group-hover:text-ink">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function Arrow() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}
