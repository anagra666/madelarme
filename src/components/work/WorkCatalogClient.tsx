"use client";

import { useSearchParams } from "next/navigation";
import WorkCatalogBody, { type CatalogData } from "@/components/work/WorkCatalogBody";

/** Клиентская часть каталога: читает фильтры из URL (?format=&mood=&city=) и применяет их к данным с сервера. */
export default function WorkCatalogClient({ data }: { data: CatalogData }) {
  const sp = useSearchParams();
  return (
    <WorkCatalogBody
      data={data}
      format={sp.get("format") ?? undefined}
      mood={sp.get("mood") ?? undefined}
      city={sp.get("city") ?? undefined}
    />
  );
}
