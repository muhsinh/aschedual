\"use client\";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/inbox", label: "Inbox" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/destinations", label: "Destinations" },
  { href: "/settings/privacy", label: "Privacy" }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full max-w-60 rounded-2xl border border-border bg-panel p-4">
      <div className="mb-5 border-b border-border pb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Aschedual</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Workspace</h2>
      </div>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-xl px-3 py-2 text-sm transition-colors",
              pathname.startsWith(link.href)
                ? "bg-panel2 text-foreground"
                : "text-muted hover:bg-panel2 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
