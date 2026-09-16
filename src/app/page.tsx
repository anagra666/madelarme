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

/** Главная — порядок секций по плану §07. Hero обязан быть первым (вордмарк считает скролл от 0). */
export default function Home() {
  return (
    <>
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
