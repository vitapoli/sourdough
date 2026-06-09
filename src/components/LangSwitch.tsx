"use client";

import { useLang } from "@/lib/i18n";

export function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className="text-xs font-bold text-terracotta border border-terracotta/40 bg-terracotta/10 hover:bg-terracotta/20 transition-all px-2 py-1 rounded-lg"
      title={lang === "ru" ? "Switch to English" : "Переключить на русский"}
    >
      {lang === "ru" ? "EN" : "RU"}
    </button>
  );
}
