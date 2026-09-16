/* STUB — заменяется агентом layout. */
import Link from "next/link";
import { settings } from "@/lib/content";
export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-(--header-h) items-center justify-between px-gutter">
      <Link href="/" className="disp text-2xl">{settings.brand.monogram}</Link>
      <span className="mono text-meta">меню</span>
    </header>
  );
}
