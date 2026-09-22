"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePanelEntrance } from "@/hooks/useLandingAnimations";
import { Logo, LogoMark } from "@/components/Logo";

const PANEL_CARDS = [
  "Owner → Manager → Coach → Player → Physio",
  "Practice tonight, 6:00 PM",
  "Attendance: 14/16 marked",
  "Medical form uploaded",
];

export function AuthSplitLayout({
  eyebrow,
  headline,
  body,
  children,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePanelEntrance(panelRef);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Mobile-only top bar -- the brand panel below is lg+ only, so small
          screens still get the logo and a way back to the landing page. */}
      <div className="flex items-center justify-between px-4 py-4 lg:hidden">
        <Link href="/">
          <Logo iconClassName="h-7 w-7" />
        </Link>
      </div>

      <div
        ref={panelRef}
        className="relative hidden overflow-hidden border-r border-border bg-surface px-12 py-12 lg:flex lg:flex-col lg:justify-between"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <Link href="/" data-panel className="relative z-10">
          <Logo />
        </Link>

        <div className="relative z-10 max-w-md">
          <p data-panel className="mb-4 text-sm font-medium uppercase tracking-wide text-accent">
            {eyebrow}
          </p>
          <h1 data-panel className="text-3xl font-semibold leading-tight">
            {headline}
          </h1>
          <p data-panel className="mt-4 text-muted">
            {body}
          </p>

          <div className="mt-10 space-y-3">
            {PANEL_CARDS.map((label) => (
              <div
                key={label}
                data-panel
                className="panel-card flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted"
              >
                <LogoMark className="h-5 w-5 shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p data-panel className="relative z-10 text-xs text-muted">
          Built mobile-first for the sideline.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-8 lg:py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
