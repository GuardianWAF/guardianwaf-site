// CSS pixels / seconds. The SVG renderer only updates visible, pooled objects.
export const AMBIENT = Object.freeze({
  maxObjects: 72,
  mobileObjects: 12,
  spacingX: 240,
  spacingY: 220,
  overscan: 180,
  motionSpeed: 0.18,
  drift: 12,
  scrollDepth: 0.18,
  pointerRadius: 270,
  pointerForce: 64,
  orbitSpeed: 1.1,
  maxOffset: 112,
  spring: 8,
  maxLifted: 10,
  maxTrails: 18,
  trailLife: 0.72,
  maxPulses: 4,
  pulseRadius: 300,
  pulseLife: 1.65,
  pulseForce: 38,
  relayCount: 5,
  relayReach: 240,
  relayLife: 0.55,
  particles: 8,
  idleAfter: 3,
  idleFps: 24,
  activeFps: 60,
  tapSlop: 9,
  tapDuration: 650,
});

const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const smooth = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const seed = (i) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const wrap = (n, length) => ((n % length) + length) % length;

export function createField(width, height) {
  const mobile = width < 700;
  const columns = Math.max(
    2,
    Math.min(12, Math.round(width / AMBIENT.spacingX)),
  );
  const rows = Math.max(
    4,
    Math.min(6, Math.ceil(height / AMBIENT.spacingY) + 1),
  );
  const period = height + AMBIENT.overscan * 2;
  const count = Math.min(
    columns * rows,
    mobile ? AMBIENT.mobileObjects : AMBIENT.maxObjects,
  );
  return {
    width,
    height,
    period,
    mobile,
    age: 0,
    time: 0,
    lastInteraction: -10,
    scroll: 0,
    pointer: { x: 0, y: 0, active: false, strength: 0 },
    pulses: [],
    trails: [],
    variant: 0,
    points: Array.from({ length: count }, (_, i) => ({
      x: (((i % columns) + 0.35 + seed(i + 4) * 0.3) / columns) * width,
      y: ((Math.floor(i / columns) + 0.2 + seed(i + 13) * 0.6) / rows) * period,
      depth: 0.35 + seed(i + 19) * 0.65,
      phase: seed(i + 5) * Math.PI * 2,
      speed: 0.65 + seed(i + 99) * 0.7,
      kind: i % 6,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      orbit: 0,
    })),
  };
}

export function fieldPosition(scene, point, reduced = false) {
  const time = reduced ? 0 : scene.time * point.speed * AMBIENT.motionSpeed;
  const scroll = reduced ? 0 : scene.scroll * AMBIENT.scrollDepth * point.depth;
  const x =
    point.x +
    point.ox +
    Math.sin(time + point.phase) * AMBIENT.drift * point.depth;
  const y =
    wrap(point.y - scroll, scene.period) -
    AMBIENT.overscan +
    point.oy +
    Math.cos(time * 0.8 + point.phase) * AMBIENT.drift * point.depth;
  return {
    x,
    y,
    angle: reduced ? 0 : Math.sin(time * 0.6 + point.phase) * 5 * point.depth,
    visible: y > -75 && y < scene.height + 75,
  };
}

export function moveFieldPointer(scene, x, y) {
  const previous = scene.pointer;
  if (previous.active && Math.hypot(previous.x - x, previous.y - y) > 3) {
    scene.trails.push({ x: previous.x, y: previous.y, toX: x, toY: y, age: 0 });
    if (scene.trails.length > AMBIENT.maxTrails) scene.trails.shift();
  }
  Object.assign(scene.pointer, { x, y, active: true });
  scene.lastInteraction = scene.age;
}

export function addFieldPulse(scene, x, y) {
  if (x < 0 || y < 0 || x > scene.width || y > scene.height) return;
  scene.lastInteraction = scene.age;
  const last = scene.pulses.at(-1);
  if (last && last.age < 0.18 && Math.hypot(last.x - x, last.y - y) < 45) {
    last.energy = Math.min(1.4, last.energy + 0.1);
    return;
  }
  // Plan once per click: a short nearest-neighbour path, never recursive spawns.
  const relays = [];
  const candidates = scene.points
    .map((point) => ({ point, ...fieldPosition(scene, point) }))
    .filter((p) => p.visible && Math.hypot(p.x - x, p.y - y) < 480);
  let from = { x, y },
    delay = 0;
  const limit = scene.mobile ? 3 : AMBIENT.relayCount;
  while (relays.length < limit) {
    let nearest = null,
      distance = Infinity;
    for (const p of candidates) {
      const d = Math.hypot(p.x - from.x, p.y - from.y);
      if (!relays.some((r) => r.point === p.point) && d < distance) {
        nearest = p;
        distance = d;
      }
    }
    if (!nearest || distance > AMBIENT.relayReach * (scene.mobile ? 0.8 : 1))
      break;
    delay += 0.09 + distance / 1400;
    if (delay + AMBIENT.relayLife > AMBIENT.pulseLife) break;
    relays.push({
      point: nearest.point,
      from: from.point || null,
      x: nearest.x,
      y: nearest.y,
      delay,
      energy: 0.75 * Math.pow(0.72, relays.length),
    });
    from = nearest;
  }
  scene.pulses.push({
    x,
    y,
    age: 0,
    energy: 1,
    relays,
    variant: scene.variant++ % 3,
  });
  if (scene.pulses.length > AMBIENT.maxPulses) scene.pulses.shift();
}

