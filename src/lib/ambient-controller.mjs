import { mountAmbientSvg } from "./ambient-svg.mjs";

// Preference listeners stay lightweight; the entire renderer is disposed on Off.
export function mountAmbientController(svg, uid, env = window, interactionSvg) {
  let disposeScene = null;
  function sync() {
    const enabled =
      svg.ownerDocument.documentElement.dataset.animations === "on";
    if (enabled && !disposeScene) {
      disposeScene = mountAmbientSvg(svg, uid, env, interactionSvg, {
        respectReducedMotion: false,
      });
    } else if (!enabled && disposeScene) {
      disposeScene();
      disposeScene = null;
    }
    if (!enabled) {
      for (const root of [svg, interactionSvg]) {
        root.dataset.sceneState = "disabled";
        root.dataset.pulseCount = "0";
        root.dataset.trailCount = "0";
        root.dataset.liftCount = "0";
        root.dataset.activeCount = "0";
      }
    }
  }
  env.addEventListener("guardian-animations-change", sync);
  sync();
  return () => {
    env.removeEventListener("guardian-animations-change", sync);
    disposeScene?.();
    disposeScene = null;
  };
}
