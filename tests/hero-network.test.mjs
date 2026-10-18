import test from "node:test";
import assert from "node:assert/strict";
import {
  HERO_NETWORK,
  createNetwork,
  canvasResolution,
  movePointer,
  addPulse,
  advanceNetwork,
  mountHeroNetwork,
} from "../src/lib/hero-network.mjs";

test("request density and backing resolution stay bounded on mobile and 4K displays", () => {
  const mobile = createNetwork(375, 900),
    desktop = createNetwork(1920, 850),
    ultrawide = createNetwork(3840, 900);
  assert.ok(mobile.points.length <= HERO_NETWORK.mobileNodes);
  assert.ok(desktop.points.length > mobile.points.length);
  assert.ok(ultrawide.points.length <= HERO_NETWORK.maxNodes);
  assert.ok(ultrawide.points.some((point) => point.x > 3200));
  for (const [width, height, dpr] of [
    [375, 900, 3],
    [1920, 850, 2],
    [3840, 900, 3],
  ]) {
    const backing = canvasResolution(width, height, dpr);
    assert.ok(backing.scale <= HERO_NETWORK.maxDpr);
    assert.ok(backing.width * backing.height <= HERO_NETWORK.maxPixels);
  }
});

test("local pointer forces settle after leaving and do not drag distant nodes", () => {
  const scene = createNetwork(1920, 850);
  const near = scene.points[0],
    far = scene.points.at(-1);
  movePointer(scene, near.x - 30, near.y);
  for (let i = 0; i < 90; i++) advanceNetwork(scene, 1 / 60);
  assert.ok(near.ox > 1);
  assert.equal(far.ox, 0);
  assert.equal(far.oy, 0);
  scene.pointer.active = false;
  for (let i = 0; i < 240; i++) advanceNetwork(scene, 1 / 60);
  assert.ok(Math.abs(near.ox) < 0.01);
  assert.ok(scene.pointer.strength < 0.001);
  assert.equal(scene.trails.length, 0);
});

test("repeated scans and pointer trails remain capped, coalesce locally and expire", () => {
  const scene = createNetwork(1600, 800);
  addPulse(scene, 200, 200);
  addPulse(scene, 205, 205);
  assert.equal(scene.pulses.length, 1);
  assert.ok(scene.pulses[0].energy > 1);
  for (let i = 0; i < 500; i++) {
    addPulse(scene, 100 + ((i * 81) % 1400), 100 + ((i * 71) % 600));
    movePointer(scene, i * 30, 100);
  }
  assert.equal(scene.pulses.length, HERO_NETWORK.maxPulses);
  assert.equal(scene.trails.length, HERO_NETWORK.maxTrails);
  assert.equal(new Set(scene.pulses.map((pulse) => pulse.variant)).size, 3);
  for (let i = 0; i < 120; i++) advanceNetwork(scene, 1 / 60);
  assert.equal(scene.pulses.length, 0);
  assert.equal(scene.trails.length, 0);
});

test("ambient travel follows elapsed time across refresh rates and clamps stale frames", () => {
  const slow = createNetwork(1200, 700),
    fast = createNetwork(1200, 700);
  for (let i = 0; i < 60; i++) advanceNetwork(slow, 1 / 30);
  for (let i = 0; i < 240; i++) advanceNetwork(fast, 1 / 120);
  assert.ok(Math.abs(slow.time - fast.time) < 1e-10);
  const previous = slow.age;
  advanceNetwork(slow, 600);
  assert.ok(slow.age - previous <= 0.051);
});

class Events {
  listeners = new Map();
  addEventListener(name, listener) {
    const set = this.listeners.get(name) || new Set();
    set.add(listener);
    this.listeners.set(name, set);
  }
  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }
  emit(name, event = {}) {
    this.listeners.get(name)?.forEach((listener) => listener(event));
  }
  get count() {
    return Array.from(this.listeners.values()).reduce(
      (n, set) => n + set.size,
      0,
    );
  }
}

function browser(reduced = false) {
  let now = 0,
    draws = 0,
    id = 0,
    selection = "";
  const pending = new Map(),
    observers = [];
  const doc = Object.assign(new Events(), {
    hidden: false,
    documentElement: { dataset: { theme: "dark" } },
    getSelection: () => selection,
  });
  const host = Object.assign(new Events(), {
    ownerDocument: doc,
    getBoundingClientRect: () => ({
      left: 80,
      top: 100,
      right: 1280,
      bottom: 820,
      width: 1200,
      height: 720,
    }),
    querySelector: () => null,
  });
  const media = Object.assign(new Events(), { matches: reduced });
  const context = new Proxy(
    {},
    {
      get(target, key) {
        if (key in target) return target[key];
        return key === "clearRect"
          ? () => {
              draws++;
            }
          : () => {};
      },
    },
  );
  const canvas = { dataset: {}, getContext: () => context };
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  const env = Object.assign(new Events(), {
    devicePixelRatio: 3,
    performance: { now: () => now },
    matchMedia: () => media,
    requestAnimationFrame: (callback) => {
      pending.set(++id, callback);
      return id;
    },
    cancelAnimationFrame: (frame) => pending.delete(frame),
    ResizeObserver: class Resize extends Observer {},
    MutationObserver: class Mutation extends Observer {},
    IntersectionObserver: class Intersection extends Observer {},
  });
  const cleanup = mountHeroNetwork(canvas, host, env);
  const intersection = observers.find(
    (observer) => observer.constructor.name === "Intersection",
  );
  const blank = { closest: () => null };
  const control = { closest: () => ({}) };
  function pointer(name, x = 500, y = 400, target = blank, extra = {}) {
    host.emit(name, {
      clientX: x + 80,
      clientY: y + 100,
      target,
      pointerId: 1,
      isPrimary: true,
      pointerType: "mouse",
      button: 0,
      ...extra,
    });
  }
  return {
    canvas,
    env,
    host,
    doc,
    media,
    observers,
    pending,
    cleanup,
    control,
    visible(value) {
      intersection.callback([{ isIntersecting: value }]);
    },
    frame(milliseconds) {
      now = milliseconds;
      const callbacks = Array.from(pending.values());
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    },
    pointer,
    select(value) {
      selection = value;
    },
    get draws() {
      return draws;
    },
  };
}

