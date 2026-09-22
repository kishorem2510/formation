"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGsapReveal, useHeroEntrance } from "@/hooks/useLandingAnimations";
import { Card } from "@/components/ui";
import { LogoMark } from "@/components/Logo";
import { IconRoster, IconSchedule, IconAttendance, IconDocs, IconCheck, IconCross } from "@/components/icons";

const FEATURES = [
  {
    icon: IconRoster,
    title: "Roster management",
    body: "Owners and Managers run the whole org; Coaches, Players and Physios only ever see the teams they're actually on.",
  },
  {
    icon: IconSchedule,
    title: "Scheduling",
    body: "Games and practices per team, sorted and ready — built to be checked from a phone between classes, not a desktop.",
  },
  {
    icon: IconAttendance,
    title: "Attendance",
    body: "Coaches mark who showed up in seconds. Attendance history is there when you need it, per player or per event.",
  },
  {
    icon: IconDocs,
    title: "Documents",
    body: "Medical forms, rosters, team docs — uploaded straight to secure storage, visible only to the people who should see them.",
  },
];

const STATS = [
  { value: "5", label: "roles, each scoped to what they need" },
  { value: "4", label: "core modules: roster, schedule, attendance, docs" },
  { value: "1", label: "tap to mark attendance from the sideline" },
];

const ROLES = [
  { tier: "Org-wide", name: "Owner", note: "Full control — org settings, billing, every team" },
  { tier: "Org-wide", name: "Manager", note: "Runs day-to-day ops across all teams" },
  { tier: "Per-team", name: "Coach", note: "Schedules and marks attendance for their team" },
  { tier: "Per-team", name: "Player", note: "Sees their team's schedule and their own history" },
  { tier: "Per-team", name: "Physio", note: "Manages medical documents for their team" },
];

const COMPARISON = [
  { old: "Roster lives in a spreadsheet nobody updates", now: "Roster syncs the moment someone's added" },
  { old: "Attendance tracked in a group chat", now: "Marked in two taps, history kept automatically" },
  { old: "Medical forms buried in someone's email", now: "Stored securely, visible only to the right roles" },
  { old: "Everyone sees everything — or nothing", now: "Coaches see their team, not the whole club" },
];

const STEPS = [
  { title: "Create your organization", body: "Sign up as the Owner in under a minute." },
  { title: "Invite your team", body: "Coaches, Players, Physios and Managers get an email invite with the right access from day one." },
  { title: "Run the season", body: "Schedule, track attendance, and keep documents in one place — on any device." },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useHeroEntrance(heroRef);
  useGsapReveal(statsRef, "[data-reveal]");
  useGsapReveal(featuresRef, "[data-reveal]");
  useGsapReveal(rolesRef, "[data-reveal]");
  useGsapReveal(compareRef, "[data-reveal]");
  useGsapReveal(stepsRef, "[data-reveal]");
  useGsapReveal(trustRef, "[data-reveal]");
  useGsapReveal(ctaRef, "[data-reveal]");

  return (
    <main>
      <section ref={heroRef} className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-16 sm:pt-24">
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

          <div data-hero className="mt-16 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <LogoMark className="h-5 w-5" />
              <span className="text-sm font-medium text-muted">Riverside FC · U16 Boys</span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="hero-card px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-muted">Next up</p>
                <p className="mt-1 font-medium">Practice · 6:00 PM</p>
                <p className="text-sm text-muted">Riverside Field 2</p>
              </div>
              <div className="hero-card px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-muted">Attendance</p>
                <p className="mt-1 font-medium">14 / 16 marked</p>
                <p className="text-sm text-muted">2 excused</p>
              </div>
              <div className="hero-card px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-muted">Roster</p>
                <p className="mt-1 font-medium">1 Coach · 1 Physio</p>
                <p className="text-sm text-muted">16 Players</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={statsRef} className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} data-reveal>
              <p className="text-4xl font-semibold text-accent">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
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
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <f.icon />
              </div>
              <h3 className="mb-2 font-medium">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section ref={rolesRef} className="mx-auto max-w-5xl px-4 py-20">
        <h2 data-reveal className="mb-3 text-2xl font-semibold">
          Access that matches how clubs actually work
        </h2>
        <p data-reveal className="mb-10 max-w-2xl text-muted">
          Owners and Managers see the whole organization. Coaches, Players and
          Physios only ever see the specific team they belong to — nobody
          stumbles into another squad&apos;s roster or medical records.
        </p>
        <div className="space-y-3">
          {ROLES.map((r) => (
            <div
              key={r.name}
              data-reveal
              className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-accent">
                {r.tier}
              </span>
              <span className="w-24 shrink-0 font-medium">{r.name}</span>
              <span className="text-sm text-muted">{r.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" ref={stepsRef} className="mx-auto max-w-5xl px-4 py-20">
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

      <section ref={compareRef} className="mx-auto max-w-5xl px-4 py-20">
        <h2 data-reveal className="mb-10 text-2xl font-semibold">
          Not another spreadsheet and group chat
        </h2>
        <div data-reveal className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="bg-surface px-5 py-3 text-sm font-medium text-muted">The old way</div>
            <div className="bg-accent/10 px-5 py-3 text-sm font-medium text-accent">With Formation</div>
          </div>
          {COMPARISON.map((row) => (
            <div key={row.old} className="grid grid-cols-2 divide-x divide-border border-t border-border">
              <div className="flex items-start gap-2 px-5 py-4 text-sm text-muted">
                <IconCross className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                {row.old}
              </div>
              <div className="flex items-start gap-2 bg-accent/5 px-5 py-4 text-sm">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {row.now}
              </div>
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
