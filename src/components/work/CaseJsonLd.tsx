import type { Case } from "@/content/types";
import { settings } from "@/lib/content";
import { parseDuration } from "@/lib/utils";
import { caseTitle, realFilm } from "@/components/work/film";

/** «08:12» → PT8M12S */
function isoDuration(s: string): string {
  const total = parseDuration(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${sec || (!h && !m) ? `${sec}S` : ""}`;
}

const MONTHS = ["январ", "феврал", "март", "апрел", "ма", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];

/** «июль 2026» → 2026-07-01; без месяца — 1 января года кейса */
function uploadDate(c: Case): string {
  const word = c.date.toLowerCase().match(/[а-яё]+/)?.[0] ?? "";
  const m = word ? MONTHS.findIndex((p) => word.startsWith(p)) : -1;
  return `${c.year}-${String(m >= 0 ? m + 1 : 1).padStart(2, "0")}-01`;
}

function contentUrl(c: Case, site: string): string | undefined {
  /* демо-луп вместо фильма — не контент: ни contentUrl, ни duration от будущего фильма */
  const v = realFilm(c.fullVideo);
  if (!v) return undefined;
  switch (v.provider) {
    case "self":
      return v.id.startsWith("http") ? v.id : `${site}${v.id}`;
    case "youtube":
      return `https://www.youtube.com/watch?v=${v.id}`;
    case "vimeo":
      return `https://vimeo.com/${v.id}`;
    default:
      return undefined;
  }
}

/** JSON-LD VideoObject для страницы кейса. */
export default function CaseJsonLd({ c }: { c: Case }) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://madelarme.kz").replace(/\/$/, "");
  const film = realFilm(c.fullVideo);
  const content = contentUrl(c, site);
  /* тот же URL, что canonical: статический экспорт собирается с trailingSlash */
  const slash = process.env.STATIC_EXPORT === "1" ? "/" : "";
  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: caseTitle(c),
    description: c.seo?.description ?? c.logline,
    thumbnailUrl: [`${site}${c.loop.posterH}`],
    uploadDate: uploadDate(c),
    ...(film && { duration: isoDuration(film.duration) }),
    ...(content && { contentUrl: content }),
    url: `${site}/work/${c.slug}${slash}`,
    inLanguage: "ru",
    author: { "@type": "Person", name: settings.brand.person, url: site },
  };
  /* «<» экранируем: внутри <script> строка «</script>» из контента иначе закрыла бы тег */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
