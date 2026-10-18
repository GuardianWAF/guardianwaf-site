"use client";

import { useEffect, useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { mountAmbientController } from "@/lib/ambient-controller.mjs";

export function AnimatedBackground() {
  const svg = useRef<SVGSVGElement>(null);
  const interactions = useRef<SVGSVGElement>(null);
  const id = useId();
  const pathname = usePathname();
  useEffect(() => {
    if (!svg.current || !interactions.current) return;
    return mountAmbientController(
      svg.current,
      id,
      window,
      interactions.current,
    );
  }, [id, pathname]);
  return (
    <>
      <svg
        ref={svg}
        className="site-background"
        aria-hidden="true"
        focusable="false"
      />
      <svg
        ref={interactions}
        className="site-interactions"
        aria-hidden="true"
        focusable="false"
      />
    </>
  );
}
