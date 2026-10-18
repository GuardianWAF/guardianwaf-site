"use client";

import { useEffect, useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { mountAmbientSvg } from "@/lib/ambient-svg.mjs";

export function AnimatedBackground() {
  const svg = useRef<SVGSVGElement>(null);
  const id = useId();
  const pathname = usePathname();
  useEffect(() => {
    if (!svg.current) return;
    return mountAmbientSvg(svg.current, id);
  }, [id, pathname]);
  return (
    <svg
      ref={svg}
      className="site-background"
      aria-hidden="true"
      focusable="false"
    />
  );
}
