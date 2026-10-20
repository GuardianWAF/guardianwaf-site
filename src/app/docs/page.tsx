import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowUpRight, Download, ShieldCheck } from "lucide-react";
import { CopyButton } from "@/components/interactions";
import { deployments, REPO, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quick start & documentation",
  description:
    "Install GuardianWAF as a Docker sidecar, standalone reverse proxy, or Go middleware. Copyable examples and links to the official guides.",
  alternates: { canonical: `${siteUrl}/docs/` },
};

const goExample = `package main

import (
  "log"
  "net/http"
  "github.com/guardianwaf/guardianwaf"
)

func main() {
  waf, err := guardianwaf.New(guardianwaf.Config{
    Mode: guardianwaf.ModeEnforce,
  })
  if err != nil { log.Fatal(err) }
  defer waf.Close()

  app := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello, protected world."))
  })
  log.Fatal(http.ListenAndServe(":8088", waf.Middleware(app)))
}`;

function Code({ code, file }: { code: string; file: string }) {
  return (
    <div className="code-window">
      <div className="code-title">
        <span>
          <i />
          <i />
          <i />
        </span>
        <span>{file}</span>
        <CopyButton text={code} />
      </div>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ExampleSection({
  id,
  title,
  examples,
  children,
}: {
  id: string;
  title: string;
  examples: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="content-split">
      <div className="content-split-copy">
        <h2>{title}</h2>
        {children}
      </div>
      <div className="content-split-panel">{examples}</div>
    </section>
  );
}

export default function Docs() {
  return (
    <main id="main" className="container docs-layout">
      <aside className="docs-sidebar">
        <span className="eyebrow">
          <span /> DOCUMENTATION
        </span>
        <nav aria-label="Documentation sections">
          {[
            ["Overview", "overview"],
            ["Installation", "installation"],
            ["Docker sidecar", "docker"],
            ["Go middleware", "go"],
            ["Standalone proxy", "binary"],
            ["Production checklist", "production"],
            ["More resources", "resources"],
          ].map(([name, id]) => (
            <a key={id} href={`#${id}`}>
              {name}
            </a>
          ))}
        </nav>
      </aside>
      <article className="docs-content">
        <div className="docs-intro">
          <span className="eyebrow" id="overview">
            <span /> HELLO, GUARDIAN
          </span>
          <h1>Protection starts here.</h1>
          <p className="docs-lead">
            From your first request to your entire stack. Get GuardianWAF
            running in the way that fits your application.
          </p>
          <div className="docs-callout">
            <strong>One engine, three ways to deploy.</strong> Use Docker to
            protect any reachable HTTP service, embed the middleware in a Go
            application, or run the standalone reverse proxy. Examples below
            follow the official project documentation.
          </div>
        </div>
        <ExampleSection
          id="installation"
          title="01. Pick your installation"
          examples={
            <>
              <Code
                file="terminal · install with Go"
                code="go install github.com/guardianwaf/guardianwaf/cmd/guardianwaf@latest"
              />
            </>
          }
        >
          <p>
            Download a prebuilt binary for your platform, use the official
            container image, or install using a compatible Go toolchain. Check
            the repository’s{" "}
            <a
              className="text-link"
              href={`${REPO}/blob/main/go.mod`}
              target="_blank"
              rel="noreferrer"
            >
              go.mod <ArrowUpRight size={12} />
            </a>{" "}
            for the current Go requirement.
          </p>
          <a
            className="button button-primary"
            href={`${REPO}/releases/latest`}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} /> Download the latest release{" "}
            <ArrowUpRight size={13} />
          </a>

          <p>
            The source build includes a dashboard asset step; use the{" "}
            <a
              className="text-link"
              href={`${REPO}/blob/main/docs/getting-started.md`}
              target="_blank"
              rel="noreferrer"
            >
              official source-build workflow <ArrowUpRight size={12} />
            </a>{" "}
            if you are building a release yourself.
          </p>
        </ExampleSection>
        <ExampleSection
          id="docker"
          title="02. Docker sidecar"
          examples={
            <>
              <Code
                file="terminal"
                code={`docker network create guardian-demo
docker run -d --name app --network guardian-demo nginx:alpine
docker run -d --name guardianwaf --network guardian-demo \\
  -p 8088:8088 \\
  ghcr.io/guardianwaf/guardianwaf:latest \\
  sidecar --upstream http://app:80

curl -i http://localhost:8088`}
              />
            </>
          }
        >
          <p>
            The quickest way to protect an existing application. This example
            creates a demo backend and the WAF on a shared Docker network.
          </p>

          <p>
            For your application, replace{" "}
            <code className="inline-code">http://app:80</code> with its
            reachable upstream address. For production, choose a pinned
            container release. Automatic service discovery is also available
            with <code className="inline-code">gwaf.*</code> Docker labels.
          </p>
          <a
            className="text-link"
            href={`${REPO}/blob/main/docs/docker-discovery.md`}
            target="_blank"
            rel="noreferrer"
          >
            Docker auto-discovery guide <ArrowUpRight size={14} />
          </a>
        </ExampleSection>
        <ExampleSection
          id="go"
          title="03. Go middleware"
          examples={
            <>
              <Code
                file="terminal"
                code="go get github.com/guardianwaf/guardianwaf"
              />
              <Code file="main.go" code={goExample} />
            </>
          }
        >
          <p>
            Wrap a standard <code className="inline-code">net/http</code>{" "}
            handler. The engine runs inside your application, with no external
            Go module dependencies.
          </p>

          <p>
            Start your application and send a request to{" "}
            <code className="inline-code">http://localhost:8088</code>. Use
            thresholds, exclusions, and event callbacks to adapt protection to
            your own traffic.
          </p>
        </ExampleSection>
        <ExampleSection
          id="binary"
          title="04. Standalone reverse proxy"
          examples={
            <>
              <Code file="guardianwaf.yaml" code={deployments[2].code} />
              <Code
                file="terminal"
                code="guardianwaf serve -c guardianwaf.yaml"
              />
            </>
          }
        >
          <p>
            Install a binary, then save this file as{" "}
            <code className="inline-code">guardianwaf.yaml</code>. The proxy
            listens on port 8088 and forwards requests to a local app on port
            3000.
          </p>

          <div className="docs-callout">
            <strong>Start with your traffic in mind.</strong> These examples use
            enforce mode. To observe existing traffic before enforcing a policy,
            set <code className="inline-code">mode: monitor</code> and review
            the findings first.
          </div>
        </ExampleSection>
        <section id="production">
          <h2>05. Before you go live</h2>
          <p>
            Use the project’s production deployment guide for the complete
            configuration. At a minimum:
          </p>
          <ul>
            <li>
              Start in monitor mode, review findings, and tune exclusions for
              your application.
            </li>
            <li>
              Configure TLS certificates or place the WAF behind your trusted
              TLS terminator.
            </li>
            <li>
              Keep the dashboard on a private interface with separate viewer and
              administrator keys.
            </li>
            <li>
              Configure trusted proxy addresses so client IP handling matches
              your infrastructure.
            </li>
            <li>
              Set up health probes, metrics, persistent configuration, and event
              retention.
            </li>
            <li>
              Pin the release you deploy and follow the project’s upgrade
              guidance.
            </li>
          </ul>
          <a
            className="button button-secondary"
            href={`${REPO}/blob/main/docs/production-deployment.md`}
            target="_blank"
            rel="noreferrer"
          >
            <ShieldCheck size={16} /> Production deployment guide{" "}
            <ArrowUpRight size={13} />
          </a>
        </section>
        <section id="resources">
          <h2>Go a little deeper.</h2>
          <p>
            The source repository is the authoritative reference for
            configuration and supported capabilities.
          </p>
          <div className="docs-links">
            {[
              ["Configuration reference", "docs/configuration.md"],
              ["Detection engine", "docs/detection-engine.md"],
              ["MCP integration", "docs/mcp-integration.md"],
              ["Metrics & observability", "docs/metrics.md"],
              ["AI threat analysis", "docs/ai-analysis.md"],
              ["Troubleshooting", "docs/troubleshooting-faq.md"],
            ].map(([name, path]) => (
              <a
                key={path}
                href={`${REPO}/blob/main/${path}`}
                target="_blank"
                rel="noreferrer"
              >
                {name}
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
