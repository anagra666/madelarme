import type { Case } from "@/content/types";
import { settings } from "@/lib/content";
import { parseDuration } from "@/lib/utils";

/** «08:12» → PT8M12S */
function isoDuration(s: string): string {
  const total = parseDuration(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${sec || (!h && !m) ? `${sec}S` : ""}`;
}

function contentUrl(c: Case, site: string): string | undefined {
  const v = c.fullVideo;
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
  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${c.title} — ${c.client}`,
    description: c.seo?.description ?? c.logline,
    thumbnailUrl: [`${site}${c.loop.posterH}`],
    uploadDate: `${c.year}-01-01`,
    ...(c.fullVideo && { duration: isoDuration(c.fullVideo.duration) }),
    ...(contentUrl(c, site) && { contentUrl: contentUrl(c, site) }),
    url: `${site}/work/${c.slug}`,
    inLanguage: "ru",
    author: { "@type": "Person", name: settings.brand.person, url: site },
  };
  /* «<» экранируем: внутри <script> строка «</script>» из контента иначе закрыла бы тег */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
