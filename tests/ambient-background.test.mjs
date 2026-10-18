import test from "node:test";
import assert from "node:assert/strict";
import {
  AMBIENT,
  createField,
  fieldPosition,
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
    this.children.push(node);
  }
  replaceChildren(...nodes) {
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
  const cleanup = mountAmbientSvg(svg, "test", env);
  const intersection = observers.find(
    (observer) => observer.constructor.name === "Intersection",
  );
  const blank = { closest: () => null },
    control = { closest: () => ({}) };
  return {
    svg,
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
  const count = nodes(page.svg).length;
  for (let i = 0; i < 500; i++) {
    const x = 100 + ((i * 81) % 1200);
    page.pointer("pointerdown", x);
    page.pointer("pointerup", x);
  }
  assert.equal(page.svg.dataset.pulseCount, String(AMBIENT.maxPulses));
  assert.equal(nodes(page.svg).length, count);
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
  page.visible(true);
  assert.equal(page.pending.size, 0);
  assert.equal(page.svg.dataset.sceneState, "disposed");
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
