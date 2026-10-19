"use client";

import { useRef } from "react";
import localFont from "next/font/local";
import { useInView } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const studioBody = localFont({
  src: "../app/fonts/studio-manrope-latin.woff2",
  variable: "--font-studio-body",
  weight: "200 800",
  display: "swap",
  preload: false,
});
const studioDisplay = localFont({
  src: "../app/fonts/studio-space-grotesk-latin.woff2",
  variable: "--font-studio-display",
  weight: "300 700",
  display: "swap",
  preload: false,
});

export function StudioSignature() {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref);
  return (
    <a
      ref={ref}
      id="studio"
      className={`studio-signature ${studioBody.variable} ${studioDisplay.variable}`}
      href="https://oxog.net"
      data-logo-state={inView ? "draw" : "paused"}
    >
      <svg
        className="oxog-mark"
        viewBox="0 0 200 130"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M93 56 72 35C49 13 14 24 9 53 3 84 23 104 46 103"
          stroke="#ed0878"
          strokeWidth="12"
        />
        <path
          d="M146 25c24-7 45 10 47 34 3 26-16 46-39 44-14-1-24-11-41-27"
          stroke="#ed0878"
          strokeWidth="12"
        />
        <path
          d="M76 18c30-20 75 1 77 40 1 12-1 24-6 33M53 36c-19 41 14 84 50 79 9-1 16-3 22-7"
          stroke="var(--studio-purple)"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="m74 87 54-51"
          stroke="#ed0878"
          strokeWidth="12"
          strokeLinecap="square"
        />
      </svg>
      <div className="studio-copy">
        <span className="studio-eyebrow">PART OF A BIGGER PICTURE</span>
        <h2>
          Small studio. <span>Big ideas.</span>
        </h2>
        <p>Explore the tools and infrastructure from Oxog.</p>
      </div>
      <span className="studio-link">
        Meet oxog.net <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </a>
  );
}
