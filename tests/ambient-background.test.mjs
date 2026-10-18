import test from "node:test";
import assert from "node:assert/strict";
import {
  AMBIENT,
  createField,
  fieldPosition,
  fieldResponse,
  fieldRelayEnergy,
  moveFieldPointer,
  addFieldPulse,
  advanceField,
} from "../src/lib/ambient-field.mjs";
import { mountAmbientSvg } from "../src/lib/ambient-svg.mjs";

test("mobile and 4K fields have bounded density, depth and edge-to-edge coverage", () => {
  const mobile = createField(375, 900),
    desktop = createField(1920, 1080),
    wide = createField(3840, 2160);
  assert.ok(mobile.points.length <= AMBIENT.mobileObjects);
  assert.ok(desktop.points.length > mobile.points.length);
  assert.ok(wide.points.length <= AMBIENT.maxObjects);
  assert.ok(wide.points.some((point) => point.x > 3500));
  assert.ok(new Set(wide.points.map((point) => point.kind)).size >= 5);
  assert.ok(wide.points.every((point) => point.depth > 0 && point.depth <= 1));
});

test("scroll parallax keeps objects bounded and static reduced motion ignores scroll", () => {
  const scene = createField(1440, 900);
  const initial = scene.points.map((point) =>
    fieldPosition(scene, point, true),
  );
  scene.scroll = 123456;
  assert.deepEqual(
    scene.points.map((point) => fieldPosition(scene, point, true)),
    initial,
  );
  for (const point of scene.points) {
    const p = fieldPosition(scene, point);
    assert.ok(p.y >= -AMBIENT.overscan - AMBIENT.drift);
    assert.ok(p.y <= scene.height + AMBIENT.overscan + AMBIENT.drift);
  }
  assert.ok(
    scene.points.some(
      (point, i) => fieldPosition(scene, point).y !== initial[i].y,
    ),
  );
});

test("pointer forces stay local and settle after the cursor exits", () => {
  const scene = createField(1920, 1080);
  const near = scene.points.find((point) => {
    const p = fieldPosition(scene, point);
    return p.visible && p.x > 300;
  });
  const p = fieldPosition(scene, near);
  const far = scene.points.find(
    (point) =>
      fieldPosition(scene, point).visible && Math.abs(point.x - near.x) > 600,
  );
  moveFieldPointer(scene, p.x - 30, p.y);
  for (let i = 0; i < 60; i++) advanceField(scene, 1 / 60);
  assert.ok(near.ox > 1);
  assert.equal(far.ox, 0);
  assert.equal(far.oy, 0);
  scene.pointer.active = false;
  for (let i = 0; i < 240; i++) advanceField(scene, 1 / 60);
  assert.ok(Math.abs(near.ox) < 0.01);
  assert.ok(scene.pointer.strength < 0.001);
});

test("rapid scans merge, use bounded variants and expire even on slow frames", () => {
  const scene = createField(1600, 900);
  addFieldPulse(scene, 300, 200);
  addFieldPulse(scene, 305, 205);
  assert.equal(scene.pulses.length, 1);
  assert.ok(scene.pulses[0].energy > 1);
  for (let i = 0; i < 500; i++)
    addFieldPulse(scene, 100 + ((i * 81) % 1400), 100 + ((i * 71) % 600));
  assert.equal(scene.pulses.length, AMBIENT.maxPulses);
  assert.equal(new Set(scene.pulses.map((pulse) => pulse.variant)).size, 3);
  for (let i = 0; i < 4; i++) advanceField(scene, 0.5);
  assert.equal(scene.pulses.length, 0);
});

test("ambient speed follows elapsed time across low and high refresh rates", () => {
  const slow = createField(1440, 900),
    fast = createField(1440, 900);
  for (let i = 0; i < 4; i++) advanceField(slow, 0.5);
  for (let i = 0; i < 240; i++) advanceField(fast, 1 / 120);
  assert.ok(Math.abs(slow.time - fast.time) < 1e-10);
});

