"use client";

import { useLayoutEffect, RefObject } from "react";
import gsap from "gsap";

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Hero micro-interactions: staggered entrance for headline/CTA, a subtle
 * floating loop on the mock "status card" row. No ScrollTrigger needed here
 * since the hero is always in view on load -- keeps first paint light. */
export function useHeroEntrance(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set("[data-hero]", { opacity: 0, y: 16 });
      gsap.to("[data-hero]", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
      });

      gsap.to(".hero-card", {
        y: -6,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
        delay: 0.6,
      });
    }, ref);

    return () => ctx.revert();
  }, [ref]);
}

/** Scroll-triggered reveal for elements marked [data-reveal] within a
 * section. ScrollTrigger is dynamically imported so it never ships in the
 * initial bundle for routes that don't use it. */
export function useGsapReveal(ref: RefObject<HTMLElement | null>, selector: string) {
  useLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const targets = gsap.utils.toArray<HTMLElement>(selector);
        targets.forEach((el, i) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              delay: (i % 4) * 0.06,
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
      }, ref);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ref, selector]);
}
