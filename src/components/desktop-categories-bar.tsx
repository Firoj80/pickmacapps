import { useEffect, useRef, useState } from "react";

export type CategoryChipItem = {
  id: string;
  name: string;
  emoji?: string;
  count?: number;
};

export function DesktopCategoriesBar({
  categories,
  activeCategory = "all",
  onSelect,
}: {
  categories: CategoryChipItem[];
  activeCategory?: string;
  onSelect?: (slug: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scrollBy = (offset: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkScroll, 250);
  };

  return (
    <div className="hidden lg:block w-full mb-6 select-none">
      <div className="relative flex items-center">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-280)}
            aria-label="Scroll categories left"
            className="absolute -left-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-md backdrop-blur-xs transition hover:scale-105 hover:bg-surface-2 cursor-pointer"
          >
            ‹
          </button>
        )}

        {/* Left Fade Mask */}
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 inset-y-0 z-10 w-8 bg-gradient-to-r from-canvas via-canvas/80 to-transparent"
          />
        )}

        {/* Scrollable Category Chips Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth w-full"
        >
          {categories.map((cat) => {
            const isSelected =
              activeCategory === cat.id ||
              (cat.id === "all" && (!activeCategory || activeCategory === "all"));

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect?.(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-ink text-canvas shadow-xs ring-1 ring-ink"
                    : "border border-line bg-surface/80 text-muted hover:border-line-2 hover:bg-surface hover:text-ink"
                }`}
              >
                {cat.emoji && <span className="text-[12px]">{cat.emoji}</span>}
                <span>{cat.name}</span>
                {typeof cat.count === "number" && (
                  <span
                    className={`ml-0.5 text-[10px] font-normal transition-opacity ${
                      isSelected ? "text-canvas/80" : "text-muted/80"
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Fade Mask */}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 inset-y-0 z-10 w-8 bg-gradient-to-l from-canvas via-canvas/80 to-transparent"
          />
        )}

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy(280)}
            aria-label="Scroll categories right"
            className="absolute -right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-md backdrop-blur-xs transition hover:scale-105 hover:bg-surface-2 cursor-pointer"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
