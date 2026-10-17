import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { themeScript, setThemePreference } from "../src/lib/theme.ts";

function browser({ saved, light = false, blocked = false } = {}) {
  const data = new Map(saved === undefined ? [] : [["guardian-theme", saved]]);
  const listeners = {};
  const media = {
    matches: light,
    addEventListener: (name, listener) => {
      listeners[name] = listener;
    },
  };
  const context = vm.createContext({
    document: { documentElement: { dataset: {} } },
    window: {
      matchMedia: () => media,
      addEventListener: (name, listener) => {
        listeners[name] = listener;
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
      removeItem(key) {
        if (blocked) throw Error("Storage disabled");
        data.delete(key);
      },
    },
  });
  vm.runInContext(themeScript, context);
  return {
    state: context.document.documentElement.dataset,
    data,
    select: (value) =>
      vm.runInContext(
        `(${setThemePreference.toString()})(${JSON.stringify(value)})`,
        context,
      ),
    device(light) {
      media.matches = light;
      listeners.change({ matches: light });
    },
    storage(value, key = "guardian-theme") {
      listeners.storage({ key, newValue: value });
    },
  };
}

test("System follows the device, explicit choices persist and ignore device changes", () => {
  const page = browser({ light: true });
  assert.equal(page.state.theme, "light");
  assert.equal(page.state.themePreference, "system");
  page.device(false);
  assert.equal(page.state.theme, "dark");
  page.select("light");
  page.device(false);
  assert.equal(page.state.theme, "light");
  assert.equal(page.data.get("guardian-theme"), "light");
  assert.equal(browser({ saved: "light" }).state.theme, "light");
  page.select("system");
  assert.equal(page.data.has("guardian-theme"), false);
  assert.equal(page.state.theme, "dark");
  page.device(true);
  assert.equal(page.state.theme, "light");
});

test("disabled storage still supports explicit choices and live System appearance", () => {
  const page = browser({ blocked: true, light: true });
  assert.equal(page.state.theme, "light");
  page.select("dark");
  page.device(true);
  assert.equal(page.state.theme, "dark");
  page.select("system");
  page.device(false);
  assert.equal(page.state.theme, "dark");
  page.device(true);
  assert.equal(page.state.theme, "light");
});

test("invalid saved choices fall back to System and other tabs synchronize preferences", () => {
  const page = browser({ saved: "invalid", light: true });
  assert.equal(page.state.themePreference, "system");
  assert.equal(page.state.theme, "light");
  page.storage("dark");
  assert.equal(page.state.theme, "dark");
  page.storage("light", "unrelated");
  assert.equal(page.state.theme, "dark");
  page.storage(null);
  assert.equal(page.state.themePreference, "system");
  assert.equal(page.state.theme, "light");
});
