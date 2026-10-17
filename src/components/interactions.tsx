"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Clipboard,
  Container,
  Fingerprint,
  GitBranch,
  Globe,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import Link from "next/link";
import { deployments, requestExamples } from "@/lib/site";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-reveal
      className={className}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export function CopyButton({
  text,
  label = "Copy code",
}: {
  text: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2200);
  }
  return (
    <button
      onClick={copy}
      className="copy-button"
      aria-label={status === "copied" ? "Copied" : label}
      title={label}
    >
      {status === "copied" ? <CheckCheck size={16} /> : <Clipboard size={16} />}
      <span aria-live="polite">
        {status === "copied"
          ? "Copied!"
          : status === "error"
            ? "Select to copy"
            : "Copy"}
      </span>
    </button>
  );
}

const stageIcons = [
  Globe,
  GitBranch,
  ScanLine,
  ShieldCheck,
  Fingerprint,
  LockKeyhole,
];
const stages = [
  "IP access",
  "Rate limit",
  "Sanitize",
  "Detection",
  "Bot check",
  "Response",
];

export function Pipeline() {
  const [active, setActive] = useState(0);
  const example = requestExamples[active];
  return (
    <div className="pipeline-demo">
      <div className="demo-toolbar">
        <span className="mono">
          <span className="status-dot" /> REQUEST INSPECTOR
        </span>
        <span className="demo-label">Interactive illustration</span>
      </div>
      <div className="request-options" aria-label="Example requests">
        {requestExamples.map((item, i) => (
          <button
            key={item.name}
            onClick={() => setActive(i)}
            aria-pressed={active === i}
            className={active === i ? "selected" : ""}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="request-line">
        <span className="request-method">HTTP</span>
        <code>{example.request}</code>
        <span className="request-blink">_</span>
      </div>
      <div className="pipeline-track" key={active}>
        {stages.map((stage, i) => {
          const Icon = stageIcons[i];
          const stopped = i > example.stage;
          const blocked = i === example.stage && example.type !== "safe";
          return (
            <div
              className={`pipeline-stage ${stopped ? "stage-muted" : "stage-on"} ${blocked ? `stage-${example.type}` : ""}`}
              key={stage}
              style={{ "--stage-delay": `${i * 120}ms` } as React.CSSProperties}
            >
              <span className="stage-number">0{i + 1}</span>
              <div className="stage-icon">
                <Icon size={23} strokeWidth={1.5} />
                {!stopped && !blocked && (
                  <span className="stage-check">
                    <Check size={10} />
                  </span>
                )}
              </div>
              <span>{stage}</span>
              {i < 5 && <ChevronRight className="stage-arrow" size={15} />}
            </div>
          );
        })}
      </div>
      <div
        className={`request-result result-${example.type}`}
        aria-live="polite"
      >
        <span className="result-verdict">
          {example.type === "attack" ? (
            <X size={17} />
          ) : example.type === "challenge" ? (
            <Fingerprint size={17} />
          ) : (
            <Check size={17} />
          )}{" "}
          {example.verdict} <code>{example.status}</code>
        </span>
        <p>{example.detail}</p>
        <span className="result-score">
          Example score <b>{example.score}</b>
          <span>/100</span>
        </span>
      </div>
      <p className="demo-disclaimer">
        Illustrative requests and scores. Actual verdicts depend on your
        configuration; this demo does not run the WAF.
      </p>
    </div>
  );
}

export function DeploymentTabs() {
  const [active, setActive] = useState(0);
  const current = deployments[active];
  const icons = [Container, GitBranch, Terminal];
  return (
    <div className="deployment-layout">
      <div className="deployment-info">
        <div
          className="deployment-tabs"
          role="tablist"
          aria-label="Deployment mode"
        >
          {deployments.map((mode, i) => {
            const Icon = icons[i];
            return (
              <button
                key={mode.id}
                id={`tab-${mode.id}`}
                role="tab"
                aria-selected={active === i}
                aria-controls="deployment-panel"
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(event) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 2
                          : (active + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                    setActive(next);
                    document
                      .getElementById(`tab-${deployments[next].id}`)
                      ?.focus();
                  }
                }}
              >
                <Icon size={17} />
                {mode.label}
              </button>
            );
          })}
        </div>
        <h3>{current.title}</h3>
        <p>{current.description}</p>
        <Link className="text-link" href={`/docs/#${current.id}`}>
          Read the setup guide <ArrowRight size={16} />
        </Link>
        <div className="deploy-note">
          <ShieldCheck size={17} />
          <span>
            Same engine. Same protection.
            <br />
            However you choose to deploy.
          </span>
        </div>
      </div>
      <div
        className="code-window"
        id="deployment-panel"
        role="tabpanel"
        aria-labelledby={`tab-${current.id}`}
        tabIndex={0}
      >
        <div className="code-title">
          <span>
            <i />
            <i />
            <i />
          </span>
          <span>{current.file}</span>
          <CopyButton text={current.code} />
        </div>
        <pre>
          <code>{current.code}</code>
        </pre>
        <div className="code-note">
          <span className="status-dot" />
          <span>{current.note}</span>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const entries = [
    [
      "Does my application have to be written in Go?",
      "No. In standalone or sidecar mode, GuardianWAF sits in front of any HTTP backend: Node.js, Python, Java, PHP, Ruby, .NET, or Go. Only the embedded middleware mode requires a Go application.",
    ],
    [
      "What does zero dependencies actually mean?",
      "The core WAF is built with the Go standard library, with no external Go module dependencies. The dashboard is embedded into the binary. Optional integrations, such as AI providers or Docker discovery, connect to external services when you enable them.",
    ],
    [
      "How is this different from a regex-based WAF?",
      "GuardianWAF uses tokenizer-based detection and configurable threat scoring. Its detectors inspect the structure of suspicious input, and combined findings determine whether a request passes, is logged, challenged, or blocked.",
    ],
    [
      "Can I try it without blocking real requests?",
      "Yes. Start in monitor mode to inspect traffic and review findings before switching to enforce mode. Tune thresholds and exclusions for your own application before enforcing a policy.",
    ],
    [
      "Is GuardianWAF free to use?",
      "The core WAF is open source under the MIT license, including for commercial use. The repository describes possible future enterprise offerings separately. Optional third-party AI services may have their own usage costs.",
    ],
  ];
  return (
    <div className="faq-list">
      {entries.map(([question, answer], i) => (
        <details key={question}>
          <summary>
            <span className="mono faq-number">0{i + 1}</span>
            {question}
            <span className="faq-plus">+</span>
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
