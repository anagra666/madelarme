"use client";

import { useEffect } from "react";
import { setStickyPrefill } from "@/components/layout/StickyCTA";
import type { PrefillKind } from "@/lib/links";

/**
 * Страничный текст предзаполнения WhatsApp/Telegram для sticky-полосы, меню и панели контактов.
 * Рендерить в серверной странице: <PrefillSetter kind="case" title={c.title} />.
 * Store привязан к pathname — при уходе со страницы сам вернётся к prefill("home").
 */
export default function PrefillSetter({ kind, title }: { kind: PrefillKind; title?: string }) {
  useEffect(() => {
    setStickyPrefill(kind, title);
  }, [kind, title]);
  return null;
}
