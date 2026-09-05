"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/vitals", label: "Parametri" },
  { href: "/symptoms", label: "Sintomi" },
  { href: "/visits", label: "Visite" },
  { href: "/bloodtests", label: "Esami del sangue" },
  { href: "/assistant", label: "Assistente AI" },
  { href: "/notes", label: "Note" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-brand-700">Health Log</span>
          <nav className="flex flex-wrap gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "bg-brand-100 text-brand-800"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button onClick={handleLogout} className="btn-secondary text-xs">
          Esci
        </button>
      </div>
    </header>
  );
}
