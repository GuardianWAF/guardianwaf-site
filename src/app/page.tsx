import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircuitBoard,
  Code2,
  Fingerprint,
  Layers3,
  LockKeyhole,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { ShieldArt, LogoMark, Github } from "@/components/brand";
import {
  CopyButton,
  DeploymentTabs,
  Faq,
  Pipeline,
  Reveal,
} from "@/components/interactions";
import { REPO, siteUrl } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: `${siteUrl}/` } };

const install =
  "go install github.com/guardianwaf/guardianwaf/cmd/guardianwaf@latest";
const protections = [
  "SQL injection",
  "Cross-site scripting",
  "Path traversal",
  "Command injection",
  "XXE",
  "SSRF",
  "SSTI",
  "NoSQL injection",
  "Request smuggling",
  "Open redirect",
  "GraphQL abuse",
];

export default function Home() {
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <a
            className="announcement"
            href={`${REPO}/releases`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="status-dot" />
            <span>Small binary. Serious protection.</span>
            <ArrowUpRight size={13} />
          </a>
          <h1>
            Your traffic.
            <br />
            Your rules.
            <br />
            <span>Your guardian.</span>
          </h1>
          <p className="hero-description">
            The open-source web application firewall that puts you in control.
            Pure Go. Zero dependencies. All the protection, none of the baggage.
          </p>
          <div className="hero-cta">
            <Link href="#deploy" className="button button-primary">
              Meet your guardian <ArrowRight size={17} />
            </Link>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="button button-secondary"
            >
              <Github size={18} /> View on GitHub <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="hero-assurances">
            <span>
              <Check size={13} /> MIT licensed
            </span>
            <span>
              <Check size={13} /> No vendor lock-in
            </span>
            <span>
              <Check size={13} /> Built in Go
            </span>
          </div>
        </div>
        <div className="hero-art">
          <ShieldArt />
          <div className="art-bottom">
            <span>
              <ShieldCheck size={14} /> ALWAYS BETWEEN YOU & THE THREAT
            </span>
            <span>01 — ∞</span>
          </div>
        </div>
        <a
          className="hero-scroll"
          href="#overview"
          aria-label="Explore GuardianWAF"
        >
          <ArrowDown size={14} />
          <span>LESS OVERHEAD. MORE PEACE OF MIND.</span>
        </a>
      </section>

      <section className="stats-section" id="overview">
        <div className="container stats-grid">
          {[
            [
              "0",
              "External Go dependencies",
              "Everything you need. Nothing extra.",
            ],
            ["11", "Attack detectors", "Layered defense, from SQLi to SSRF."],
            ["3", "Ways to deploy", "Proxy, middleware, or sidecar."],
            ["<1ms", "p99 overhead target", "Built to stay out of the way."],
          ].map(([value, label, detail]) => (
            <div className="stat" key={label}>
              <strong>{value}</strong>
              <h2>{label}</h2>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" id="features">
        <Reveal className="section-intro">
          <div>
            <span className="eyebrow">
              <span /> SMALL FOOTPRINT. STRONG DEFENSE.
            </span>
            <h2>
              Everything a guardian needs.
              <br />
              <span>Nothing to hold you back.</span>
            </h2>
          </div>
          <p>
            Security should simplify your stack.
            <br />
            One Go binary brings your defenses together,
            <br className="desktop-break" /> from the first request to the final
            response.
          </p>
        </Reveal>
        <div className="feature-grid">
          <Reveal className="feature-card feature-detection">
            <div className="card-topline">
              <ShieldCheck size={21} />
              <span className="mono">01 / DETECTION</span>
              <FeatureGuide
                path="docs/detection-engine.md"
                label="Read about the detection engine"
              />
            </div>
            <h3>
              Understands the attack.
              <br />
              Protects the application.
            </h3>
            <p>
              Tokenizer-based inspection and configurable threat scoring. Eleven
              purpose-built detectors working as one.
            </p>
            <div className="detection-visual">
              <div className="token-input">
                <span className="token-muted">SELECT</span>{" "}
                <span className="token-suspicious">*</span>{" "}
                <span className="token-muted">FROM users WHERE</span>
                <br />
                <span className="token-muted">id =</span>{" "}
                <span className="token-suspicious">1 OR 1=1 --</span>
                <span className="token-cursor" />
              </div>
              <div className="scan-line" />
              <div className="token-verdict">
                <span>
                  <ShieldCheck size={14} /> SQL INJECTION DETECTED
                </span>
                <span>BLOCKED ↗</span>
              </div>
            </div>
          </Reveal>
          <Reveal className="feature-card feature-bots" delay={0.08}>
            <div className="card-topline">
              <Fingerprint size={21} />
              <span className="mono">02 / BOT DEFENSE</span>
              <FeatureGuide
                path="docs/configuration.md"
                label="Read about bot defense configuration"
              />
            </div>
            <div className="fingerprint-art">
              <Fingerprint size={106} strokeWidth={0.8} />
              <span className="fingerprint-ring ring-one" />
              <span className="fingerprint-ring ring-two" />
              <span className="fingerprint-tag">
                <span className="status-dot" /> HUMAN VERIFIED
              </span>
            </div>
            <h3>
              Real people in.
              <br />
              Bad bots out.
            </h3>
            <p>
              TLS fingerprinting, behavioral signals, and JavaScript
              proof-of-work challenges.
            </p>
          </Reveal>
          <Reveal className="feature-card feature-routing" delay={0.12}>
            <div className="card-topline">
              <Network size={21} />
              <span className="mono">03 / SMART ROUTING</span>
              <FeatureGuide
                path="docs/deployment-modes.md"
                label="Read about routing and deployment"
              />
            </div>
            <h3>
              One front door.
              <br />
              Your whole stack.
            </h3>
            <p>
              Multi-domain routing, load balancing, automatic TLS, and circuit
              breakers. Built right in.
            </p>
            <div className="routing-visual">
              <div className="routing-origin">
                <LogoMark />
              </div>
              <div className="routing-lines">
                <i />
                <i />
                <i />
              </div>
              <div className="routing-targets">
                {["api.your.app", "web.your.app", "admin.your.app"].map(
                  (domain) => (
                    <span key={domain}>
                      <span className="status-dot" />
                      {domain}
                      <ArrowUpRight size={11} />
                    </span>
                  ),
                )}
              </div>
            </div>
          </Reveal>
          <Reveal className="feature-card feature-observe">
            <div className="card-topline">
              <Radar size={21} />
              <span className="mono">04 / VISIBILITY</span>
              <FeatureGuide
                path="docs/metrics.md"
                label="Read about metrics and observability"
              />
            </div>
            <h3>No blind spots.</h3>
            <p>
              A built-in dashboard, real-time events,
              <br />
              and Prometheus metrics.
            </p>
            <div className="mini-chart" aria-hidden="true">
              {[
                22, 35, 28, 44, 34, 51, 42, 61, 47, 64, 53, 77, 58, 73, 66, 88,
                75, 95, 80, 90, 86, 100,
              ].map((height, i) => (
                <i
                  key={i}
                  style={{ height: `${height}%`, opacity: 0.3 + i / 32 }}
                />
              ))}
            </div>
          </Reveal>
          <Reveal className="feature-card feature-ai" delay={0.08}>
            <div className="card-topline">
              <Sparkles size={21} />
              <span className="mono">05 / CONNECTED</span>
              <FeatureGuide
                path="docs/mcp-integration.md"
                label="Read about MCP integration"
              />
            </div>
            <h3>Your tools. Supercharged.</h3>
            <p>
              Optional AI threat analysis and 44 MCP tools. Connect your
              guardian to the way you work.
            </p>
            <div className="integration-tags">
              <span>
                <Braces size={15} /> MCP
              </span>
              <span>
                <CircuitBoard size={15} /> AI providers
              </span>
              <span>
                <Layers3 size={15} /> SIEM
              </span>
            </div>
          </Reveal>
          <Reveal className="feature-card feature-open" delay={0.12}>
            <div className="card-topline">
              <Code2 size={21} />
              <span className="mono">06 / OPEN SOURCE</span>
              <FeatureGuide
                path="CONTRIBUTING.md"
                label="Read the contribution guide"
              />
            </div>
            <h3>
              Trust the code.
              <br />
              Because you can read it.
            </h3>
            <p>
              Pure Go. MIT licensed. Audit it, adapt it,
              <br />
              make it yours.
            </p>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Explore the source <ArrowUpRight size={15} />
            </a>
            <span className="open-watermark" aria-hidden="true">
              {"{ }"}
            </span>
          </Reveal>
        </div>
        <div className="protection-strip">
          <span className="mono">COVERED FROM EVERY ANGLE</span>
          <div>
            {protections.map((name) => (
              <span key={name}>
                <Check size={12} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="pipeline-section section" id="how-it-works">
        <div className="container">
          <Reveal className="section-intro">
            <div>
              <span className="eyebrow">
                <span /> EVERY REQUEST HAS A CHECKPOINT
              </span>
              <h2>
                Good traffic gets through.
                <br />
                <span>The rest meets its guardian.</span>
              </h2>
            </div>
            <p>
              Six layers of inspection. One seamless pipeline.
              <br />
              Pick an example and follow the request.
            </p>
          </Reveal>
          <Pipeline />
          <div className="pipeline-footnote">
            <span>
              <Zap size={15} /> Tokenizer-based detection
            </span>
            <span>
              <LockKeyhole size={15} /> Configurable scoring
            </span>
            <span>
              <Network size={15} /> Any HTTP backend
            </span>
          </div>
        </div>
      </section>

      <section className="section container" id="deploy">
        <Reveal className="section-intro">
          <div>
            <span className="eyebrow">
              <span /> FITS YOUR STACK
            </span>
            <h2>
              Your first line of defense.
              <br />
              <span>Just a few lines away.</span>
            </h2>
          </div>
          <p>
            Run it on its own. Drop it into Go.
            <br />
            Ship it alongside your containers.
          </p>
        </Reveal>
        <DeploymentTabs />
      </section>

      <section className="observability-section section">
        <div className="container observability-layout">
          <Reveal className="observability-copy">
            <span className="eyebrow">
              <span /> KNOW WHAT YOUR GUARDIAN KNOWS
            </span>
            <h2>
              Clarity.
              <br />
              Built in.
            </h2>
            <p>
              Understand your traffic without assembling another stack. Your
              dashboard, events, upstream health, and configuration live in one
              place.
            </p>
            <ul>
              <li>
                <Check size={15} /> Live requests and security events
              </li>
              <li>
                <Check size={15} /> Upstream health and circuit breakers
              </li>
              <li>
                <Check size={15} /> Configuration changes without restarts
              </li>
              <li>
                <Check size={15} /> Prometheus-ready metrics
              </li>
            </ul>
            <a
              href={`${REPO}/blob/main/docs/metrics.md`}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Explore observability <ArrowUpRight size={15} />
            </a>
          </Reveal>
          <Reveal className="dashboard-preview">
            <div className="dashboard-top">
              <span>
                <LogoMark /> GuardianWAF{" "}
                <span className="dashboard-separator">/</span> Overview
              </span>
              <span className="dashboard-live">
                <span className="status-dot" /> Example data
              </span>
            </div>
            <div className="dashboard-heading">
              <h3>Traffic overview</h3>
              <span>
                Last 24 hours <ChevronDownSmall />
              </span>
            </div>
            <div className="dashboard-metrics">
              <div>
                <span>Total requests</span>
                <strong>128,409</strong>
                <small>↑ 12.8% vs. previous period</small>
              </div>
              <div>
                <span>Threats blocked</span>
                <strong>
                  1,284
                  <span className="metric-dot" />
                </strong>
                <small>Your guardian is on it.</small>
              </div>
              <div>
                <span>Upstream health</span>
                <strong>
                  3<span className="metric-sub"> / 3</span>
                </strong>
                <small>
                  <span className="status-dot" /> All systems healthy
                </small>
              </div>
            </div>
            <div className="dashboard-chart">
              <div className="chart-y">
                <span>6k</span>
                <span>4k</span>
                <span>2k</span>
              </div>
              <svg
                viewBox="0 0 620 156"
                preserveAspectRatio="none"
                aria-label="Illustrative traffic chart"
                role="img"
              >
                <defs>
                  <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="var(--accent)" stopOpacity=".28" />
                    <stop
                      offset="1"
                      stopColor="var(--accent)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M0 126 18 119 35 124 52 97 69 108 86 92 103 99 120 71 138 83 155 67 172 83 189 72 206 101 224 78 241 83 258 59 276 70 292 43 310 64 327 49 344 69 361 47 379 56 396 31 413 45 430 25 448 44 465 31 482 47 499 20 516 34 534 15 551 28 568 12 585 25 603 9 620 18V156H0Z"
                  fill="url(#chart-fill)"
                />
                <path
                  className="chart-line"
                  d="M0 126 18 119 35 124 52 97 69 108 86 92 103 99 120 71 138 83 155 67 172 83 189 72 206 101 224 78 241 83 258 59 276 70 292 43 310 64 327 49 344 69 361 47 379 56 396 31 413 45 430 25 448 44 465 31 482 47 499 20 516 34 534 15 551 28 568 12 585 25 603 9 620 18"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <div className="chart-x">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </div>
            <div className="dashboard-events">
              <span>RECENT SECURITY EVENTS</span>
              <div>
                <i className="event-block">Blocked</i>
                <code>SQL injection</code>
                <span>GET /api/users</span>
                <span>Just now</span>
              </div>
              <div>
                <i className="event-challenge">Challenge</i>
                <code>Bot detection</code>
                <span>GET /checkout</span>
                <span>2s ago</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section container faq-section">
        <Reveal>
          <span className="eyebrow">
            <span /> GOOD QUESTIONS
          </span>
          <h2>
            A little more
            <br />
            <span>peace of mind.</span>
          </h2>
          <p className="faq-aside">
            Have something else in mind?
            <br />
            <a
              className="text-link"
              href={`${REPO}/issues`}
              target="_blank"
              rel="noreferrer"
            >
              Let’s talk on GitHub <ArrowUpRight size={14} />
            </a>
          </p>
        </Reveal>
        <Faq />
      </section>

      <section className="container final-cta">
        <div className="cta-emblem">
          <LogoMark />
        </div>
        <span className="eyebrow">
          YOUR INFRASTRUCTURE. YOUR PEACE OF MIND.
        </span>
        <h2>
          Give your app
          <br />a guardian.
        </h2>
        <p>Open source. Zero dependencies. Ready when you are.</p>
        <div className="hero-cta">
          <Link href="/docs/" className="button button-primary">
            Get started <ArrowRight size={17} />
          </Link>
          <a
            className="button button-secondary"
            href={REPO}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={17} /> Star on GitHub <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="install-inline">
          <Terminal size={15} />
          <code>{install}</code>
          <CopyButton text={install} label="Copy Go install command" />
        </div>
        <span className="cta-corner cta-corner-tl">+</span>
        <span className="cta-corner cta-corner-tr">+</span>
        <span className="cta-corner cta-corner-bl">+</span>
        <span className="cta-corner cta-corner-br">+</span>
      </section>
    </main>
  );
}

function FeatureGuide({ path, label }: { path: string; label: string }) {
  return (
    <a
      className="feature-guide"
      href={`${REPO}/blob/main/${path}`}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
    >
      <ArrowUpRight size={17} />
    </a>
  );
}

function ChevronDownSmall() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="m3 5 3 3 3-3" stroke="currentColor" />
    </svg>
  );
}
