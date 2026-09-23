import type { FullVideo } from "@/content/types";

/**
 * Демо-заглушка вместо фильма: self-hosted видео из /media/loops/ — это тот же 6–8-секундный
 * луп, что и в тизере, а duration у него — от будущего фильма. Такой «фильм» не показываем
 * (кнопка «Смотреть фильм», VideoObject в JSON-LD), пока в fullVideo не лежит настоящий файл.
 */
export function isDemoLoop(v?: FullVideo): boolean {
  return !!v && v.provider === "self" && v.id.startsWith("/media/loops/");
}

/** fullVideo, если это настоящий фильм, иначе undefined */
export function realFilm(v?: FullVideo): FullVideo | undefined {
  return v && !isDemoLoop(v) ? v : undefined;
}

/** «N&N — N&N» → «N&N»: клиент в заголовке, только если он отличается от названия */
export function caseTitle(c: { title: string; client: string }): string {
  return c.title === c.client ? c.title : `${c.title} — ${c.client}`;
}
