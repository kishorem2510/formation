import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo iconClassName="h-6 w-6" />
          <p className="mt-2 max-w-xs text-sm text-muted">
            Roster, scheduling, attendance and documents for clubs and teams.
          </p>
        </div>
        <nav className="flex gap-6 text-sm text-muted">
          <Link href="#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground">
            How it works
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Formation.
      </div>
    </footer>
  );
}
