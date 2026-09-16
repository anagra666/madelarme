"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Кнопка «скопировать» (email). Показывает «скопировано» на 2 с. */
export default function CopyButton({ text, label = "Скопировать" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? "Скопировано" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* clipboard недоступен (http, in-app) — пользователь выделит вручную */
        }
      }}
      className="mono inline-flex h-11 items-center gap-2 border border-rule px-3 text-meta transition-colors duration-300 hover:border-milk hover:text-milk"
    >
      {done ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {done ? "скопировано" : label}
    </button>
  );
}
