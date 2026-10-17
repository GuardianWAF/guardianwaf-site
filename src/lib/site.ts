export const REPO = "https://github.com/GuardianWAF/GuardianWAF";
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const asset = (path: string) => `${BASE}${path}`;
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://guardianwaf.com";

export const deployments = [
  {
    id: "docker",
    label: "Docker",
    file: "terminal",
    language: "bash",
    title: "One container. Every backend.",
    description:
      "Put GuardianWAF in front of your app. The sidecar inspects incoming traffic and forwards clean requests to your upstream.",
    code: [
      "docker run -d --name guardianwaf \\",
      "  -p 8088:8088 \\",
      "  ghcr.io/guardianwaf/guardianwaf:latest \\",
      "  sidecar --upstream http://app:3000",
    ].join("\n"),
    note: "Replace app:3000 with your reachable upstream. Use a shared Docker network for container-to-container traffic.",
  },
  {
    id: "go",
    label: "Go middleware",
    file: "main.go",
    language: "go",
    title: "Protection, inside your application.",
    description:
      "Use the same detection engine directly in your Go application. Wrap any net/http handler with a few lines of code.",
    code: 'waf, err := guardianwaf.New(guardianwaf.Config{\n  Mode: guardianwaf.ModeEnforce,\n})\nif err != nil { log.Fatal(err) }\ndefer waf.Close()\n\nhttp.ListenAndServe(":8088", waf.Middleware(app))',
    note: "Install with go get github.com/guardianwaf/guardianwaf. See the quick start for the complete Go example.",
  },
  {
    id: "binary",
    label: "Standalone",
    file: "guardianwaf.yaml",
    language: "yaml",
    title: "Your infrastructure. One binary.",
    description:
      "Protect any HTTP backend with the standalone reverse proxy. Define an upstream, add a route, and start the guardian.",
    code: 'mode: enforce\nlisten: ":8088"\nupstreams:\n  - name: app\n    targets:\n      - url: "http://localhost:3000"\nroutes:\n  - path: /\n    upstream: app',
    note: "Save as guardianwaf.yaml, then run guardianwaf serve. Download a binary for your platform from GitHub Releases.",
  },
] as const;

export const requestExamples = [
  {
    name: "Clean request",
    request: "GET /api/products?category=books",
    verdict: "Allowed",
    status: "200",
    score: 0,
    stage: 5,
    detail: "No suspicious tokens. The request reaches your application.",
    type: "safe",
  },
  {
    name: "SQL injection",
    request: "GET /api/users?id=1%20OR%201=1--",
    verdict: "Blocked",
    status: "403",
    score: 85,
    stage: 3,
    detail: "SQL operators and a comment sequence trigger the detection stage.",
    type: "attack",
  },
  {
    name: "Cross-site scripting",
    request: "GET /search?q=%3Cscript%3Ealert(1)%3C/script%3E",
    verdict: "Blocked",
    status: "403",
    score: 90,
    stage: 3,
    detail: "Executable markup is identified by the XSS detector.",
    type: "attack",
  },
  {
    name: "Bot traffic",
    request: "GET /checkout · suspicious client fingerprint",
    verdict: "Challenged",
    status: "PoW",
    score: 40,
    stage: 4,
    detail:
      "A suspicious client receives a JavaScript proof-of-work challenge.",
    type: "challenge",
  },
] as const;
