import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdjacentCases, getCase, getCases, getFormat, settings } from "@/lib/content";
import CaseTeaser from "@/components/work/CaseTeaser";
import TitleCard from "@/components/work/TitleCard";
import CaseBody from "@/components/work/CaseBody";
import CaseReels from "@/components/work/CaseReels";
import Stills from "@/components/work/Stills";
import CaseTestimonial from "@/components/work/CaseTestimonial";
import Credits from "@/components/work/Credits";
import NextCase from "@/components/work/NextCase";
import CaseJsonLd from "@/components/work/CaseJsonLd";
import PrefillSetter from "@/components/layout/PrefillSetter";
import { caseTitle } from "@/components/work/film";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getCases().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return {};
  const title = c.seo?.title ?? caseTitle(c);
  const description = c.seo?.description ?? c.logline;
  return {
    title,
    description,
    /* openGraph страницы заменяет объект из layout целиком — site_name и locale повторяем здесь */
    openGraph: {
      title,
      description,
      type: "video.other",
      locale: "ru_KZ",
      siteName: settings.brand.wordmark,
      url: `/work/${c.slug}`,
      images: [{ url: c.loop.posterH, width: 1280, height: 720, alt: c.title }],
    },
    /* демо-кейсы не индексируем и не кладём в sitemap */
    robots: c.isPlaceholder ? { index: false, follow: true } : undefined,
    alternates: { canonical: `/work/${c.slug}` },
  };
}

export default async function CasePage({ params }: { params: Params }) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) notFound();

  const all = getCases();
  const index = all.findIndex((x) => x.slug === c.slug) + 1;
  const { prev, next } = getAdjacentCases(c.slug);
  const format = getFormat(c.format);

  const testimonial =
    c.testimonial && settings.toggles.showTestimonials && (c.testimonial.confirmed || settings.toggles.showPlaceholders)
      ? c.testimonial
      : undefined;

  return (
    <article className="grain bg-ink text-milk pb-[calc(var(--sticky-h)+24px)]">
      <CaseJsonLd c={c} />
      <PrefillSetter kind="case" title={c.title} />
      <div className="relative z-2">
        <CaseTeaser c={c} index={index} total={all.length} format={format} />
        <TitleCard c={c} format={format} />
        <CaseBody c={c} />
        {c.reels && c.reels.length > 0 && <CaseReels reels={c.reels} title={c.title} />}
        {c.stills && c.stills.length > 0 && <Stills stills={c.stills} title={c.title} />}
        {testimonial && <CaseTestimonial t={testimonial} />}
        <Credits c={c} />
        <NextCase c={c} next={next?.slug !== c.slug ? next : undefined} prev={prev?.slug !== c.slug ? prev : undefined} />
      </div>
    </article>
  );
}