class Events {
  listeners = new Map();
  captures = new Map();
  addEventListener(name, listener, options) {
    const set = this.listeners.get(name) || new Set();
    set.add(listener);
    this.listeners.set(name, set);
    const capture = this.captures.get(name) || new Map();
    capture.set(listener, options === true || options?.capture === true);
    this.captures.set(name, capture);
  }
  removeEventListener(name, listener, options) {
    const capture = options === true || options?.capture === true;
    if (this.captures.get(name)?.get(listener) === capture) {
      this.listeners.get(name)?.delete(listener);
      this.captures.get(name)?.delete(listener);
    }
  }
  emit(name, event = {}) {
    this.listeners.get(name)?.forEach((listener) => {
      if (event.propagationStopped && !this.captures.get(name)?.get(listener))
        return;
      listener(event);
    });
  }
  get count() {
    return Array.from(this.listeners.values()).reduce(
      (n, set) => n + set.size,
      0,
    );
  }
}
class SvgNode {
  constructor(name, doc) {
    this.name = name;
    this.ownerDocument = doc;
  }
  attributes = new Map();
  children = [];
  dataset = {};
  transformWrites = 0;
  setAttribute(key, value) {
    this.attributes.set(key, String(value));
    if (key === "transform") this.transformWrites++;
  }
  getAttribute(key) {
    return this.attributes.get(key);
  }
  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
  }
  replaceChildren(...nodes) {
    this.children.forEach((node) => {
      node.parentNode = null;
    });
    nodes.forEach((node) => {
      node.parentNode = this;
    });
    this.children = nodes;
  }
  getBoundingClientRect() {
    return { width: 1440, height: 900, left: 0, top: 0 };
  }
}
function nodes(root) {
  return [root, ...root.children.flatMap(nodes)];
}
function browser(reduced = false) {
  let now = 0,
    id = 0,
    selection = "";
  const pending = new Map(),
    observers = [];
  const doc = Object.assign(new Events(), {
    hidden: false,
    body: {},
    querySelector: () => ({}),
    querySelectorAll: () => [],
    createElementNS: (ns, name) => {
      assert.equal(ns, "http://www.w3.org/2000/svg");
      return new SvgNode(name, doc);
    },
    getSelection: () => selection,
  });
  const svg = new SvgNode("svg", doc);
  const overlay = new SvgNode("svg", doc);
  const media = Object.assign(new Events(), { matches: reduced });
  class Observer {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  const env = Object.assign(new Events(), {
    scrollY: 0,
    performance: { now: () => now },
    matchMedia: () => media,
    requestAnimationFrame: (callback) => {
      pending.set(++id, callback);
      return id;
    },
    cancelAnimationFrame: (key) => pending.delete(key),
    ResizeObserver: class Resize extends Observer {},
    MutationObserver: class Mutation extends Observer {},
    IntersectionObserver: class Intersection extends Observer {},
  });
  const cleanup = mountAmbientSvg(svg, "test", env, overlay);
  const intersection = observers.find(
    (observer) => observer.constructor.name === "Intersection",
  );
  const blank = { closest: () => null },
    control = { closest: () => ({}) };
  return {
    svg,
    overlay,
    doc,
    env,
    media,
    pending,
    observers,
    cleanup,
    control,
    visible(value) {
      intersection.callback([{ isIntersecting: value }]);
    },
    select(value) {
      selection = value;
    },
    frame(milliseconds) {
      now = milliseconds;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    },
    pointer(name, x = 500, y = 400, target = blank, extra = {}) {
      doc.emit(name, {
        clientX: x,
        clientY: y,
        target,
        pointerId: 1,
        isPrimary: true,
        pointerType: "mouse",
        button: 0,
        ...extra,
      });
    },
  };
}

test("hidden objects skip SVG updates and long-page scrolling reuses the same node pool", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  page.frame(100);
  const tree = nodes(page.svg),
    count = tree.length;
  const hidden = tree.filter(
    (node) =>
      node.getAttribute("class") === "ambient-object" &&
      node.getAttribute("display") === "none",
  );
  assert.ok(hidden.length > 0);
  const writes = hidden.map((node) => node.transformWrites);
  page.frame(200);
  assert.deepEqual(
    hidden.map((node) => node.transformWrites),
    writes,
  );
  page.env.scrollY = 15000;
  page.env.emit("scroll");
  page.frame(300);
  assert.equal(nodes(page.svg).length, count);
  assert.ok(
    Number(page.svg.dataset.activeCount) < Number(page.svg.dataset.objectCount),
  );
  page.cleanup();
});

