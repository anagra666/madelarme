"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** mailto-ссылка + кнопка «скопировать» (44px), подтверждение через aria-live */
export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      // clipboard недоступен (http / in-app) — просто открываем mailto
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <a href={`mailto:${email}`} className="mono inline-flex min-h-11 items-center normal-case tracking-normal text-milk hover:text-signal">
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Email скопирован" : "Скопировать email"}
        className={cn(
          "grid h-11 w-11 place-items-center border border-transparent text-meta transition-colors hover:border-rule hover:text-milk",
          copied && "text-signal",
        )}
      >
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </button>
      <span aria-live="polite" className="mono-sm text-signal">
        {copied ? "скопировано" : ""}
      </span>
    </span>
  );
}
