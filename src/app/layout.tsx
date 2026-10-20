import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header, Footer } from "@/components/chrome";
import { AnimatedBackground } from "@/components/animated-background";
import { brandAsset, siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import { animationScript } from "@/lib/animation-preference";
import "./globals.css";

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk.woff2",
  variable: "--font-space-grotesk",
  weight: "300 700",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GuardianWAF — Your traffic. Your rules. Your guardian.",
    template: "%s — GuardianWAF",
  },
  description:
    "An open-source web application firewall built in pure Go. Zero external Go dependencies, 11 attack detectors, three deployment modes. Your infrastructure, protected.",
  applicationName: "GuardianWAF",
  icons: {
    icon: brandAsset("/favicon.svg"),
    apple: brandAsset("/apple-touch-icon.png"),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GuardianWAF",
    title: "Your traffic. Your rules. Your guardian.",
    description:
      "Open-source web application protection. Pure Go. One binary. Zero dependencies.",
    images: [
      {
        url: brandAsset("/og.png"),
        width: 1200,
        height: 630,
        alt: "GuardianWAF — Zero dependencies. One binary. Your guardian.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuardianWAF — Your traffic. Your rules. Your guardian.",
    images: [brandAsset("/og.png")],
  },
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
    { media: "(prefers-color-scheme: light)", color: "#f5f8fd" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: animationScript }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${mono.variable}`}>
        <AnimatedBackground />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}.oxog-mark path{stroke-dasharray:none!important;stroke-dashoffset:0!important}`}</style>
        </noscript>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