test("the SVG effect pool never grows under repeated clicks and scans expire by visible time", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  const count = nodes(page.svg).length + nodes(page.overlay).length;
  for (let i = 0; i < 500; i++) {
    const x = 100 + ((i * 81) % 1200);
    page.pointer("pointerdown", x);
    page.pointer("pointerup", x);
  }
  assert.equal(page.svg.dataset.pulseCount, String(AMBIENT.maxPulses));
  assert.equal(nodes(page.svg).length + nodes(page.overlay).length, count);
  for (let i = 1; i <= 4; i++) page.frame(i * 500);
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.cleanup();
});

test("links, controls, selections, touch drags and scrolling never emit scans; taps do", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  page.pointer("pointerdown", 500, 400, page.control);
  page.pointer("pointerup", 500, 400, page.control);
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.pointer("pointerdown");
  page.select("Your traffic.");
  page.pointer("pointerup");
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.select("");
  page.pointer("pointerdown", 500, 400, undefined, { pointerType: "touch" });
  page.pointer("pointermove", 500, 470, undefined, { pointerType: "touch" });
  page.pointer("pointerup", 500, 400, undefined, { pointerType: "touch" });
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.pointer("pointerdown");
  page.env.emit("scroll");
  page.pointer("pointerup");
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.pointer("pointerdown", 500, 400, undefined, { pointerType: "touch" });
  page.pointer("pointerup", 502, 403, undefined, { pointerType: "touch" });
  assert.equal(page.svg.dataset.pulseCount, "1");
  page.pointer("pointerdown", 800);
  page.pointer("pointercancel");
  page.pointer("pointerup", 800);
  assert.equal(page.svg.dataset.pulseCount, "1");
  page.cleanup();
});

test("hidden/offscreen pause, resume without a time jump, and complete cleanup", () => {
  const page = browser();
  assert.equal(page.pending.size, 0);
  page.visible(true);
  page.frame(0);
  page.pointer("pointerdown");
  page.pointer("pointerup");
  page.visible(false);
  assert.equal(page.pending.size, 0);
  page.frame(50000);
  page.visible(true);
  page.frame(50001);
  assert.equal(page.svg.dataset.pulseCount, "1");
  page.doc.hidden = true;
  page.doc.emit("visibilitychange");
  assert.equal(page.pending.size, 0);
  page.doc.hidden = false;
  page.doc.emit("visibilitychange");
  assert.equal(page.pending.size, 1);
  page.cleanup();
  assert.equal(page.pending.size, 0);
  assert.equal(page.doc.count + page.env.count + page.media.count, 0);
  assert.ok(page.observers.every((observer) => observer.disconnected));
  assert.equal(page.svg.children.length, 0);
  assert.equal(page.overlay.children.length, 0);
  page.visible(true);
  assert.equal(page.pending.size, 0);
  assert.equal(page.svg.dataset.sceneState, "disposed");
  assert.equal(page.overlay.dataset.sceneState, "disposed");
});

test("reduced motion has no animation loop, no effects and no scroll parallax", () => {
  const page = browser(true);
  page.visible(true);
  assert.equal(page.svg.dataset.sceneState, "reduced");
  assert.equal(page.pending.size, 0);
  const transforms = () =>
    nodes(page.svg)
      .filter((node) => node.getAttribute("class") === "ambient-object")
      .map((node) => node.getAttribute("transform"));
  const initial = transforms();
  page.env.scrollY = 9000;
  page.env.emit("scroll");
  assert.deepEqual(transforms(), initial);
  page.pointer("pointerdown");
  page.pointer("pointerup");
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.media.matches = false;
  page.media.emit("change");
  assert.equal(page.pending.size, 1);
  page.pointer("pointerdown");
  page.pointer("pointerup");
  assert.equal(page.svg.dataset.pulseCount, "1");
  page.media.matches = true;
  page.media.emit("change");
  assert.equal(page.pending.size, 0);
  assert.equal(page.svg.dataset.pulseCount, "0");
  page.cleanup();
});

test("interaction waves use an independent viewport overlay above opaque content", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  const effects = nodes(page.overlay).find(
    (node) => node.getAttribute("class") === "ambient-effects",
  );
  assert.ok(
    effects,
    "waves must be drawn in the separate overlay, not behind cards",
  );
  page.pointer("pointerdown");
  page.pointer("pointerup");
  page.frame(100);
  assert.ok(
    nodes(effects).some(
      (node) =>
        node.getAttribute("class") === "ambient-pulse" &&
        node.getAttribute("display") === "inline",
    ),
  );
  page.cleanup();
  assert.equal(page.overlay.children.length, 0);
});

