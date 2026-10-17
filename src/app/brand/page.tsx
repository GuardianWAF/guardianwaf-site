import type { Metadata } from "next";
import { Download } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { asset, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brand assets",
  description:
    "GuardianWAF SVG logos, logomarks, and brand colors. Download vector assets for dark and light backgrounds.",
  alternates: { canonical: `${siteUrl}/brand/` },
};
export default function Brand() {
  return (
    <main id="main" className="container brand-page">
      <span className="eyebrow">
        <span /> THE GUARDIAN IDENTITY
      </span>
      <h1>A mark of protection.</h1>
      <p className="docs-lead">
        A shield, an open gate, and a guardian at the center. Simple enough for
        a favicon. Distinct enough to stand on its own.
      </p>
      <div className="brand-grid">
        {[
          ["dark", "Logo · dark backgrounds", "guardianwaf-logo-dark.svg"],
          ["light", "Logo · light backgrounds", "guardianwaf-logo-light.svg"],
          ["dark", "Logomark · dark backgrounds", "guardianwaf-mark-dark.svg"],
          [
            "light",
            "Logomark · light backgrounds",
            "guardianwaf-mark-light.svg",
          ],
        ].map(([mode, name, file], i) => (
          <div className="brand-card" key={file}>
            <div className={`brand-preview brand-preview-${mode}`}>
              <LogoMark />
              {i < 2 && (
                <span className="brand-name">
                  guardian<span>waf.</span>
                </span>
              )}
            </div>
            <div className="brand-card-footer">
              <span>{name}</span>
              <a href={asset(`/brand/${file}`)} download={file}>
                Download SVG <Download size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="brand-palette">
        {[
          ["Guardian green", "#B6EB8B"],
          ["Forest", "#101411"],
          ["Warm white", "#F6F7F2"],
          ["Evergreen", "#417B2E"],
        ].map(([name, color]) => (
          <div className="brand-swatch" key={color}>
            <div style={{ background: color }} />
            <p>
              {name}
              <code>{color}</code>
            </p>
          </div>
        ))}
      </div>
      <div className="brand-guidance">
        Give the mark space to breathe: keep clear space of at least one quarter
        of its width on every side. Use the light-background variant on pale
        surfaces and the dark-background variant on deep surfaces. Keep the
        original proportions and avoid adding effects. When referring to the
        project in text, use <strong>GuardianWAF</strong>. These assets identify
        the open-source project; using them does not imply endorsement.
      </div>
    </main>
  );
}
