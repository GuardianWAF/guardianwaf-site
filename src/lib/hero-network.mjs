// GuardianWAF's request-routing field. CSS pixels and seconds throughout.
export const HERO_NETWORK = Object.freeze({
  maxNodes: 84,
  mobileNodes: 16,
  spacing: 175,
  maxDpr: 1.75,
  maxPixels: 3_200_000,
  motionSpeed: 1,
  pointerRadius: 175,
  displacement: 26,
  pulseRadius: 215,
  pulseLife: 1.55,
  maxPulses: 6,
  trailLife: 0.7,
  maxTrails: 14,
  idleAfter: 3,
  idleFps: 24,
  activeFps: 60,
  tapSlop: 9,
  tapDuration: 650,
  edgeFade: 85,
  colors: {
    dark: {
      wire: "#477daf",
      node: "#83bfff",
      pulse: "#a3d5ff",
      threat: "#eab88a",
      opacity: 0.48,
    },
    light: {
      wire: "#598bc5",
      node: "#2d74c7",
      pulse: "#347fdb",
      threat: "#a77344",
      opacity: 0.42,
    },
  },
});

const clamp = (value, low = 0, high = 1) =>
  Math.max(low, Math.min(high, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const noise = (index) => {
  const n = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export function canvasResolution(width, height, dpr) {
  const scale = Math.min(
    dpr || 1,
    HERO_NETWORK.maxDpr,
    Math.sqrt(HERO_NETWORK.maxPixels / Math.max(1, width * height)),
  );
  return {
    scale,
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

export function createNetwork(width, height) {
  const mobile = width < 700;
  const columns = Math.max(
    2,
    Math.min(14, Math.round(width / HERO_NETWORK.spacing)),
  );
  const rows = Math.max(3, Math.min(6, Math.round(height / 165)));
  const limit = mobile ? HERO_NETWORK.mobileNodes : HERO_NETWORK.maxNodes;
  const points = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      if (points.length >= limit) break;
      const index = points.length;
      points.push({
        x: ((col + 0.4 + noise(index + 4) * 0.3) / columns) * width,
        y: ((row + 0.3 + noise(index + 30) * 0.4) / rows) * height,
        ox: 0,
        oy: 0,
        depth: 0.4 + noise(index + 19) * 0.6,
        phase: noise(index + 5) * Math.PI * 2,
        frequency: 0.12 + noise(index + 99) * 0.13,
        kind: index % 9,
      });
    }
  const links = [];
  points.forEach((_, index) => {
    if ((index + 1) % columns && points[index + 1])
      links.push({
        a: index,
        b: index + 1,
        phase: noise(index + 21),
        speed: 0.035 + noise(index + 51) * 0.035,
      });
    if (points[index + columns] && index % 3 !== 1)
      links.push({
        a: index,
        b: index + columns,
        phase: noise(index + 83),
        speed: 0.025 + noise(index + 33) * 0.03,
      });
  });
  return {
    width,
    height,
    mobile,
    points,
    links,
    pulses: [],
    trails: [],
    time: 0,
    age: 0,
    lastInteraction: -10,
    variant: 0,
    pointer: { x: 0, y: 0, active: false, strength: 0 },
  };
}

export function movePointer(scene, x, y) {
  scene.pointer.x = x;
  scene.pointer.y = y;
  scene.pointer.active = true;
  scene.lastInteraction = scene.age;
  const last = scene.trails.at(-1);
  if (!last || Math.hypot(x - last.x, y - last.y) > 18) {
    scene.trails.push({ x, y, age: 0 });
    if (scene.trails.length > HERO_NETWORK.maxTrails) scene.trails.shift();
  }
}

export function addPulse(scene, x, y) {
  if (x < 0 || y < 0 || x > scene.width || y > scene.height) return;
  scene.lastInteraction = scene.age;
  const last = scene.pulses.at(-1);
  if (last && last.age < 0.16 && Math.hypot(last.x - x, last.y - y) < 45) {
    last.energy = Math.min(1.35, last.energy + 0.1);
    return;
  }
  scene.pulses.push({ x, y, age: 0, energy: 1, variant: scene.variant++ % 3 });
  if (scene.pulses.length > HERO_NETWORK.maxPulses) scene.pulses.shift();
}

export function advanceNetwork(scene, seconds) {
  const dt = clamp(seconds, 0, 0.05);
  scene.age += dt;
  const awake = scene.age - scene.lastInteraction < HERO_NETWORK.idleAfter;
  scene.time += dt * (awake ? 1 : 0.6) * HERO_NETWORK.motionSpeed;
  const pointer = scene.pointer;
  pointer.strength +=
    ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-dt * 6));
  for (const point of scene.points) {
    const dx = point.x - pointer.x,
      dy = point.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const force =
      smooth(1 - distance / HERO_NETWORK.pointerRadius) *
      pointer.strength *
      HERO_NETWORK.displacement *
      point.depth;
    let tx = (dx / Math.max(distance, 1)) * force,
      ty = (dy / Math.max(distance, 1)) * force;
    for (const pulse of scene.pulses) {
      const radius = pulseRadius(scene, pulse);
      const px = point.x - pulse.x,
        py = point.y - pulse.y,
        pd = Math.hypot(px, py);
      const energy =
        Math.exp(-Math.pow((pd - radius) / 32, 2)) *
        (1 - pulse.age / HERO_NETWORK.pulseLife) *
        13;
      tx += (px / Math.max(pd, 1)) * energy;
      ty += (py / Math.max(pd, 1)) * energy;
    }
    const blend = 1 - Math.exp(-dt * 7);
    point.ox += (tx - point.ox) * blend;
    point.oy += (ty - point.oy) * blend;
  }
  scene.pulses = scene.pulses.filter(
    (pulse) => (pulse.age += dt) < HERO_NETWORK.pulseLife,
  );
  scene.trails = scene.trails.filter(
    (trail) => (trail.age += dt) < HERO_NETWORK.trailLife,
  );
}

function pulseRadius(scene, pulse) {
  const max = scene.mobile
    ? HERO_NETWORK.pulseRadius * 0.6
    : HERO_NETWORK.pulseRadius;
  return (
    8 +
    (max - 8) * (1 - Math.pow(1 - clamp(pulse.age / HERO_NETWORK.pulseLife), 3))
  );
}

function position(point, time) {
  return {
    x:
      point.x +
      point.ox +
      Math.sin(time * point.frequency + point.phase) * 9 * point.depth,
    y:
      point.y +
      point.oy +
      Math.cos(time * point.frequency * 0.8 + point.phase) * 12 * point.depth,
  };
}

function edgeOpacity(scene, x, y) {
  return smooth(
    Math.min(x, scene.width - x, y, scene.height - y) / HERO_NETWORK.edgeFade,
  );
}

function drawNetwork(ctx, scene, theme, quiet, reduced) {
  const color = HERO_NETWORK.colors[theme];
  const opening = reduced ? 1 : smooth(scene.age / 1.2);
  const opacityAt = (x, y) => {
    let ink = 1;
    if (quiet) {
      const dx = Math.max(quiet.left - x, 0, x - quiet.right);
      const dy = Math.max(quiet.top - y, 0, y - quiet.bottom);
      ink = 0.12 + smooth(Math.hypot(dx, dy) / 100) * 0.88;
    }
    return edgeOpacity(scene, x, y) * ink * opening;
  };
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const positions = scene.points.map((point) =>
    position(point, reduced ? 0 : scene.time),
  );
  // Orthogonal traces and moving request packets, rather than a generic star field.
  scene.links.forEach((link, index) => {
    const a = positions[link.a],
      b = positions[link.b];
    const mx = (a.x + b.x) / 2,
      my = (a.y + b.y) / 2;
    const opacity = opacityAt(mx, my);
    ctx.strokeStyle = color.wire;
    ctx.globalAlpha = opacity * color.opacity * 0.48;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(mx - 10, a.y);
    ctx.lineTo(mx + 10, b.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (reduced || (scene.mobile && index % 2)) return;
    const progress = (scene.time * link.speed + link.phase) % 1;
    const waypoints = [a, { x: mx - 10, y: a.y }, { x: mx + 10, y: b.y }, b];
    const lengths = waypoints
      .slice(1)
      .map((p, i) => Math.hypot(p.x - waypoints[i].x, p.y - waypoints[i].y));
    let travel = progress * lengths.reduce((sum, n) => sum + n, 0);
    let packet = b;
    for (let i = 0; i < lengths.length; i++) {
      if (travel <= lengths[i]) {
        const t = travel / Math.max(1, lengths[i]);
        packet = {
          x: waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * t,
          y: waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * t,
        };
        break;
      }
      travel -= lengths[i];
    }
    const rejected = index % 13 === 0 && progress > 0.82;
    ctx.globalAlpha = opacityAt(packet.x, packet.y) * (rejected ? 0.7 : 0.58);
    ctx.fillStyle = rejected ? color.threat : color.node;
    ctx.fillRect(packet.x - 1.7, packet.y - 1.7, 3.4, 3.4);
  });
  positions.forEach((p, i) => {
    const node = scene.points[i];
    ctx.globalAlpha =
      opacityAt(p.x, p.y) * color.opacity * (0.45 + node.depth * 0.5);
    ctx.strokeStyle = color.node;
    ctx.fillStyle = color.node;
    ctx.lineWidth = 0.9;
    if (node.kind === 0) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 7);
      ctx.lineTo(p.x + 6, p.y - 4);
      ctx.lineTo(p.x + 5, p.y + 3);
      ctx.lineTo(p.x, p.y + 7);
      ctx.lineTo(p.x - 5, p.y + 3);
      ctx.lineTo(p.x - 6, p.y - 4);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x - 2, p.y - 2);
      ctx.lineTo(p.x + 2, p.y);
      ctx.lineTo(p.x - 2, p.y + 2);
      ctx.stroke();
    } else if (node.kind < 3) {
      ctx.strokeRect(p.x - 3, p.y - 3, 6, 6);
      ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3 + node.depth, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  if (reduced) {
    ctx.globalAlpha = 1;
    return;
  }
  // Short-lived cursor traces and local links fade when the cursor leaves.
  const pointer = scene.pointer;
  if (!scene.mobile && pointer.strength > 0.01) {
    let connected = 0;
    for (const p of positions) {
      const distance = Math.hypot(p.x - pointer.x, p.y - pointer.y);
      if (distance > HERO_NETWORK.pointerRadius || connected >= 5) continue;
      connected++;
      ctx.globalAlpha =
        smooth(1 - distance / HERO_NETWORK.pointerRadius) *
        pointer.strength *
        0.35 *
        opacityAt(p.x, p.y);
      ctx.strokeStyle = color.pulse;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(pointer.x, pointer.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    scene.trails.forEach((trail) => {
      ctx.globalAlpha =
        Math.pow(1 - trail.age / HERO_NETWORK.trailLife, 2) *
        pointer.strength *
        0.2 *
        opacityAt(trail.x, trail.y);
      ctx.strokeStyle = color.pulse;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 2 + trail.age * 8, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  scene.pulses.forEach((pulse) => {
    const progress = pulse.age / HERO_NETWORK.pulseLife;
    const radius = pulseRadius(scene, pulse);
    const alpha =
      smooth(pulse.age / 0.07) * Math.pow(1 - progress, 1.7) * pulse.energy;
    ctx.strokeStyle = color.pulse;
    ctx.lineWidth = 1.25;
    // Samples let waves lose strength gradually as they meet the scene edges.
    for (let ring = 0; ring < (pulse.variant === 1 ? 2 : 1); ring++) {
      const r = radius * (ring ? 0.72 : 1);
      for (let segment = 0; segment < 48; segment++) {
        const angle = (segment / 48) * Math.PI * 2;
        const next = ((segment + 1) / 48) * Math.PI * 2;
        const x = pulse.x + Math.cos(angle) * r,
          y = pulse.y + Math.sin(angle) * r;
        ctx.globalAlpha = alpha * opacityAt(x, y) * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(pulse.x + Math.cos(next) * r, pulse.y + Math.sin(next) * r);
        ctx.stroke();
      }
    }
    for (let ray = 0; ray < (pulse.variant === 2 ? 8 : 4); ray++) {
      const angle =
        (ray * Math.PI) / (pulse.variant === 2 ? 4 : 2) + pulse.variant * 0.22;
      const x = pulse.x + Math.cos(angle) * radius * 0.85,
        y = pulse.y + Math.sin(angle) * radius * 0.85;
      ctx.globalAlpha = alpha * opacityAt(x, y) * 0.9;
      ctx.fillStyle = color.node;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  });
  ctx.globalAlpha = 1;
}

const protectedTarget = (target) =>
  Boolean(
    target?.closest?.(
      'a,button,input,select,textarea,summary,h1,h2,p,[contenteditable],[role="button"],.hero-assurances',
    ),
  );

export function mountHeroNetwork(canvas, host, env = window) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};
  const doc = host.ownerDocument;
  const motion = env.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches,
    inView = !env.IntersectionObserver,
    disposed = false;
  let scene = createNetwork(1, 1),
    quiet = null,
    theme = "dark",
    raf = null,
    previous = null,
    drawnAt = null,
    candidate = null;
  const record = (key, value) => {
    if (canvas.dataset[key] !== String(value))
      canvas.dataset[key] = String(value);
  };
  const draw = () => {
    if (disposed) return;
    drawNetwork(ctx, scene, theme, quiet, reduced);
    record("pulseCount", scene.pulses.length);
  };
  const canRun = () => !disposed && inView && !doc.hidden && !reduced;
  const frame = (timestamp) => {
    raf = null;
    if (!canRun()) return;
    const dt = previous === null ? 0 : (timestamp - previous) / 1000;
    previous = timestamp;
    advanceNetwork(scene, dt);
    const fps =
      scene.age - scene.lastInteraction < HERO_NETWORK.idleAfter
        ? HERO_NETWORK.activeFps
        : HERO_NETWORK.idleFps;
    if (drawnAt === null || timestamp - drawnAt >= 1000 / fps - 1) {
      draw();
      drawnAt = timestamp;
    }
    raf = env.requestAnimationFrame(frame);
  };
  const sync = () => {
    if (disposed) return;
    if (raf !== null) env.cancelAnimationFrame(raf);
    raf = null;
    previous = null;
    drawnAt = null;
    record("sceneState", reduced ? "reduced" : canRun() ? "running" : "paused");
    if (reduced) draw();
    else if (canRun()) raf = env.requestAnimationFrame(frame);
  };
  const resize = () => {
    if (disposed) return;
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, rect.width),
      height = Math.max(1, rect.height);
    // Retain phases when only DPR or the copy's geometry changes.
    if (scene.width !== width || scene.height !== height)
      scene = createNetwork(width, height);
    const resolution = canvasResolution(width, height, env.devicePixelRatio);
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    ctx.setTransform(resolution.scale, 0, 0, resolution.scale, 0, 0);
    const copy = host.querySelector(".hero-copy")?.getBoundingClientRect();
    quiet = copy
      ? {
          left: copy.left - rect.left - 16,
          top: copy.top - rect.top - 12,
          right: copy.right - rect.left + 16,
          bottom: copy.bottom - rect.top + 12,
        }
      : null;
    record("nodeCount", scene.points.length);
    draw();
    sync();
  };
  const coordinate = (event) => {
    const rect = host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const move = (event) => {
    // Reject a drag even if it returns to its starting point before release.
    if (candidate && candidate.id === event.pointerId) {
      const p = coordinate(event);
      if (
        Math.hypot(p.x - candidate.x, p.y - candidate.y) > HERO_NETWORK.tapSlop
      )
        candidate = null;
    }
    if (event.pointerType === "touch" || reduced || !inView || doc.hidden)
      return;
    const p = coordinate(event);
    movePointer(scene, p.x, p.y);
  };
  const leave = () => {
    scene.pointer.active = false;
    candidate = null;
  };
  const down = (event) => {
    candidate = null;
    if (
      reduced ||
      !inView ||
      doc.hidden ||
      event.isPrimary === false ||
      event.button !== 0 ||
      protectedTarget(event.target)
    )
      return;
    candidate = {
      ...coordinate(event),
      id: event.pointerId,
      time: env.performance.now(),
    };
  };
  const up = (event) => {
    const start = candidate;
    candidate = null;
    if (
      !start ||
      reduced ||
      !inView ||
      doc.hidden ||
      start.id !== event.pointerId ||
      protectedTarget(event.target) ||
      String(doc.getSelection?.() || "").trim()
    )
      return;
    const end = coordinate(event);
    if (
      Math.hypot(end.x - start.x, end.y - start.y) > HERO_NETWORK.tapSlop ||
      env.performance.now() - start.time > HERO_NETWORK.tapDuration
    )
      return;
    addPulse(scene, end.x, end.y);
    record("pulseCount", scene.pulses.length);
  };
  const visibility = () => {
    leave();
    sync();
  };
  const preference = () => {
    reduced = motion.matches;
    scene.pulses = [];
    scene.trails = [];
    scene.pointer.strength = 0;
    leave();
    draw();
    sync();
  };
  const updateTheme = () => {
    theme = doc.documentElement.dataset.theme === "light" ? "light" : "dark";
    draw();
  };
  const resizeObserver = new env.ResizeObserver(resize);
  const themeObserver = new env.MutationObserver(updateTheme);
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
    ["pointerleave", leave],
    ["pointerdown", down],
    ["pointerup", up],
    ["pointercancel", leave],
  ];
  events.forEach(([name, listener]) =>
    host.addEventListener(name, listener, { passive: true }),
  );
  doc.addEventListener("visibilitychange", visibility);
  env.addEventListener("resize", resize, { passive: true });
  motion.addEventListener("change", preference);
  resizeObserver.observe(host);
  const copyElement = host.querySelector(".hero-copy");
  if (copyElement) resizeObserver.observe(copyElement);
  themeObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  updateTheme();
  resize();
  intersection?.observe(host);
  return () => {
    disposed = true;
    if (raf !== null) env.cancelAnimationFrame(raf);
    events.forEach(([name, listener]) =>
      host.removeEventListener(name, listener),
    );
    doc.removeEventListener("visibilitychange", visibility);
    env.removeEventListener("resize", resize);
    motion.removeEventListener("change", preference);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    intersection?.disconnect();
    record("sceneState", "disposed");
  };
}