test("visibility pauses RAF, resumes without consuming hidden time and cleans up completely", () => {
  const page = browser();
  assert.equal(page.canvas.dataset.sceneState, "paused");
  assert.equal(page.pending.size, 0);
  page.visible(true);
  page.frame(100);
  page.pointer("pointerdown");
  page.pointer("pointerup");
  assert.equal(page.canvas.dataset.pulseCount, "1");
  page.visible(false);
  const pausedDraws = page.draws;
  assert.equal(page.pending.size, 0);
  page.frame(50000);
  assert.equal(page.draws, pausedDraws);
  page.visible(true);
  page.frame(50001);
  assert.equal(
    page.canvas.dataset.pulseCount,
    "1",
    "first resumed frame must not age the pulse by 50 seconds",
  );
  page.doc.hidden = true;
  page.doc.emit("visibilitychange");
  assert.equal(page.pending.size, 0);
  page.doc.hidden = false;
  page.doc.emit("visibilitychange");
  assert.equal(page.pending.size, 1);
  page.cleanup();
  assert.equal(page.pending.size, 0);
  assert.equal(
    page.host.count + page.env.count + page.doc.count + page.media.count,
    0,
  );
  assert.ok(page.observers.every((observer) => observer.disconnected));
  page.visible(true);
  assert.equal(
    page.pending.size,
    0,
    "late observer callbacks cannot restart an unmounted scene",
  );
  assert.equal(page.canvas.dataset.sceneState, "disposed");
});

test("unavailable Canvas 2D leaves the static hero fallback usable", () => {
  const cleanup = mountHeroNetwork({ getContext: () => null }, null, {});
  assert.doesNotThrow(cleanup);
});

test("reduced motion renders a static field, rejects effects and responds to preference changes", () => {
  const page = browser(true);
  page.visible(true);
  assert.equal(page.canvas.dataset.sceneState, "reduced");
  assert.ok(page.draws > 0);
  assert.equal(page.pending.size, 0);
  page.pointer("pointerdown");
  page.pointer("pointerup");
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.media.matches = false;
  page.media.emit("change");
  assert.equal(page.pending.size, 1);
  page.pointer("pointerdown");
  page.pointer("pointerup");
  assert.equal(page.canvas.dataset.pulseCount, "1");
  page.media.matches = true;
  page.media.emit("change");
  assert.equal(page.pending.size, 0);
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.cleanup();
});

test("CTA use, selections and touch scrolling do not produce background scans; taps do", () => {
  const page = browser();
  page.visible(true);
  page.pointer("pointerdown", 500, 400, page.control);
  page.pointer("pointerup", 500, 400, page.control);
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.pointer("pointerdown");
  page.select("Your traffic.");
  page.pointer("pointerup");
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.select("");
  page.pointer("pointerdown", 500, 400, undefined, { pointerType: "touch" });
  page.pointer("pointerup", 500, 450, undefined, { pointerType: "touch" });
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.pointer("pointerdown", 500, 400, undefined, { pointerType: "touch" });
  page.pointer("pointermove", 500, 470, undefined, { pointerType: "touch" });
  page.pointer("pointerup", 500, 400, undefined, { pointerType: "touch" });
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.pointer("pointerdown", 500, 400, undefined, { pointerType: "touch" });
  page.pointer("pointerup", 502, 403, undefined, { pointerType: "touch" });
  assert.equal(page.canvas.dataset.pulseCount, "1");
  page.pointer("pointerdown", 800, 300);
  page.pointer("pointercancel");
  page.pointer("pointerup", 800, 300);
  assert.equal(page.canvas.dataset.pulseCount, "1");
  for (let i = 0; i < 130; i++) page.frame(i * 17);
  assert.equal(page.canvas.dataset.pulseCount, "0");
  page.cleanup();
});

test("theme changes redraw the field without restarting or duplicating the animation loop", () => {
  const page = browser();
  page.visible(true);
  page.frame(100);
  const observer = page.observers.find(
    (item) => item.constructor.name === "Mutation",
  );
  const previous = page.draws;
  page.doc.documentElement.dataset.theme = "light";
  observer.callback();
  assert.ok(page.draws > previous);
  assert.equal(page.pending.size, 1);
  page.cleanup();
});
