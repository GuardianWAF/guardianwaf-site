export type ThemePreference = "light" | "dark" | "system";

// Runs before the first paint; the DOM also keeps System working without storage.
export const themeScript = `(function(){
var root=document.documentElement;
var media=window.matchMedia('(prefers-color-scheme: light)');
function apply(value){
var preference=value==='light'||value==='dark'?value:'system';
root.dataset.themePreference=preference;
root.dataset.theme=preference==='system'?(media.matches?'light':'dark'):preference;
}
var saved;try{saved=localStorage.getItem('guardian-theme')}catch(e){}
apply(saved);
media.addEventListener('change',function(){if(root.dataset.themePreference==='system')apply('system')});
window.addEventListener('storage',function(event){if(event.key==='guardian-theme'||event.key===null)apply(event.newValue)});
})()`;

export function setThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : preference;
  try {
    if (preference === "system") localStorage.removeItem("guardian-theme");
    else localStorage.setItem("guardian-theme", preference);
  } catch {
    // The current tab remains usable when browser storage is unavailable.
  }
}