export function fieldPulseRadius(scene, pulse) {
  const maximum = AMBIENT.pulseRadius * (scene.mobile ? 0.6 : 1);
  return (
    6 +
    (maximum - 6) * (1 - Math.pow(1 - clamp(pulse.age / AMBIENT.pulseLife), 3))
  );
}

export function fieldRelayEnergy(pulse, relay) {
  const progress = (pulse.age - relay.delay) / AMBIENT.relayLife;
  if (progress <= 0 || progress >= 1) return 0;
  return Math.sin(progress * Math.PI) ** 2 * relay.energy * pulse.energy;
}

export function fieldResponse(scene, point, p = fieldPosition(scene, point)) {
  const radius = AMBIENT.pointerRadius * (scene.mobile ? 0.7 : 1);
  const pointer =
    smooth(
      1 - Math.hypot(p.x - scene.pointer.x, p.y - scene.pointer.y) / radius,
    ) * scene.pointer.strength;
  let wave = 0;
  for (const pulse of scene.pulses) {
    const distance = Math.hypot(p.x - pulse.x, p.y - pulse.y);
    wave +=
      Math.exp(-Math.pow((distance - fieldPulseRadius(scene, pulse)) / 58, 2)) *
      (1 - pulse.age / AMBIENT.pulseLife) *
      pulse.energy;
    for (const relay of pulse.relays) {
      const local = fieldRelayEnergy(pulse, relay);
      wave +=
        local * smooth(1 - Math.hypot(p.x - relay.x, p.y - relay.y) / 125);
    }
  }
  return { pointer, energy: Math.min(1, pointer + wave) };
}

export function advanceField(scene, seconds) {
  const dt = Math.max(0, seconds);
  scene.age += dt;
  scene.time +=
    dt * (scene.age - scene.lastInteraction < AMBIENT.idleAfter ? 1 : 0.55);
  const pointer = scene.pointer;
  pointer.strength +=
    ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-dt * 6));
  scene.pulses = scene.pulses.filter(
    (pulse) => (pulse.age += dt) < AMBIENT.pulseLife,
  );
  scene.trails = scene.trails.filter(
    (trail) => (trail.age += dt) < AMBIENT.trailLife,
  );
  for (const pulse of scene.pulses) {
    for (const relay of pulse.relays) {
      const p = fieldPosition(scene, relay.point);
      relay.x = p.x;
      relay.y = p.y;
    }
  }
  for (const point of scene.points) {
    const p = fieldPosition(scene, point);
    if (!p.visible) {
      point.ox = 0;
      point.oy = 0;
      point.vx = 0;
      point.vy = 0;
      point.orbit = 0;
      continue;
    }
    const dx = p.x - pointer.x,
      dy = p.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const response = fieldResponse(scene, point, p);
    const force = response.pointer * AMBIENT.pointerForce * point.depth;
    const radius = AMBIENT.pointerRadius * (scene.mobile ? 0.7 : 1);
    const radial =
      force * (1 - 1.55 * smooth((distance / radius - 0.25) / 0.5));
    const nx = dx / Math.max(1, distance),
      ny = dy / Math.max(1, distance);
    // Rotate the resting vector, rather than repeatedly flipping a sideways force.
    // A damped spring carries velocity through changing targets and pointer moves.
    point.orbit = wrap(
      point.orbit + dt * response.pointer * AMBIENT.orbitSpeed * point.speed,
      Math.PI * 2,
    );
    if (response.pointer < 0.01) point.orbit *= Math.exp(-dt * 4);
    const bx = dx - point.ox,
      by = dy - point.oy;
    const angle = point.orbit + Math.sin(scene.time * 0.6 + point.phase) * 0.18;
    let rx = bx * (Math.cos(angle) - 1) - by * Math.sin(angle);
    let ry = bx * Math.sin(angle) + by * (Math.cos(angle) - 1);
    const orbitScale =
      Math.min(1, 92 / Math.max(1, Math.hypot(rx, ry))) * response.pointer;
    let tx = nx * radial + rx * orbitScale;
    let ty = ny * radial + ry * orbitScale;
    for (const pulse of scene.pulses) {
      const px = p.x - pulse.x,
        py = p.y - pulse.y,
        pd = Math.hypot(px, py);
      const energy =
        Math.exp(-Math.pow((pd - fieldPulseRadius(scene, pulse)) / 58, 2)) *
        (1 - pulse.age / AMBIENT.pulseLife) *
        pulse.energy *
        AMBIENT.pulseForce *
        point.depth;
      tx += (px / Math.max(1, pd)) * energy;
      ty += (py / Math.max(1, pd)) * energy;
      for (const relay of pulse.relays) {
        const local = fieldRelayEnergy(pulse, relay);
        const falloff = smooth(
          1 - Math.hypot(p.x - relay.x, p.y - relay.y) / 125,
        );
        tx += (-ny * 28 + nx * 20) * local * falloff * point.depth;
        ty += (nx * 28 + ny * 20) * local * falloff * point.depth;
      }
    }
    const bound = AMBIENT.maxOffset * (scene.mobile ? 0.65 : 1);
    const scale = Math.min(1, bound / Math.max(1, Math.hypot(tx, ty)));
    tx *= scale;
    ty *= scale;
    const decay = Math.exp(-AMBIENT.spring * dt);
    for (const [offset, velocity, target] of [
      ["ox", "vx", tx],
      ["oy", "vy", ty],
    ]) {
      const delta = point[offset] - target;
      const impulse = (point[velocity] + AMBIENT.spring * delta) * dt;
      point[offset] = target + (delta + impulse) * decay;
      point[velocity] = (point[velocity] - AMBIENT.spring * impulse) * decay;
    }
  }
}
