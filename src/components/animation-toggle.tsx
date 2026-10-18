"use client";

import { useSyncExternalStore } from "react";
import { Mouse, MouseOff } from "lucide-react";
import {
  animationsEnabled,
  setAnimationsEnabled,
  subscribeAnimations,
} from "@/lib/animation-preference";

const serverSnapshot = () => true;

export function AnimationToggle() {
  const enabled = useSyncExternalStore(
    subscribeAnimations,
    animationsEnabled,
    serverSnapshot,
  );
  const label = enabled ? "Disable mouse effects" : "Enable mouse effects";
  const Icon = enabled ? Mouse : MouseOff;
  return (
    <span className="animation-control">
      <button
        type="button"
        className="animation-toggle"
        aria-label={label}
        aria-pressed={enabled}
        title={label}
        onClick={() => setAnimationsEnabled(!animationsEnabled())}
      >
        <Icon size={18} aria-hidden="true" />
      </button>
      <span className="animation-tooltip" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
