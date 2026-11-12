import type { Case } from "@/content/types";

/** Настроение работ (фильтр /work и теги в титрах). Отдельный файл без JSON-импортов: безопасно для клиентских компонентов. */
export const moods: { key: Case["mood"][number]; label: string }[] = [
  { key: "bold", label: "Дерзкие" },
  { key: "gentle", label: "Нежные" },
  { key: "documentary", label: "Документальные" },
];
