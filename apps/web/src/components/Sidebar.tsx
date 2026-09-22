"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useAppStore } from "@/store/useAppStore";
import { Me } from "@/hooks/useMe";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team", label: "Team" },
  { href: "/schedule", label: "Schedule" },
  { href: "/attendance", label: "Attendance" },
  { href: "/documents", label: "Documents" },
  { href: "/updates", label: "Updates" },
  { href: "/settings", label: "Settings" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  me,
  onSignOut,
}: {
  me: Me | undefined;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link href="/dashboard">
          <Logo iconClassName="h-7 w-7" />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-border p-2 text-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo iconClassName="h-7 w-7" />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="text-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto space-y-1 border-t border-border pt-4">
              <button
                onClick={toggleTheme}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={onSignOut}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border p-4 lg:flex">
        <Link href="/dashboard" className="mb-6">
          <Logo />
        </Link>
        <NavLinks pathname={pathname} />
        <div className="mt-auto space-y-3 border-t border-border pt-4">
          {me && (
            <div className="px-3">
              <p className="truncate text-sm font-medium">{me.name}</p>
              <p className="truncate text-xs text-muted">{me.orgRole}</p>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={onSignOut}
            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
