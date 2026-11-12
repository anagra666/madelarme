import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ManifestMarquee from "@/components/home/ManifestMarquee";
import WorkIndex from "@/components/home/WorkIndex";
import ReelsRow, { homeReels } from "@/components/home/ReelsRow";
import StackedCases from "@/components/home/StackedCases";
import FormatsList, { homeFormats } from "@/components/home/FormatsList";
import AboutTeaser from "@/components/home/AboutTeaser";
import ClientsQuote, { clientsQuoteData } from "@/components/home/ClientsQuote";
import PricingTeaser from "@/components/home/PricingTeaser";
import FinalCTA from "@/components/home/FinalCTA";
import { getCases, getPricing, settings } from "@/lib/content";
import { igLink } from "@/lib/links";
import { pad2 } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

/* title/description/OG — из layout (default); здесь только canonical: склеивает «/?utm=…» и т. п. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** JSON-LD Person (план, SEO): кто, где, как связаться. */
function PersonJsonLd() {
  const site = SITE_URL;
  const { brand, contacts, about } = settings;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site}/#person`,
    name: brand.person,
    alternateName: brand.wordmark,
    jobTitle: brand.role,
    url: site,
    /* демо-фото не выдаём поисковикам за портрет Марии */
    ...(about.portrait?.src && !settings.toggles.aboutIsDemo && { image: `${site}${about.portrait.src}` }),
    telephone: `+${contacts.phoneDigits}`,
    email: contacts.email,
    address: { "@type": "PostalAddress", addressLocality: brand.city, addressCountry: "KZ" },
    sameAs: [igLink(), contacts.youtube].filter(Boolean),
  };
  /* «<» экранируем: строка «</script>» из контента иначе закрыла бы тег */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/**
 * Номера секций «[ 0N ]» — по факту рендера: секция без данных (пустой reels.json, нет клиентов и отзыва)
 * пропадает вместе с номером, счёт идёт подряд. 01 — hero, 02 — марки (номера не подписаны).
 * Условия повторяют проверки «нет данных → null» внутри самих секций.
 */
function sectionNums() {
  const featured = getCases({ featured: true }).length > 0;
  const shown = {
    work: featured,
    reels: homeReels().length > 0,
    stories: featured,
    formats: homeFormats().length > 0,
    about: true,
    clients: clientsQuoteData() !== null,
    pricing: getPricing().collections.length > 0,
  };
  let n = 2;
  const nums = {} as Record<keyof typeof shown, string>;
  for (const key of Object.keys(shown) as (keyof typeof shown)[]) nums[key] = shown[key] ? pad2(++n) : "";
  return nums;
}

/** Главная — порядок секций по плану §07. Hero обязан быть первым (вордмарк считает скролл от 0). */
export default function Home() {
  const num = sectionNums();
  return (
    <>
      <PersonJsonLd />
      <Hero />
      <ManifestMarquee />
      <WorkIndex num={num.work} />
      <ReelsRow num={num.reels} />
      <StackedCases num={num.stories} />
      <FormatsList num={num.formats} />
      <AboutTeaser num={num.about} />
      <ClientsQuote num={num.clients} />
      <PricingTeaser num={num.pricing} />
      <FinalCTA />
    </>
  );
}
