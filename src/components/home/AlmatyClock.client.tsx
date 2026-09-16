"use client";

import { useAlmatyTime } from "@/lib/hooks";

/** Живые часы Алматы для статус-строки. До гидратации — «--:--» (без сдвига макета). */
export default function AlmatyClock() {
  const t = useAlmatyTime();
  return (
    <time suppressHydrationWarning aria-label="время в Алматы">
      {t || "--:--"}
    </time>
  );
}
