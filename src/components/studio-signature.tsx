"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const projects = [
  { name: "AGEZT", description: "An agentic operating system", slug: "agezt" },
  {
    name: "WrongStack",
    description: "AI coding orchestration",
    slug: "wrongstack",
  },
  {
    name: "WrongTrace",
    description: "Agent observability",
    slug: "wrongtrace",
  },
  { name: "UWAS", description: "Unified web app server", slug: "uwaserver" },
];

export function StudioSignature() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, {
    once: true,
    margin: "0px 0px -80px 0px",
  });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      id="studio"
      className="studio-signature"
      data-logo-state={reducedMotion ? "static" : inView ? "draw" : "waiting"}
      aria-labelledby="studio-title"
    >
      <a
        className="studio-symbol"
        href="https://oxog.net/"
        target="_blank"
        rel="noreferrer"
        aria-label="Visit OXOGNET"
      >
        <svg viewBox="0 0 200 130" fill="none" aria-hidden="true">
          <path
            d="M93 56 72 35C49 13 14 24 9 53 3 84 23 104 46 103"
            stroke="var(--studio-pink)"
            strokeWidth="12"
          />
          <path
            d="M146 25c24-7 45 10 47 34 3 26-16 46-39 44-14-1-24-11-41-27"
            stroke="var(--studio-pink)"
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
            stroke="var(--studio-pink)"
            strokeWidth="12"
            strokeLinecap="square"
          />
        </svg>
      </a>
      <div className="studio-copy">
        <p className="studio-eyebrow">THE PEOPLE BEHIND THE GUARDIAN</p>
        <p className="studio-byline">GuardianWAF is built and maintained by</p>
        <h2 id="studio-title">
          <a
            className="studio-wordmark"
            href="https://oxog.net/"
            target="_blank"
            rel="noreferrer"
          >
            oxog<span>net</span>
            <span className="studio-period">.</span>
            <ArrowUpRight size={21} strokeWidth={1.5} />
          </a>
        </h2>
        <p className="studio-description">
          An independent studio in Estonia building AI agents, developer tools,
          and the infrastructure behind them. A shared curiosity. A whole
          ecosystem of ideas.
        </p>
        <a
          className="studio-explore"
          href="https://oxog.net/projects"
          target="_blank"
          rel="noreferrer"
        >
          Explore the OXOGNET ecosystem <ArrowUpRight size={14} />
        </a>
      </div>
      <nav className="studio-projects" aria-label="More from OXOGNET">
        {projects.map((project) => (
          <a
            key={project.slug}
            className="studio-project"
            href={`https://oxog.net/projects/${project.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="studio-project-name">
              {project.name}
              <ArrowUpRight size={13} />
            </span>
            <span className="studio-project-description">
              {project.description}
            </span>
          </a>
        ))}
      </nav>
    </section>
  );
}
