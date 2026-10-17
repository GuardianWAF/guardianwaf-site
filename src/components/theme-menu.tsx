"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { setThemePreference, type ThemePreference } from "@/lib/theme";

const choices = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeMenu() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = choices.find((choice) => choice.value === preference)!;
  const Icon = selected.icon;

  useEffect(() => {
    const sync = () => {
      const value = document.documentElement.dataset.themePreference;
      setPreference(value === "light" || value === "dark" ? value : "system");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme-preference"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    radios.current
      .find((radio) => radio?.getAttribute("aria-checked") === "true")
      ?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function select(value: ThemePreference) {
    setThemePreference(value);
    setPreference(value);
  }

  return (
    <div
      className="theme-control"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        className="theme-trigger"
        ref={trigger}
        aria-label={`Color theme: ${selected.label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="appearance-panel"
        onClick={() => setOpen(!open)}
      >
        <Icon size={16} aria-hidden="true" />
        <span>{selected.label}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="theme-panel"
          id="appearance-panel"
          role="dialog"
          aria-labelledby="appearance-title"
          aria-describedby="appearance-description"
        >
          <h2 id="appearance-title">Appearance</h2>
          <p id="appearance-description">Your space, your style.</p>
          <div
            className="theme-options"
            role="radiogroup"
            aria-label="Color theme"
          >
            {choices.map(({ value, label, icon: OptionIcon }, index) => (
              <button
                key={value}
                role="radio"
                aria-checked={preference === value}
                tabIndex={preference === value ? 0 : -1}
                className="theme-option"
                ref={(node) => {
                  radios.current[index] = node;
                }}
                onClick={() => select(value)}
                onKeyDown={(event) => {
                  let next: number;
                  if (event.key === "ArrowRight" || event.key === "ArrowDown")
                    next = (index + 1) % choices.length;
                  else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
                    next = (index + choices.length - 1) % choices.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = choices.length - 1;
                  else return;
                  event.preventDefault();
                  select(choices[next].value);
                  radios.current[next]?.focus();
                }}
              >
                <span
                  className={`theme-preview theme-preview-${value}`}
                  aria-hidden="true"
                >
                  <span className="theme-preview-window">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="theme-preview-icon">
                    <OptionIcon size={13} />
                  </span>
                  {preference === value && (
                    <span className="theme-selected">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="theme-hint" aria-live="polite">
            <Icon size={14} aria-hidden="true" />
            <span>
              {preference === "system"
                ? "Matches your device’s appearance."
                : `${selected.label} appearance, just for you.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
