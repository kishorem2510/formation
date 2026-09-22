"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGsapReveal, useHeroEntrance } from "@/hooks/useLandingAnimations";
import { Card } from "@/components/ui";

const FEATURES = [
  {
    title: "Roster management",
    body: "Owners and Managers run the whole org; Coaches, Players and Physios only ever see the teams they're actually on.",
  },
  {
    title: "Scheduling",
    body: "Games and practices per team, sorted and ready — built to be checked from a phone between classes, not a desktop.",
  },
  {
    title: "Attendance",
    body: "Coaches mark who showed up in seconds. Attendance history is there when you need it, per player or per event.",
  },
  {
    title: "Documents",
    body: "Medical forms, rosters, team docs — uploaded straight to secure storage, visible only to the people who should see them.",
  },
];

const STEPS = [
  { title: "Create your organization", body: "Sign up as the Owner in under a minute." },
  { title: "Invite your team", body: "Coaches, Players, Physios and Managers get an email invite with the right access from day one." },
  { title: "Run the season", body: "Schedule, track attendance, and keep documents in one place — on any device." },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useHeroEntrance(heroRef);
  useGsapReveal(featuresRef, "[data-reveal]");
  useGsapReveal(stepsRef, "[data-reveal]");
  useGsapReveal(trustRef, "[data-reveal]");
  useGsapReveal(ctaRef, "[data-reveal]");

  return (
    <main>
      <section ref={heroRef} className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:pt-24">
        <p data-hero className="mb-4 text-sm font-medium uppercase tracking-wide text-accent">
          Built for the sideline, not the boardroom
        </p>
        <h1 data-hero className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Run your sports organization from your pocket.
        </h1>
        <p data-hero className="mt-5 max-w-xl text-lg text-muted">
          Roster, scheduling, attendance and documents for clubs and teams —
          with role-based access so everyone sees exactly what they need to.
        </p>
        <div data-hero className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Get started free
          </Link>
          <Link
            href="#features"
            className="rounded-lg border border-border px-6 py-3 font-medium hover:bg-surface-hover"
          >
            See how it works
          </Link>
        </div>

        <div data-hero className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["Roster synced", "Practice tonight, 6:00 PM", "Attendance: 14/16"].map((label) => (
            <div
              key={label}
              className="hero-card rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted"
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      <section id="features" ref={featuresRef} className="mx-auto max-w-5xl px-4 py-20">
        <h2 data-reveal className="mb-10 text-2xl font-semibold">
          Everything the season needs
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title} data-reveal>
              <h3 className="mb-2 font-medium">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section ref={stepsRef} className="mx-auto max-w-5xl px-4 py-20">
        <h2 data-reveal className="mb-10 text-2xl font-semibold">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} data-reveal>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {i + 1}
              </div>
              <h3 className="mb-1 font-medium">{s.title}</h3>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={trustRef} className="mx-auto max-w-5xl px-4 py-20">
        <div data-reveal className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-lg">
            Built for teams like yours &mdash; from weekend leagues to
            multi-team clubs.
          </p>
        </div>
      </section>

      <section ref={ctaRef} className="mx-auto max-w-5xl px-4 pb-24">
        <div data-reveal className="rounded-xl bg-accent px-8 py-12 text-center text-accent-foreground">
          <h2 className="text-2xl font-semibold">Ready to get organized?</h2>
          <p className="mt-2 opacity-90">Set up your organization in a couple of minutes.</p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-lg bg-background px-6 py-3 font-medium text-foreground hover:opacity-90"
          >
            Create your organization
          </Link>
        </div>
      </section>
    </main>
  );
}
