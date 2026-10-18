"use client";

import { useEffect, useRef } from "react";
import { mountHeroNetwork } from "@/lib/hero-network.mjs";

export function HeroBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const hero = element?.closest<HTMLElement>(".hero-section");
    if (!element || !hero) return;
    return mountHeroNetwork(element, hero);
  }, []);
  return <canvas ref={canvas} className="hero-background" aria-hidden="true" />;
}