test("copy bounds cannot cut SVG geometry into rectangular fragments", () => {
  const page = browser();
  page.doc.querySelectorAll = () => [
    {
      getBoundingClientRect: () => ({
        left: 300,
        top: 200,
        bottom: 260,
        width: 200,
        height: 60,
      }),
    },
  ];
  page.visible(true);
  page.frame(0);
  const cutouts = [...nodes(page.svg), ...nodes(page.overlay)].filter(
    (node) => node.name === "rect" && node.getAttribute("opacity") === "0.88",
  );
  assert.equal(
    cutouts.length,
    0,
    "text rectangles must not punch hard-edged holes into the field or waves",
  );
  page.cleanup();
});

test("nearby objects have a clearly visible response while distant objects stay calm", () => {
  const scene = createField(1920, 1080);
  const point = scene.points.find(
    (point) => point.depth > 0.85 && fieldPosition(scene, point).visible,
  );
  const p = fieldPosition(scene, point);
  moveFieldPointer(scene, p.x - 35, p.y);
  for (let i = 0; i < 60; i++) advanceField(scene, 1 / 60);
  assert.ok(
    Math.hypot(point.ox, point.oy) > 22,
    "nearby displacement must be noticeable, exceeding 22 CSS pixels",
  );
});

test("capture tracks content hover and keeps viewport coordinates while scrolling", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  page.pointer("pointermove", 620, 350, page.control, {
    propagationStopped: true,
  });
  page.frame(100);
  const cursor = nodes(page.overlay).find(
    (node) => node.getAttribute("class") === "ambient-pointer",
  );
  assert.equal(cursor.getAttribute("transform"), "translate(620 350)");
  page.env.scrollY = 12000;
  page.env.emit("scroll");
  for (let i = 1; i <= 120; i++) page.frame(100 + i * 17);
  assert.equal(cursor.getAttribute("display"), "inline");
  assert.equal(cursor.getAttribute("transform"), "translate(620 350)");
  assert.ok(Number(cursor.getAttribute("opacity")) > 0.95);
  page.pointer("pointerdown", 620, 350);
  page.pointer("pointerup", 620, 350);
  page.frame(2200);
  const wave = nodes(page.overlay).find(
    (node) =>
      node.getAttribute("class") === "ambient-pulse" &&
      node.getAttribute("display") === "inline",
  );
  assert.equal(wave.getAttribute("transform"), "translate(620 350)");
  page.cleanup();
});

test("light trails are pooled, bounded and fade on pointer exit without blocking input", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  const count = nodes(page.svg).length + nodes(page.overlay).length;
  let blocked = 0;
  for (let i = 0; i < 500; i++) {
    page.pointer(
      "pointermove",
      100 + ((i * 47) % 1200),
      250 + ((i * 31) % 400),
      undefined,
      {
        preventDefault: () => {
          blocked++;
        },
      },
    );
  }
  page.frame(16);
  assert.equal(Number(page.overlay.dataset.trailCount), AMBIENT.maxTrails);
  assert.ok(Number(page.overlay.dataset.liftCount) <= AMBIENT.maxLifted);
  assert.equal(nodes(page.svg).length + nodes(page.overlay).length, count);
  assert.equal(blocked, 0);
  page.pointer("pointerout", 500, 400, undefined, { relatedTarget: null });
  for (let i = 1; i <= 150; i++) page.frame(16 + i * 17);
  assert.equal(page.overlay.dataset.trailCount, "0");
  assert.equal(
    nodes(page.overlay)
      .find((node) => node.getAttribute("class") === "ambient-pointer")
      .getAttribute("display"),
    "none",
  );
  page.cleanup();
});

