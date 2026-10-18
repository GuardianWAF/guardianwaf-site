import {
  AMBIENT,
  createField,
  fieldPosition,
  moveFieldPointer,
  addFieldPulse,
  fieldPulseRadius,
  advanceField,
} from "./ambient-field.mjs";

const NS = "http://www.w3.org/2000/svg";
const quietSelector =
  "main h1,main h2,main h3,main p,main a,main button,main summary,main .eyebrow,main .hero-assurances,main .protection-strip,.footer-main,.footer-bottom";
const protectedSelector =
  'a,button,input,select,textarea,summary,pre,code,h1,h2,h3,p,li,[contenteditable],[role="button"],[role="tab"],[role="radio"],[data-background-ignore],.site-header,.hero-assurances';
const isProtected = (target) => Boolean(target?.closest?.(protectedSelector));
const number = (n) => Math.round(n * 100) / 100;

export function mountAmbientSvg(svg, uid, env = window) {
  const doc = svg.ownerDocument;
  let disposed = false;
  const element = (tag, attributes, parent) => {
    const node = doc.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes || {}))
      node.setAttribute(key, String(value));
    parent?.appendChild(node);
    return node;
  };
  const id = `ambient-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const defs = element("defs", {}, svg);
  let parent = svg;
  // Two small gradient masks soften every edge without full-screen filters.
  for (const axis of ["x", "y"]) {
    const gradient = element(
      "linearGradient",
      {
        id: `${id}-${axis}-fade`,
        x2: axis === "x" ? "100%" : "0%",
        y2: axis === "y" ? "100%" : "0%",
      },
      defs,
    );
    for (const [offset, color] of [
      ["0%", "black"],
      ["7%", "white"],
      ["93%", "white"],
      ["100%", "black"],
    ])
      element("stop", { offset, "stop-color": color }, gradient);
    const mask = element(
      "mask",
      {
        id: `${id}-${axis}`,
        maskUnits: "userSpaceOnUse",
        x: 0,
        y: 0,
        width: "100%",
        height: "100%",
        style: "mask-type:luminance",
      },
      defs,
    );
    element(
      "rect",
      { width: "100%", height: "100%", fill: `url(#${id}-${axis}-fade)` },
      mask,
    );
    parent = element("g", { mask: `url(#${id}-${axis})` }, parent);
  }
  const quietMask = element(
    "mask",
    {
      id: `${id}-copy`,
      maskUnits: "userSpaceOnUse",
      x: 0,
      y: 0,
      width: "100%",
      height: "100%",
      style: "mask-type:luminance",
    },
    defs,
  );
  element("rect", { width: "100%", height: "100%", fill: "white" }, quietMask);
  const quietLayer = element("g", { fill: "black" }, quietMask);
  const fieldLayer = element("g", { mask: `url(#${id}-copy)` }, parent);
  const objectsLayer = element("g", { class: "ambient-objects" }, fieldLayer);
  const effectsLayer = element("g", { class: "ambient-effects" }, fieldLayer);

  function object(kind) {
    const group = element(
      "g",
      { class: "ambient-object", display: "none" },
      objectsLayer,
    );
    const trace = element(
      "path",
      {
        class: "ambient-trace",
        d:
          kind % 2
            ? "M-100-22H-64L-42 0H-20M20 0H54L76 24H110"
            : "M-90 24H-50L-26 0H-14M14 0H48L68-22H104",
      },
      group,
    );
    trace.setAttribute("fill", "none");
    const paths = [
      "M0-13 11-8 10 3Q8 10 0 15Q-8 10-10 3L-11-8ZM-3-3 3 0-3 3",
      "M0-16 14-8V8L0 16-14 8V-8ZM0-7V7M-6 0H6",
      "M0-14 14 0 0 14-14 0ZM-4 0H4",
      "M-5-9-14 0-5 9M5-9 14 0 5 9M1-12-2 12",
      "M-24 0A24 12 0 1 0 24 0A24 12 0 1 0-24 0M0-25V-18M0 18V25",
      "M-16 0H16M0-16V16M-9-9 9 9M9-9-9 9",
    ];
    element(
      "path",
      { class: "ambient-glyph", d: paths[kind], fill: "none" },
      group,
    );
    element(
      "circle",
      { class: "ambient-node", cx: -90, cy: kind % 2 ? -22 : 24, r: 1.8 },
      group,
    );
    element(
      "rect",
      {
        class: "ambient-node",
        x: kind % 2 ? 108 : 102,
        y: kind % 2 ? 22 : -24,
        width: 3,
        height: 3,
      },
      group,
    );
    return { group, visible: false, opacity: null };
  }
  const effectSlots = Array.from({ length: AMBIENT.maxPulses }, () => {
    const group = element(
      "g",
      { class: "ambient-pulse", display: "none" },
      effectsLayer,
    );
    const rings = [1, 0.72].map((r) =>
      element(
        "circle",
        { r, fill: "none", "vector-effect": "non-scaling-stroke" },
        group,
      ),
    );
    const particles = Array.from({ length: AMBIENT.particles }, () =>
      element("rect", { x: -1.6, y: -1.6, width: 3.2, height: 3.2 }, group),
    );
    return { group, rings, particles, visible: false };
  });
  const media = env.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = media.matches,
    inView = !env.IntersectionObserver;
  let scene = createField(1, 1),
    pool = [],
    raf = null,
    previous = null;
  let dirty = true,
    candidate = null,
    origin = { left: 0, top: 0 };
  const record = (key, value) => {
    if (svg.dataset[key] !== String(value)) svg.dataset[key] = String(value);
  };
  function refreshQuiet() {
    dirty = false;
    const rectangles = [];
    for (const copy of doc.querySelectorAll(quietSelector)) {
      const r = copy.getBoundingClientRect();
      if (
        r.bottom < 0 ||
        r.top > scene.height ||
        r.width === 0 ||
        r.height === 0
      )
        continue;
      rectangles.push(
        element("rect", {
          x: r.left - origin.left - AMBIENT.copyPadding,
          y: r.top - origin.top - AMBIENT.copyPadding,
          width: r.width + AMBIENT.copyPadding * 2,
          height: r.height + AMBIENT.copyPadding * 2,
          rx: 12,
          opacity: 0.88,
        }),
      );
    }
    quietLayer.replaceChildren(...rectangles);
  }
  function draw() {
    if (disposed || doc.hidden || !inView) return;
    if (dirty) refreshQuiet();
    const opening = reduced ? 1 : Math.min(1, scene.age / 1.1);
    let active = 0;
    scene.points.forEach((point, index) => {
      const p = fieldPosition(scene, point, reduced);
      const slot = pool[index];
      if (slot.visible !== p.visible) {
        slot.group.setAttribute("display", p.visible ? "inline" : "none");
        slot.visible = p.visible;
      }
      if (!p.visible) return;
      active++;
      slot.group.setAttribute(
        "transform",
        `translate(${number(p.x)} ${number(p.y)}) rotate(${number(p.angle)})`,
      );
      const opacity = number((0.4 + point.depth * 0.6) * opening);
      if (opacity !== slot.opacity) {
        slot.group.setAttribute("opacity", opacity);
        slot.opacity = opacity;
      }
    });
    effectSlots.forEach((slot, index) => {
      const pulse = scene.pulses[index];
      const visible = Boolean(pulse && !reduced);
      if (visible !== slot.visible) {
        slot.group.setAttribute("display", visible ? "inline" : "none");
        slot.visible = visible;
      }
      if (!pulse || reduced) return;
      const progress = pulse.age / AMBIENT.pulseLife;
      const radius = fieldPulseRadius(scene, pulse);
      const alpha =
        Math.min(1, pulse.age / 0.08) *
        Math.pow(1 - progress, 1.6) *
        pulse.energy;
      slot.group.setAttribute("transform", `translate(${pulse.x} ${pulse.y})`);
      slot.group.setAttribute("opacity", number(alpha));
      slot.rings.forEach((ring, i) => {
        ring.setAttribute("transform", `scale(${number(radius)})`);
        ring.setAttribute(
          "display",
          i === 0 || pulse.variant === 1 ? "inline" : "none",
        );
      });
      slot.particles.forEach((particle, i) => {
        const angle =
          (i / AMBIENT.particles) * Math.PI * 2 + pulse.variant * 0.3;
        const travel = radius * (pulse.variant === 2 ? 0.95 : 0.7);
        particle.setAttribute(
          "transform",
          `translate(${number(Math.cos(angle) * travel)} ${number(Math.sin(angle) * travel)}) rotate(${number(progress * 90 + i * 60)}) scale(${number(1 - progress * 0.7)})`,
        );
      });
    });
    record("activeCount", active);
    record("pulseCount", scene.pulses.length);
  }
  const canRun = () => !disposed && inView && !doc.hidden && !reduced;
  function frame(timestamp) {
    raf = null;
    if (!canRun()) return;
    const fps =
      scene.age - scene.lastInteraction < AMBIENT.idleAfter
        ? AMBIENT.activeFps
        : AMBIENT.idleFps;
    if (previous === null || timestamp - previous >= 1000 / fps - 1) {
      advanceField(
        scene,
        previous === null ? 0 : (timestamp - previous) / 1000,
      );
      previous = timestamp;
      draw();
    }
    raf = env.requestAnimationFrame(frame);
  }
  function sync() {
    if (disposed) return;
    if (raf !== null) env.cancelAnimationFrame(raf);
    raf = null;
    previous = null;
    record("sceneState", reduced ? "reduced" : canRun() ? "running" : "paused");
    if (reduced) draw();
    else if (canRun()) raf = env.requestAnimationFrame(frame);
  }
  function resize() {
    if (disposed) return;
    const r = svg.getBoundingClientRect();
    const width = Math.max(1, r.width),
      height = Math.max(1, r.height);
    origin = { left: r.left, top: r.top };
    if (width !== scene.width || height !== scene.height) {
      scene = createField(width, height);
      scene.scroll = env.scrollY;
      objectsLayer.replaceChildren();
      pool = scene.points.map((point) => object(point.kind));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      record("objectCount", pool.length);
    }
    dirty = true;
    draw();
    sync();
  }
  function leave() {
    scene.pointer.active = false;
    candidate = null;
  }
  function out(event) {
    if (!event.relatedTarget) leave();
  }
  const coordinate = (event) => ({
    x: event.clientX - origin.left,
    y: event.clientY - origin.top,
  });
  function move(event) {
    const p = coordinate(event);
    if (
      candidate &&
      event.pointerId === candidate.id &&
      Math.hypot(p.x - candidate.x, p.y - candidate.y) > AMBIENT.tapSlop
    )
      candidate = null;
    if (event.pointerType === "touch" || reduced || !inView || doc.hidden)
      return;
    moveFieldPointer(scene, p.x, p.y);
  }
  function down(event) {
    candidate = null;
    if (
      reduced ||
      !inView ||
      doc.hidden ||
      event.isPrimary === false ||
      event.button !== 0 ||
      isProtected(event.target)
    )
      return;
    candidate = {
      ...coordinate(event),
      id: event.pointerId,
      time: env.performance.now(),
    };
  }
  function up(event) {
    const start = candidate;
    candidate = null;
    if (
      !start ||
      reduced ||
      !inView ||
      doc.hidden ||
      start.id !== event.pointerId ||
      isProtected(event.target) ||
      String(doc.getSelection?.() || "").trim()
    )
      return;
    const p = coordinate(event);
    if (
      Math.hypot(p.x - start.x, p.y - start.y) > AMBIENT.tapSlop ||
      env.performance.now() - start.time > AMBIENT.tapDuration
    )
      return;
    addFieldPulse(scene, p.x, p.y);
    record("pulseCount", scene.pulses.length);
  }
  function scroll() {
    scene.scroll = env.scrollY;
    leave();
    dirty = true;
    if (reduced) draw();
  }
  function visibility() {
    leave();
    sync();
  }
  function preference() {
    reduced = media.matches;
    scene.pulses = [];
    scene.pointer.strength = 0;
    scene.points.forEach((point) => {
      point.ox = 0;
      point.oy = 0;
    });
    leave();
    dirty = true;
    sync();
  }
  const sizeObserver = new env.ResizeObserver(resize);
  const contentObserver = new env.MutationObserver(() => {
    if (disposed) return;
    dirty = true;
    if (reduced) draw();
  });
  const intersection = env.IntersectionObserver
    ? new env.IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          if (!inView) leave();
          sync();
        },
        { threshold: 0.01 },
      )
    : null;
  const events = [
    ["pointermove", move],
    ["pointerdown", down],
    ["pointerup", up],
    ["pointercancel", leave],
    ["pointerleave", leave],
    ["pointerout", out],
  ];
  events.forEach(([name, listener]) =>
    doc.addEventListener(name, listener, { passive: true }),
  );
  doc.addEventListener("visibilitychange", visibility);
  env.addEventListener("scroll", scroll, { passive: true });
  env.addEventListener("resize", resize, { passive: true });
  env.addEventListener("blur", leave);
  media.addEventListener("change", preference);
  sizeObserver.observe(svg);
  sizeObserver.observe(doc.body);
  const main = doc.querySelector("main");
  if (main) contentObserver.observe(main, { childList: true, subtree: true });
  resize();
  intersection?.observe(svg);
  return () => {
    disposed = true;
    if (raf !== null) env.cancelAnimationFrame(raf);
    events.forEach(([name, listener]) =>
      doc.removeEventListener(name, listener),
    );
    doc.removeEventListener("visibilitychange", visibility);
    env.removeEventListener("scroll", scroll);
    env.removeEventListener("resize", resize);
    env.removeEventListener("blur", leave);
    media.removeEventListener("change", preference);
    sizeObserver.disconnect();
    contentObserver.disconnect();
    intersection?.disconnect();
    svg.replaceChildren();
    record("sceneState", "disposed");
  };
}
