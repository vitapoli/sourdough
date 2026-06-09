"use client";

import { useState, useRef, useEffect } from "react";
import { useT } from "@/lib/i18n";

interface DropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

export function Dropdown({ value, options, onChange, placeholder, allowCustom, className = "" }: DropdownProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const isCustomValue = allowCustom && value !== "" && !options.includes(value);
  const [custom, setCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (custom) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("dropdown.flourType")}
          autoFocus
          className="flex-1 px-3 py-2 border-2 border-warm-beige rounded-2xl bg-cream text-sm font-bold text-brown-dark focus:outline-none focus:border-terracotta transition-colors"
        />
        <button
          type="button"
          onClick={() => { setCustom(false); onChange(options[0]); }}
          className="p-1.5 text-brown-light hover:text-terracotta transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2 border-2 border-warm-beige rounded-2xl bg-cream text-sm font-bold text-brown-dark hover:border-terracotta/50 transition-colors cursor-pointer"
      >
        <span className={value ? "" : "text-brown-light"}>{value || placeholder || t("dropdown.select")}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          className={`text-terracotta shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-warm-beige rounded-2xl overflow-hidden card-shadow-lg z-30">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-sm font-bold transition-colors ${
                value === opt
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-brown-dark hover:bg-warm-beige/50"
              }`}
            >
              {opt}
            </button>
          ))}
          {allowCustom && (
            <button
              type="button"
              onClick={() => { onChange(""); setCustom(true); setOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm font-bold text-brown-light hover:bg-warm-beige/50 border-t border-warm-beige transition-colors"
            >
              {t("dropdown.other")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
