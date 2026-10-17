import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header, Footer } from "@/components/chrome";
import { asset, siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
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
  icons: { icon: asset("/favicon.svg"), apple: asset("/apple-touch-icon.png") },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GuardianWAF",
    title: "Your traffic. Your rules. Your guardian.",
    description:
      "Open-source web application protection. Pure Go. One binary. Zero dependencies.",
    images: [
      {
        url: asset("/social-card.png"),
        width: 1200,
        height: 630,
        alt: "GuardianWAF — Zero dependencies. One binary. Your guardian.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuardianWAF — Your traffic. Your rules. Your guardian.",
    images: [asset("/social-card.png")],
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
      </head>
      <body className={`${geist.variable} ${mono.variable}`}>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}.studio-symbol path{stroke-dasharray:none!important;stroke-dashoffset:0!important}`}</style>
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
