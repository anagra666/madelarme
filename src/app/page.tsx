import { getCases, settings } from "@/lib/content";
import CinemaVideo from "@/components/media/CinemaVideo";

/* STUB главной — собирается из секций src/components/home/* */
export default function Home() {
  const cases = getCases({ featured: true });
  return (
    <div>
      <section className="relative h-svh">
        {settings.showreel && <CinemaVideo loop={settings.showreel.loop} priority pauseButton className="absolute inset-0" />}
        <h1 className="disp text-h1 absolute bottom-gutter left-gutter">{settings.manifest.join(" ")}</h1>
      </section>
      <ul className="px-gutter py-16">
        {cases.map((c) => <li key={c.slug} className="disp text-row">{c.title}</li>)}
      </ul>
    </div>
  );
}
