import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <div className="hidden items-center gap-6 sm:flex">
              <Link href="#features" className="text-muted hover:text-foreground">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted hover:text-foreground">
                How it works
              </Link>
            </div>
            <Link href="/login" className="text-muted hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}
