import { mountAmbientSvg } from "./ambient-svg.mjs";

// Keep ambient motion alive. Only mouse input/effects follow the header preference.
export function mountAmbientController(svg, uid, env = window, interactionSvg) {
  const enabled = () =>
    svg.ownerDocument.documentElement.dataset.animations === "on";
  const disposeScene = mountAmbientSvg(svg, uid, env, interactionSvg, {
    mouseEffects: enabled(),
    respectReducedMotion: !enabled(),
    followMousePreference: true,
  });
  function sync() {
    disposeScene.setMouseEffects(enabled());
  }
  env.addEventListener("guardian-animations-change", sync);
  sync();
  return () => {
    env.removeEventListener("guardian-animations-change", sync);
    disposeScene();
  };
}
