import { useId, type SVGProps } from "react";
import { shieldGradients, shieldLayers } from "@/lib/brand-shapes.mjs";

export function Github(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 18, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.08c-3.09.67-3.74-1.31-3.74-1.31-.5-1.29-1.23-1.63-1.23-1.63-1.01-.7.08-.68.08-.68 1.11.08 1.69 1.14 1.69 1.14.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.71-1.49-2.47-.28-5.07-1.24-5.07-5.49 0-1.21.43-2.2 1.14-2.98-.11-.28-.5-1.41.11-2.94 0 0 .93-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.22 2.66.11 2.94.71.78 1.14 1.77 1.14 2.98 0 4.26-2.6 5.21-5.08 5.48.4.35.75 1.02.75 2.06v3.07c0 .3.2.65.76.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

function ShieldGlyph() {
  const id = useId();
  return (
    <>
      <defs>
        {shieldGradients.map(({ name, from, to }) => (
          <linearGradient
            key={name}
            id={`${id}-${name}`}
            x1="10"
            y1="10"
            x2="90"
            y2="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
      </defs>
      {shieldLayers.map(({ d, gradient, fill, opacity }, index) => (
        <path
          key={index}
          d={d}
          fill={gradient ? `url(#${id}-${gradient})` : fill}
          opacity={opacity}
        />
      ))}
    </>
  );
}

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 120" fill="none" aria-hidden="true" {...props}>
      <ShieldGlyph />
    </svg>
  );
}

export function ShieldArt() {
  return (
    <div
      className="shield-art"
      aria-label="GuardianWAF shield protecting application traffic"
      role="img"
    >
      <svg
        viewBox="0 0 600 560"
        fill="none"
        className="shield-visual"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="shield-aura">
            <stop stopColor="#307fe9" stopOpacity=".18" />
            <stop offset="1" stopColor="#307fe9" stopOpacity="0" />
          </radialGradient>
          <pattern
            id="tiny-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path d="M32 0H0v32" stroke="currentColor" strokeOpacity=".09" />
          </pattern>
        </defs>
        <circle cx="304" cy="280" r="250" fill="url(#shield-aura)" />
        <path d="M30 100H570V480H30z" fill="url(#tiny-grid)" />
        <g stroke="currentColor" opacity=".19">
          <ellipse
            cx="300"
            cy="295"
            rx="258"
            ry="123"
            transform="rotate(-26 300 295)"
          />
          <ellipse
            cx="300"
            cy="295"
            rx="235"
            ry="172"
            transform="rotate(32 300 295)"
          />
          <path d="M28 294h544M300 40v478" strokeDasharray="3 7" />
        </g>
        <g className="traffic-path" stroke="#66aaff" strokeWidth="1.5">
          <path d="M35 177h80l55 55h50" />
          <path d="M32 353h78l60-60h55" />
          <path d="M390 259h53l50-50h78" />
          <path d="M384 317h70l45 45h62" />
        </g>
        <g fill="#88c2ff" className="traffic-packets">
          <circle r="4">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="M35 177h80l55 55h50"
            />
          </circle>
          <circle r="4">
            <animateMotion
              dur="4s"
              begin="-2s"
              repeatCount="indefinite"
              path="M32 353h78l60-60h55"
            />
          </circle>
          <circle r="4">
            <animateMotion
              dur="4s"
              begin="-1s"
              repeatCount="indefinite"
              path="M390 259h53l50-50h78"
            />
          </circle>
        </g>
        <g className="floating-shield">
          <g transform="translate(150 98) scale(3)">
            <ShieldGlyph />
          </g>
        </g>
        <g className="orbit-spark" fill="#a9d4ff">
          <path d="m493 119 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z" />
          <path d="m114 412 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
        </g>
        <g fill="currentColor" opacity=".5">
          <circle cx="60" cy="177" r="3" />
          <circle cx="548" cy="210" r="3" />
          <circle cx="549" cy="362" r="3" />
        </g>
      </svg>
      <div className="art-label art-label-top">
        <span className="status-dot" /> GUARDIAN ENGINE{" "}
        <span className="label-dim">/ ACTIVE</span>
      </div>
      <div className="art-label art-label-left">
        <span className="mini-cross">+</span> INCOMING REQUEST
      </div>
      <div className="art-label art-label-right">
        <span className="status-dot" /> THREAT BLOCKED
      </div>
      <div className="art-coordinate">
        35° 41′ N &nbsp; / &nbsp; DEFENSE IN DEPTH
      </div>
    </div>
  );
}
