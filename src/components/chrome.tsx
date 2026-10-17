"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { Github, LogoMark } from "./brand";
import { REPO } from "@/lib/site";

export function Header() {
  const [theme, setTheme] = useState("dark");
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const sync = () =>
      setTheme(document.documentElement.dataset.theme || "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("guardian-theme", next);
    } catch {
      /* Storage can be disabled. */
    }
  }
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="wordmark" aria-label="GuardianWAF home">
          <LogoMark />
          <span>
            guardian<span className="wordmark-waf">waf</span>
            <span className="wordmark-period">.</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/#features">Features</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#deploy">Deploy</Link>
          <Link href="/docs/">
            Docs <ArrowUpRight size={12} />
          </Link>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            suppressHydrationWarning
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a
            className="github-nav"
            aria-label="GuardianWAF on GitHub"
            href={REPO}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={17} />
            <span>GitHub</span>
            <ArrowUpRight size={13} />
          </a>
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            aria-controls="mobile-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            {[
              ["Features", "/#features"],
              ["How it works", "/#how-it-works"],
              ["Deploy", "/#deploy"],
              ["Documentation", "/docs/"],
              ["Brand assets", "/brand/"],
            ].map(([name, href]) => (
              <Link key={name} href={href} onClick={() => setMenu(false)}>
                {name}
                <ArrowRight size={17} />
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer container">
      <div className="footer-main">
        <div>
          <Link href="/" className="wordmark">
            <LogoMark />
            <span>
              guardian<span className="wordmark-waf">waf</span>
              <span className="wordmark-period">.</span>
            </span>
          </Link>
          <p>A little binary. A lot of peace of mind.</p>
        </div>
        <div className="footer-links">
          <Link href="/docs/">Documentation</Link>
          <a href={`${REPO}/releases`} target="_blank" rel="noreferrer">
            Releases <ArrowUpRight size={12} />
          </a>
          <Link href="/brand/">Brand assets</Link>
          <a
            href={`${REPO}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
          >
            Contribute <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} GuardianWAF. Open source under MIT.
        </span>
        <span>
          Built with Go. Made for everyone.{" "}
          <span className="tiny-shield">◇</span>
        </span>
      </div>
    </footer>
  );
}
