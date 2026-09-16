"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PricingTab {
  key: string;
  label: string;
  content: ReactNode;
}

/** Табы прайса: состояние в hash (#wedding / #brand), панели приходят с сервера как children. */
export default function PricingTabs({ tabs }: { tabs: PricingTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const id = useId();

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h && tabs.some((t) => t.key === h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const select = (key: string) => {
    setActive(key);
    history.replaceState(null, "", `#${key}`);
  };

  return (
    <div>
      <div role="tablist" aria-label="Разделы прайса" className="flex border-y border-rule">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              id={`${id}-tab-${t.key}`}
              aria-selected={on}
              aria-controls={`${id}-panel-${t.key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.key)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const i = tabs.findIndex((x) => x.key === active);
                const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                select(next.key);
                document.getElementById(`${id}-tab-${next.key}`)?.focus();
              }}
              className={cn(
                "disp text-h3 relative flex h-16 flex-1 items-center justify-center px-2 transition-colors duration-300 ease-out-expo md:h-24",
                on ? "text-milk" : "text-meta hover:text-milk",
              )}
            >
              {t.label}
              <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-signal transition-opacity duration-300", on ? "opacity-100" : "opacity-0")} />
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${id}-panel-${t.key}`}
          aria-labelledby={`${id}-tab-${t.key}`}
          hidden={t.key !== active}
          className="pt-8 md:pt-12"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
