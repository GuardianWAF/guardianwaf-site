import {
  AMBIENT,
  createField,
  fieldPosition,
  fieldResponse,
  moveFieldPointer,
  addFieldPulse,
  fieldPulseRadius,
  fieldRelayEnergy,
  advanceField,
} from "./ambient-field.mjs";

const NS = "http://www.w3.org/2000/svg";
const protectedSelector =
  'a,button,input,select,textarea,summary,[contenteditable],[role="button"],[role="tab"],[role="radio"],[role="checkbox"],[role="switch"],[role="link"],[data-background-ignore],.site-header';
const isProtected = (target) => Boolean(target?.closest?.(protectedSelector));
const number = (n) => Math.round(n * 100) / 100;
const glyphs = [
  "M0-13 11-8 10 3Q8 10 0 15Q-8 10-10 3L-11-8ZM-3-3 3 0-3 3",
  "M0-16 14-8V8L0 16-14 8V-8ZM0-7V7M-6 0H6",
  "M0-14 14 0 0 14-14 0ZM-4 0H4",
  "M-5-9-14 0-5 9M5-9 14 0 5 9M1-12-2 12",
  "M-24 0A24 12 0 1 0 24 0A24 12 0 1 0-24 0M0-25V-18M0 18V25",
  "M-16 0H16M0-16V16M-9-9 9 9M9-9-9 9",
];
const tracePath = (kind) =>
  kind % 2
    ? "M-100-22H-64L-42 0H-20M20 0H54L76 24H110"
    : "M-90 24H-50L-26 0H-14M14 0H48L68-22H104";

