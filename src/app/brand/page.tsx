import type { Metadata } from "next";
import { Download } from "lucide-react";
import Image from "next/image";
import { brandAsset, siteUrl } from "@/lib/site";

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
        Layers of blue protection, a deep navy core, and a terminal prompt at
        the center. A guardian built for the people who build the web.
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
          [
            "dark",
            "Stacked logo · dark backgrounds",
            "guardianwaf-stacked-dark.svg",
          ],
          [
            "light",
            "Stacked logo · light backgrounds",
            "guardianwaf-stacked-light.svg",
          ],
        ].map(([mode, name, file], i) => (
          <div className="brand-card" key={file}>
            <div className={`brand-preview brand-preview-${mode}`}>
              <Image
                src={brandAsset(`/brand/${file}`)}
                alt={`GuardianWAF ${i < 2 || i > 3 ? "logo" : "shield"} for ${mode} backgrounds`}
                width={i < 2 ? 269 : i > 3 ? 190 : 75}
                height={i < 2 ? 48 : i > 3 ? 190 : 90}
                className={
                  i < 2
                    ? "brand-logo-image"
                    : i > 3
                      ? "brand-stacked-image"
                      : "brand-mark-image"
                }
              />
            </div>
            <div className="brand-card-footer">
              <span>{name}</span>
              <a href={brandAsset(`/brand/${file}`)} download={file}>
                Download SVG <Download size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="brand-downloads">
        <span>Need a transparent PNG?</span>
        <a
          href={brandAsset("/brand/guardianwaf-mark.png")}
          download="guardianwaf-mark.png"
        >
          Shield · 512 px <Download size={13} />
        </a>
        <a
          href={brandAsset("/brand/guardianwaf-stacked.png")}
          download="guardianwaf-stacked.png"
        >
          Stacked logo · 1200 px <Download size={13} />
        </a>
      </div>
      <div className="brand-palette">
        {[
          ["Guardian blue", "#307FE9"],
          ["Sky", "#88C2FF"],
          ["Navy", "#172F4C"],
          ["Cloud", "#F5F8FD"],
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
