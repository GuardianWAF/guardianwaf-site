import type { SVGProps } from "react";

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

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 44" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 2 37 9v12c0 10-7 17-17 21C10 38 3 31 3 21V9L20 2Z"
        fill="currentColor"
      />
      <path
        d="m20 10 10 4v8c0 5-4 10-10 13-6-3-10-8-10-13v-8l10-4Z"
        fill="var(--background, #101411)"
      />
      <path
        d="M20 15v13m-6-10v6m12-6v6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
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
          <linearGradient
            id="shield-shell"
            x1="184"
            y1="100"
            x2="430"
            y2="444"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#91c88c" />
            <stop offset=".35" stopColor="#285946" />
            <stop offset="1" stopColor="#122d25" />
          </linearGradient>
          <linearGradient
            id="shield-face"
            x1="205"
            y1="135"
            x2="383"
            y2="419"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#274d3b" />
            <stop offset="1" stopColor="#111e18" />
          </linearGradient>
          <linearGradient id="shield-edge" x1="190" y1="120" x2="400" y2="410">
            <stop stopColor="#ccf8ac" />
            <stop offset="1" stopColor="#3f8051" />
          </linearGradient>
          <radialGradient id="shield-aura">
            <stop stopColor="#9bdc66" stopOpacity=".17" />
            <stop offset="1" stopColor="#9bdc66" stopOpacity="0" />
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
        <g className="traffic-path" stroke="#a6e979" strokeWidth="1.5">
          <path d="M35 177h80l55 55h50" />
          <path d="M32 353h78l60-60h55" />
          <path d="M390 259h53l50-50h78" />
          <path d="M384 317h70l45 45h62" />
        </g>
        <g fill="#b9f58d" className="traffic-packets">
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
          <path
            d="m300 102 121 50v112c0 85-53 144-121 181-68-37-121-96-121-181V152l121-50Z"
            fill="#07120c"
            stroke="#a9e583"
            strokeOpacity=".15"
            strokeWidth="17"
          />
          <path
            d="m300 102 121 50v112c0 85-53 144-121 181-68-37-121-96-121-181V152l121-50Z"
            fill="url(#shield-shell)"
            stroke="url(#shield-edge)"
            strokeWidth="2"
          />
          <path
            d="m300 123 102 42v100c0 73-45 125-102 158-57-33-102-85-102-158V165l102-42Z"
            fill="url(#shield-face)"
            stroke="#84b376"
            strokeOpacity=".65"
          />
          <path
            d="m300 140 86 35v90c0 61-37 109-86 140-49-31-86-79-86-140v-90l86-35Z"
            stroke="#b5ef92"
            strokeOpacity=".14"
            strokeDasharray="3 6"
          />
          <path
            d="m300 181 59 25v58c0 43-25 78-59 102-34-24-59-59-59-102v-58l59-25Z"
            fill="#b9ef8c"
          />
          <path
            d="m300 199 44 18v48c0 32-19 58-44 78-25-20-44-46-44-78v-48l44-18Z"
            fill="#183024"
          />
          <path
            d="M300 224v73m-24-61v38m48-38v38"
            stroke="#b9ef8c"
            strokeWidth="12"
          />
          <path
            d="m187 156 107-44"
            stroke="#e2ffcd"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".8"
          />
          <circle cx="300" cy="384" r="3" fill="#b9ef8c" />
        </g>
        <g className="orbit-spark" fill="#c3f5a0">
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
