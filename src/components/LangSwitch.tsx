"use client";

import { useLang } from "@/lib/i18n";

export function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className="text-xs font-bold text-brown-light hover:text-terracotta transition-colors px-1.5 py-0.5 rounded"
      title={lang === "ru" ? "Switch to English" : "Переключить на русский"}
    >
      {lang === "ru" ? "EN" : "RU"}
    </button>
  );
}
