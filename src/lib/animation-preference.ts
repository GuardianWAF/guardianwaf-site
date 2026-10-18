// The legacy storage key now controls mouse effects only; ambient motion is separate.
export const animationScript = `(function(){
var root=document.documentElement;
var media=window.matchMedia('(prefers-reduced-motion: reduce)');
function apply(value){
var preference=value==='on'||value==='off'?value:'system';
root.dataset.animationPreference=preference;
root.dataset.animations=preference==='system'?(media.matches?'off':'on'):preference;
window.dispatchEvent(new Event('guardian-animations-change'));
}
var saved;try{saved=localStorage.getItem('guardian-animations')}catch(e){}
apply(saved);
media.addEventListener('change',function(){if(root.dataset.animationPreference==='system')apply('system')});
window.addEventListener('storage',function(event){if(event.key==='guardian-animations'||event.key===null)apply(event.newValue)});
})()`;

export function animationsEnabled() {
  return document.documentElement.dataset.animations === "on";
}

export function subscribeAnimations(listener: () => void) {
  window.addEventListener("guardian-animations-change", listener);
  return () =>
    window.removeEventListener("guardian-animations-change", listener);
}

export function setAnimationsEnabled(enabled: boolean) {
  const value = enabled ? "on" : "off";
  const root = document.documentElement;
  root.dataset.animationPreference = value;
  root.dataset.animations = value;
  try {
    localStorage.setItem("guardian-animations", value);
  } catch {
    // Keep the current tab usable when persistence is unavailable.
  }
  window.dispatchEvent(new Event("guardian-animations-change"));
}
