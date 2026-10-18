import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {
  animationScript,
  setAnimationsEnabled,
} from "../src/lib/animation-preference.ts";

function browser({ saved, reduced = false, blocked = false } = {}) {
  const data = new Map(
    saved === undefined ? [] : [["guardian-animations", saved]],
  );
  const listeners = {};
  let notifications = 0;
  const media = {
    matches: reduced,
    addEventListener: (name, fn) => {
      listeners[name] = fn;
    },
  };
  const context = vm.createContext({
    Event: class Event {
      constructor(type) {
        this.type = type;
      }
    },
    document: { documentElement: { dataset: {} } },
    window: {
      matchMedia: () => media,
      addEventListener: (name, fn) => {
        listeners[name] = fn;
      },
      dispatchEvent: (event) => {
        assert.equal(event.type, "guardian-animations-change");
        notifications++;
      },
    },
    localStorage: {
      getItem(key) {
        if (blocked) throw Error("Storage disabled");
        return data.get(key) ?? null;
      },
      setItem(key, value) {
        if (blocked) throw Error("Storage disabled");
        data.set(key, value);
      },
    },
  });
  vm.runInContext(animationScript, context);
  return {
    state: context.document.documentElement.dataset,
    data,
    get notifications() {
      return notifications;
    },
    select: (enabled) =>
      vm.runInContext(
        `(${setAnimationsEnabled.toString()})(${enabled})`,
        context,
      ),
    device(value) {
      media.matches = value;
      listeners.change();
    },
    storage(value, key = "guardian-animations") {
      listeners.storage({ key, newValue: value });
    },
  };
}

test("first visit follows reduced motion before paint, including live device changes", () => {
  const page = browser({ reduced: true });
  assert.equal(page.state.animations, "off");
  assert.equal(page.state.animationPreference, "system");
  page.device(false);
  assert.equal(page.state.animations, "on");
  page.device(true);
  assert.equal(page.state.animations, "off");
  assert.equal(page.data.size, 0);
  assert.equal(browser({ saved: "invalid" }).state.animations, "on");
});

test("explicit On/Off survives reload and takes priority over device preference", () => {
  const page = browser({ reduced: true });
  page.select(true);
  assert.equal(page.state.animations, "on");
  assert.equal(page.data.get("guardian-animations"), "on");
  page.device(true);
  assert.equal(page.state.animations, "on");
  assert.equal(
    browser({ saved: page.data.get("guardian-animations"), reduced: true })
      .state.animations,
    "on",
  );
  page.select(false);
  page.device(false);
  assert.equal(page.state.animations, "off");
  assert.equal(
    browser({ saved: page.data.get("guardian-animations") }).state.animations,
    "off",
  );
  assert.equal(page.notifications, 3);
});

test("blocked storage still supports toggling and does not change theme", () => {
  const page = browser({ reduced: true, blocked: true });
  page.state.theme = "light";
  page.select(true);
  page.device(true);
  assert.equal(page.state.animations, "on");
  page.select(false);
  assert.equal(page.state.animations, "off");
  assert.equal(page.state.theme, "light");
});

test("other tabs synchronize while unrelated keys are ignored and clearing restores System", () => {
  const page = browser();
  page.storage("off");
  assert.equal(page.state.animations, "off");
  page.storage("on", "guardian-theme");
  assert.equal(page.state.animations, "off");
  page.device(true);
  page.storage(null, null);
  assert.equal(page.state.animationPreference, "system");
  assert.equal(page.state.animations, "off");
  page.device(false);
  assert.equal(page.state.animations, "on");
});