test("stationary pointer produces continuous curved motion with bounded inertia", () => {
  const run = (fps) => {
    const scene = createField(1440, 900);
    const point = scene.points.find(
      (p) => p.depth > 0.85 && fieldPosition(scene, p).visible,
    );
    const start = fieldPosition(scene, point);
    moveFieldPointer(scene, start.x - 70, start.y);
    let travel = 0,
      previous = fieldPosition(scene, point);
    for (let i = 0; i < fps * 3; i++) {
      advanceField(scene, 1 / fps);
      const p = fieldPosition(scene, point);
      const step = Math.hypot(p.x - previous.x, p.y - previous.y);
      assert.ok(step < 10, "spring motion must not jump between frames");
      assert.ok(Math.hypot(point.ox, point.oy) < AMBIENT.maxOffset + 4);
      if (i > fps) travel += step;
      previous = p;
    }
    assert.ok(
      travel > 35,
      "objects should keep flowing around a stationary cursor",
    );
    assert.ok(
      Math.abs(point.oy) > 12,
      "motion must curve beyond radial repulsion",
    );
    return { scene, point };
  };
  const slow = run(30),
    fast = run(120);
  assert.ok(
    Math.hypot(slow.point.ox - fast.point.ox, slow.point.oy - fast.point.oy) <
      6,
  );
  slow.scene.pointer.active = false;
  for (let i = 0; i < 300; i++) advanceField(slow.scene, 1 / 60);
  assert.ok(Math.hypot(slow.point.ox, slow.point.oy) < 0.1);
});

test("click relays visit neighbours in order, attenuate and expire with their parent", () => {
  const scene = createField(1440, 900);
  scene.points = Array.from({ length: 7 }, (_, i) => ({
    ...scene.points[0],
    x: 200 + i * 130,
    y: 400 + AMBIENT.overscan - 12,
    phase: 0,
    depth: 1,
    speed: 0,
  }));
  addFieldPulse(scene, 100, 400);
  const pulse = scene.pulses[0];
  assert.ok(pulse.relays.length >= 3);
  assert.ok(pulse.relays.length <= AMBIENT.relayCount);
  assert.equal(
    new Set(pulse.relays.map((r) => r.point)).size,
    pulse.relays.length,
  );
  assert.equal(pulse.relays[0].point, scene.points[0]);
  for (let i = 1; i < pulse.relays.length; i++) {
    assert.ok(pulse.relays[i].delay > pulse.relays[i - 1].delay);
    assert.ok(pulse.relays[i].energy < pulse.relays[i - 1].energy);
    assert.equal(pulse.relays[i].from, pulse.relays[i - 1].point);
  }
  const last = pulse.relays.at(-1);
  assert.equal(fieldRelayEnergy(pulse, last), 0);
  pulse.age = last.delay + AMBIENT.relayLife / 2;
  assert.ok(fieldRelayEnergy(pulse, last) > 0.1);
  const before = fieldResponse(scene, last.point).energy;
  const plan = pulse.relays;
  pulse.relays = [];
  assert.ok(
    before - fieldResponse(scene, last.point).energy > 0.1,
    "a downstream shape must respond after the primary wave has passed",
  );
  pulse.relays = plan;
  advanceField(scene, 2);
  assert.equal(scene.pulses.length, 0);
  assert.equal(fieldResponse(scene, last.point).energy, 0);
  addFieldPulse(scene, 1400, 50);
  assert.equal(
    scene.pulses[0].relays.length,
    0,
    "empty areas must not create distant relays",
  );
});

test("relay rendering stays pooled, follows scroll and disappears in reduced motion", () => {
  const page = browser();
  page.visible(true);
  page.frame(0);
  const count = nodes(page.overlay).length;
  page.pointer("pointerdown", 500, 400);
  page.pointer("pointerup", 500, 400);
  let seen = false;
  for (let i = 1; i < 80; i++) {
    page.frame(i * 17);
    const visible = nodes(page.overlay).filter(
      (node) =>
        node.getAttribute("class") === "ambient-relay" &&
        node.getAttribute("display") === "inline",
    );
    if (visible.length) seen = true;
    assert.ok(visible.length <= AMBIENT.relayCount * AMBIENT.maxPulses);
    if (i === 20) {
      page.env.scrollY = 120;
      page.env.emit("scroll");
    }
  }
  assert.ok(seen, "a click should visibly relay between nearby shapes");
  assert.equal(nodes(page.overlay).length, count);
  page.media.matches = true;
  page.media.emit("change");
  assert.ok(
    nodes(page.overlay)
      .filter((n) => n.getAttribute("class") === "ambient-relay")
      .every((n) => n.getAttribute("display") === "none"),
  );
  assert.equal(page.pending.size, 0);
  page.cleanup();
});
