import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ManifestMarquee from "@/components/home/ManifestMarquee";
import WorkIndex from "@/components/home/WorkIndex";
import ReelsRow from "@/components/home/ReelsRow";
import StackedCases from "@/components/home/StackedCases";
import FormatsList from "@/components/home/FormatsList";
import AboutTeaser from "@/components/home/AboutTeaser";
import ClientsQuote from "@/components/home/ClientsQuote";
import PricingTeaser from "@/components/home/PricingTeaser";
import FinalCTA from "@/components/home/FinalCTA";
import { settings } from "@/lib/content";
import { igLink } from "@/lib/links";

/* title/description/OG — из layout (default); здесь только canonical: склеивает «/?utm=…» и т. п. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** JSON-LD Person (план, SEO): кто, где, как связаться. */
function PersonJsonLd() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://madelarme.kz").replace(/\/$/, "");
  const { brand, contacts, about } = settings;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site}/#person`,
    name: brand.person,
    alternateName: brand.wordmark,
    jobTitle: brand.role,
    url: site,
    ...(about.portrait?.src && { image: `${site}${about.portrait.src}` }),
    telephone: `+${contacts.phoneDigits}`,
    email: contacts.email,
    address: { "@type": "PostalAddress", addressLocality: brand.city, addressCountry: "KZ" },
    sameAs: [igLink(), contacts.youtube].filter(Boolean),
  };
  /* «<» экранируем: строка «</script>» из контента иначе закрыла бы тег */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** Главная — порядок секций по плану §07. Hero обязан быть первым (вордмарк считает скролл от 0). */
export default function Home() {
  return (
    <>
      <PersonJsonLd />
      <Hero />
      <ManifestMarquee />
      <WorkIndex />
      <ReelsRow />
      <StackedCases />
      <FormatsList />
      <AboutTeaser />
      <ClientsQuote />
      <PricingTeaser />
      <FinalCTA />
    </>
  );
}
