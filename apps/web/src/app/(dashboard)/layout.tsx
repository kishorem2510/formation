"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMe, isOrgAdmin } from "@/hooks/useMe";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui";
import { Logo } from "@/components/Logo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, isAuthenticated, signOut } = useAuth();
  const { data: me } = useMe(isAuthenticated);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard">
            <Logo iconClassName="h-7 w-7" />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="text-muted hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/teams" className="text-muted hover:text-foreground">
              Teams
            </Link>
            {isOrgAdmin(me) && (
              <Link href="/teams?invite=1" className="text-muted hover:text-foreground">
                Invite
              </Link>
            )}
            <Link
              href={`/forgot-password${me?.email ? `?email=${encodeURIComponent(me.email)}` : ""}`}
              className="hidden text-muted hover:text-foreground sm:inline"
            >
              Change password
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-muted hover:text-foreground"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