export function mountAmbientSvg(
  svg,
  uid,
  env = window,
  interactionSvg,
  {
    respectReducedMotion = true,
    mouseEffects = true,
    followMousePreference = false,
  } = {},
) {
  if (!interactionSvg)
    throw new Error("An independent interaction SVG is required");
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
  // Masks only fade viewport edges. Content must never punch rectangular holes.
  function viewportLayer(root, prefix, edge) {
    const defs = element("defs", {}, root);
    let parent = root;
    for (const axis of ["x", "y"]) {
      const gradient = element(
        "linearGradient",
        {
          id: `${prefix}-${axis}-fade`,
          x2: axis === "x" ? "100%" : "0%",
          y2: axis === "y" ? "100%" : "0%",
        },
        defs,
      );
      for (const [offset, color] of [
        ["0%", "black"],
        [`${edge}%`, "white"],
        [`${100 - edge}%`, "white"],
        ["100%", "black"],
      ])
        element("stop", { offset, "stop-color": color }, gradient);
      const mask = element(
        "mask",
        {
          id: `${prefix}-${axis}`,
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
        { width: "100%", height: "100%", fill: `url(#${prefix}-${axis}-fade)` },
        mask,
      );
      parent = element("g", { mask: `url(#${prefix}-${axis})` }, parent);
    }
    return { defs, parent };
  }
  const background = viewportLayer(svg, id, 7);
  const foreground = viewportLayer(interactionSvg, `${id}-interaction`, 3);
  const objectsLayer = element(
    "g",
    { class: "ambient-objects" },
    background.parent,
  );
  const liftLayer = element("g", { class: "ambient-lifts" }, foreground.parent);
  const effectsLayer = element(
    "g",
    { class: "ambient-effects" },
    foreground.parent,
  );

  function object(kind, layer = objectsLayer, className = "ambient-object") {
    const group = element("g", { class: className, display: "none" }, layer);
    const trace = element(
      "path",
      {
        class: "ambient-trace",
        d: tracePath(kind),
      },
      group,
    );
    trace.setAttribute("fill", "none");
    const glyph = element(
      "path",
      { class: "ambient-glyph", d: glyphs[kind], fill: "none" },
      group,
    );
    const start = element(
      "circle",
      { class: "ambient-node", cx: -90, cy: kind % 2 ? -22 : 24, r: 1.8 },
      group,
    );
    const end = element(
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
    return {
      group,
      trace,
      glyph,
      start,
      end,
      kind,
      visible: false,
      opacity: null,
    };
  }
  function configureObject(slot, kind) {
    if (slot.kind === kind) return;
    slot.trace.setAttribute("d", tracePath(kind));
    slot.glyph.setAttribute("d", glyphs[kind]);
    slot.start.setAttribute("cy", kind % 2 ? -22 : 24);
    slot.end.setAttribute("x", kind % 2 ? 108 : 102);
    slot.end.setAttribute("y", kind % 2 ? 22 : -24);
    slot.kind = kind;
  }
  const liftSlots = Array.from({ length: AMBIENT.maxLifted }, () =>
    object(0, liftLayer, "ambient-lift"),
  );
  const trailsLayer = element(
    "g",
    { class: "ambient-trails" },
    foreground.parent,
  );
  const trailSlots = Array.from({ length: AMBIENT.maxTrails }, () => {
    const group = element(
      "g",
      { class: "ambient-trail", display: "none" },
      trailsLayer,
    );
    const soft = element(
      "path",
      { class: "ambient-trail-soft", fill: "none" },
      group,
    );
    const core = element(
      "path",
      { class: "ambient-trail-core", fill: "none" },
      group,
    );
    return { group, soft, core };
  });
  const links = Array.from({ length: 4 }, () =>
    element(
      "path",
      { class: "ambient-pointer-link", fill: "none", display: "none" },
      foreground.parent,
    ),
  );
  const glow = element("radialGradient", { id: `${id}-glow` }, foreground.defs);
  for (const [offset, opacity] of [
    [0, 1],
    [0.4, 0.3],
    [1, 0],
  ])
    element(
      "stop",
      { offset, "stop-color": "currentColor", "stop-opacity": opacity },
      glow,
    );
  const pointerGroup = element(
    "g",
    { class: "ambient-pointer", display: "none" },
    foreground.parent,
  );
  const pointerGlow = element(
    "circle",
    { class: "ambient-pointer-glow", r: 126, fill: `url(#${id}-glow)` },
    pointerGroup,
  );
  const pointerRing = element(
    "circle",
    {
      class: "ambient-cursor-ring",
      r: 19,
      fill: "none",
      "stroke-dasharray": "5 10",
    },
    pointerGroup,
  );
  element(
    "path",
    { class: "ambient-cursor-core", d: "M-6 0H6M0-6V6", fill: "none" },
    pointerGroup,
  );
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
    const halo = element(
      "circle",
      {
        class: "ambient-wave-halo",
        r: 1,
        fill: "none",
        "vector-effect": "non-scaling-stroke",
      },
      group,
    );
    const particles = Array.from({ length: AMBIENT.particles }, () =>
      element("rect", { x: -1.6, y: -1.6, width: 3.2, height: 3.2 }, group),
    );
    const relays = Array.from({ length: AMBIENT.relayCount }, () => {
      const relayGroup = element(
        "g",
        { class: "ambient-relay", display: "none" },
        effectsLayer,
      );
      const link = element(
        "path",
        { class: "ambient-relay-link", fill: "none" },
        relayGroup,
      );
      const ring = element(
        "circle",
        { class: "ambient-relay-ring", fill: "none", r: 1 },
        relayGroup,
      );
      return { group: relayGroup, link, ring };
    });
    return { group, rings, halo, particles, relays, visible: false };
  });
  const media = env.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = respectReducedMotion && media.matches,
    inView = !env.IntersectionObserver;
  let scene = createField(1, 1),
    pool = [],
    raf = null,
    previous = null;
  let candidate = null,
    origin = { left: 0, top: 0 };
  const record = (key, value, target = svg) => {
    if (target.dataset[key] !== String(value))
      target.dataset[key] = String(value);
  };
  function draw() {
    if (disposed || doc.hidden || !inView) return;
    const opening = reduced ? 1 : Math.min(1, scene.age / 1.1);
    let active = 0;
    const responses = [];
    scene.points.forEach((point, index) => {
      const p = fieldPosition(scene, point, reduced);
      const slot = pool[index];
      if (slot.visible !== p.visible) {
        slot.group.setAttribute("display", p.visible ? "inline" : "none");
        slot.visible = p.visible;
      }
      if (!p.visible) return;
      active++;
      if (!reduced && mouseEffects) {
        const response = fieldResponse(scene, point, p);
        if (response.energy > 0.025) responses.push({ point, p, ...response });
      }
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
    // Lift only nearby, energized geometry above content. No text/card masks.
    responses.sort((a, b) => b.energy - a.energy);
    liftSlots.forEach((slot, index) => {
      const response = responses[index];
      const visible = Boolean(response && !reduced);
      if (visible !== slot.visible) {
        slot.group.setAttribute("display", visible ? "inline" : "none");
        slot.visible = visible;
      }
      if (!visible) return;
      configureObject(slot, response.point.kind);
      slot.group.setAttribute(
        "transform",
        `translate(${number(response.p.x)} ${number(response.p.y)}) rotate(${number(response.p.angle)})`,
      );
      slot.group.setAttribute(
        "opacity",
        number(response.energy * (0.55 + response.point.depth * 0.3)),
      );
    });
    trailSlots.forEach((slot, index) => {
      const trail = !reduced && scene.trails[index];
      slot.group.setAttribute("display", trail ? "inline" : "none");
      if (!trail) return;
      const d = `M${number(trail.x)} ${number(trail.y)}L${number(trail.toX)} ${number(trail.toY)}`;
      slot.soft.setAttribute("d", d);
      slot.core.setAttribute("d", d);
      slot.group.setAttribute(
        "opacity",
        number(Math.pow(1 - trail.age / AMBIENT.trailLife, 2)),
      );
    });
    const pointer = scene.pointer;
    const pointerVisible = mouseEffects && !reduced && pointer.strength > 0.01;
    pointerGroup.setAttribute("display", pointerVisible ? "inline" : "none");
    if (pointerVisible) {
      pointerGroup.setAttribute(
        "transform",
        `translate(${number(pointer.x)} ${number(pointer.y)})`,
      );
      pointerGroup.setAttribute("opacity", number(pointer.strength));
      pointerRing.setAttribute(
        "transform",
        `rotate(${number(scene.time * 28)})`,
      );
    }
    const connected = pointerVisible
      ? responses.filter((r) => r.pointer > 0.06).slice(0, links.length)
      : [];
    links.forEach((link, index) => {
      const response = connected[index];
      link.setAttribute("display", response ? "inline" : "none");
      if (!response) return;
      link.setAttribute(
        "d",
        `M${number(pointer.x)} ${number(pointer.y)}Q${number((pointer.x + response.p.x) / 2 - (response.p.y - pointer.y) * 0.18)} ${number((pointer.y + response.p.y) / 2 + (response.p.x - pointer.x) * 0.18)} ${number(response.p.x)} ${number(response.p.y)}`,
      );
      link.setAttribute("opacity", number(response.pointer * 0.5));
    });
    effectSlots.forEach((slot, index) => {
      const pulse = scene.pulses[index];
      const visible = Boolean(pulse && !reduced);
      if (visible !== slot.visible) {
        slot.group.setAttribute("display", visible ? "inline" : "none");
        slot.visible = visible;
      }
      slot.relays.forEach((relaySlot, i) => {
        const relay = !reduced && pulse?.relays[i];
        const energy = relay ? fieldRelayEnergy(pulse, relay) : 0;
        relaySlot.group.setAttribute(
          "display",
          energy > 0.005 ? "inline" : "none",
        );
        if (energy <= 0.005) return;
        const p = fieldPosition(scene, relay.point);
        if (!p.visible) {
          relaySlot.group.setAttribute("display", "none");
          return;
        }
        const from = relay.from ? fieldPosition(scene, relay.from) : pulse;
        const progress = (pulse.age - relay.delay) / AMBIENT.relayLife;
        relaySlot.group.setAttribute("opacity", number(energy * 0.65));
        relaySlot.link.setAttribute(
          "d",
          `M${number(from.x)} ${number(from.y)}Q${number((from.x + p.x) / 2 - (p.y - from.y) * 0.16)} ${number((from.y + p.y) / 2 + (p.x - from.x) * 0.16)} ${number(p.x)} ${number(p.y)}`,
        );
        relaySlot.ring.setAttribute("cx", number(p.x));
        relaySlot.ring.setAttribute("cy", number(p.y));
        relaySlot.ring.setAttribute(
          "r",
          number(10 + progress * (scene.mobile ? 45 : 75)),
        );
      });
      if (!pulse || reduced) return;
      const progress = pulse.age / AMBIENT.pulseLife;
      const radius = fieldPulseRadius(scene, pulse);
      const alpha =
        Math.min(1, pulse.age / 0.08) *
        Math.pow(1 - progress, 1.6) *
        pulse.energy;
      slot.group.setAttribute("transform", `translate(${pulse.x} ${pulse.y})`);
      slot.group.setAttribute("opacity", number(alpha));
      slot.halo.setAttribute("transform", `scale(${number(radius)})`);
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
    record("pulseCount", scene.pulses.length, interactionSvg);
    record("trailCount", scene.trails.length, interactionSvg);
    record(
      "liftCount",
      Math.min(responses.length, AMBIENT.maxLifted),
      interactionSvg,
    );
  }
  const canRun = () => !disposed && inView && !doc.hidden && !reduced;
  function frame(timestamp) {
    raf = null;
    if (!canRun()) return;
    const fps =
      mouseEffects && scene.age - scene.lastInteraction < AMBIENT.idleAfter
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
    const state = reduced ? "reduced" : canRun() ? "running" : "paused";
    record("sceneState", state);
    record("sceneState", mouseEffects ? state : "disabled", interactionSvg);
    record("mouseEffects", mouseEffects ? "on" : "off", interactionSvg);
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
      interactionSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      pointerGlow.setAttribute("r", scene.mobile ? 76 : 126);
      record("objectCount", pool.length);
    }
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
    record("pulseCount", scene.pulses.length, interactionSvg);
  }
  function scroll() {
    scene.scroll = env.scrollY;
    // Scroll invalidates a tap, not the stationary mouse's viewport position.
    candidate = null;
    if (scene.pointer.active) scene.lastInteraction = scene.age;
    if (reduced) draw();
  }
  function visibility() {
    leave();
    sync();
  }
  function clearEffects() {
    scene.pulses = [];
    scene.trails = [];
    scene.pointer.strength = 0;
    scene.points.forEach((point) => {
      point.ox = 0;
      point.oy = 0;
      point.vx = 0;
      point.vy = 0;
      point.orbit = 0;
    });
    leave();
  }
  function preference() {
    const next = respectReducedMotion && media.matches;
    if (next === reduced) return;
    reduced = next;
    clearEffects();
    bindPointerEvents();
    sync();
  }
  function setMouseEffects(enabled) {
    if (disposed || mouseEffects === enabled) return;
    mouseEffects = enabled;
    if (followMousePreference) respectReducedMotion = !enabled;
    clearEffects();
    const next = respectReducedMotion && media.matches;
    const motionChanged = next !== reduced;
    reduced = next;
    bindPointerEvents();
    if (motionChanged) sync();
    else {
      record(
        "sceneState",
        mouseEffects ? (canRun() ? "running" : "paused") : "disabled",
        interactionSvg,
      );
      record("mouseEffects", mouseEffects ? "on" : "off", interactionSvg);
    }
    draw();
  }
  const sizeObserver = new env.ResizeObserver(resize);
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
    ["pointerleave", out],
    ["pointerout", out],
  ];
  let listening = false;
  function bindPointerEvents() {
    const active = mouseEffects && !reduced && !disposed;
    if (active === listening) return;
    listening = active;
    events.forEach(([name, listener]) => {
      if (active)
        doc.addEventListener(name, listener, { passive: true, capture: true });
      else doc.removeEventListener(name, listener, true);
    });
    if (active) env.addEventListener("blur", leave);
    else env.removeEventListener("blur", leave);
  }
  bindPointerEvents();
  doc.addEventListener("visibilitychange", visibility);
  env.addEventListener("scroll", scroll, { passive: true });
  env.addEventListener("resize", resize, { passive: true });
  media.addEventListener("change", preference);
  sizeObserver.observe(svg);
  resize();
  intersection?.observe(svg);
  const dispose = () => {
    disposed = true;
    if (raf !== null) env.cancelAnimationFrame(raf);
    bindPointerEvents();
    doc.removeEventListener("visibilitychange", visibility);
    env.removeEventListener("scroll", scroll);
    env.removeEventListener("resize", resize);
    media.removeEventListener("change", preference);
    sizeObserver.disconnect();
    intersection?.disconnect();
    svg.replaceChildren();
    interactionSvg.replaceChildren();
    record("sceneState", "disposed");
    record("sceneState", "disposed", interactionSvg);
  };
  dispose.setMouseEffects = setMouseEffects;
  return dispose;
}
