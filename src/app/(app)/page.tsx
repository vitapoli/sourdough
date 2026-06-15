"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { TabBar, Tab } from "@/components/TabBar";
import { LangSwitch } from "@/components/LangSwitch";
import { SimpleTrackerTab } from "@/components/SimpleTrackerTab";
import { GuestGate } from "@/components/GuestGate";
import { setGuestMode, migrateGuestData } from "@/lib/tracker";
import { useT } from "@/lib/i18n";

const TrackerTab = lazy(() => import("@/components/TrackerTab").then(m => ({ default: m.TrackerTab })));
const CalculatorTab = lazy(() => import("@/components/CalculatorTab").then(m => ({ default: m.CalculatorTab })));
const RecipesTab = lazy(() => import("@/components/RecipesTab").then(m => ({ default: m.RecipesTab })));
const CommunityTab = lazy(() => import("@/components/CommunityTab").then(m => ({ default: m.CommunityTab })));

type TrackerMode = "simple" | "detailed";

function useTrackerMode(): [TrackerMode, (m: TrackerMode) => void] {
  const [mode, setMode] = useState<TrackerMode>("simple");
  useEffect(() => {
    const saved = localStorage.getItem("trackerMode") as TrackerMode | null;
    if (saved === "simple" || saved === "detailed") setMode(saved);
  }, []);
  function set(m: TrackerMode) {
    setMode(m);
    localStorage.setItem("trackerMode", m);
  }
  return [mode, set];
}

export default function Home() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("activeTab") as Tab | null;
      if (saved === "tracker" || saved === "calculator" || saved === "recipes" || saved === "community") return saved;
    }
    return "tracker";
  });
  const [recipesListKey, setRecipesListKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (r.ok) {
        // Вошедший пользователь: переносим закваску, которую гость мог
        // натыкать в этом браузере до регистрации, и работаем с сервером.
        setGuestMode(false);
        await migrateGuestData();
      } else {
        // Гость: не выбрасываем на логин — даём попробовать приложение.
        setGuestMode(true);
        setIsGuest(true);
      }
      setAuthChecked(true);
    });
  }, []);

  function handleTabChange(tab: Tab) {
    if (tab === "recipes" && activeTab === "recipes") {
      // Повторное нажатие — вернуть к списку
      setRecipesListKey(k => k + 1);
    }
    setActiveTab(tab);
    sessionStorage.setItem("activeTab", tab);
  }
  const [trackerMode, setTrackerMode] = useTrackerMode();

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <h1 className="text-3xl font-extrabold text-brown-dark tracking-tight">Sourdough</h1>
        <div className="w-6 h-6 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Шапка */}
      <header className="flex items-center justify-between px-4 pt-6 pb-3">
        <div className="w-8" />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-brown-dark tracking-tight leading-none flex items-center justify-center gap-1.5">
            Sourdough <LangSwitch />
          </h1>
          <p className="text-xs text-brown-light mt-0.5">{t("app.subtitle")}</p>
        </div>
        <a href={isGuest ? "/login" : "/profile"} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-beige/50 text-brown-light hover:text-terracotta hover:bg-terracotta/10 transition-all">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="6" r="3.5" />
            <path d="M2.5 16.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
          </svg>
        </a>
      </header>

      {/* Плашка гостевого режима */}
      {isGuest && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-2xl bg-golden/10 border border-golden/30 px-3.5 py-2">
          <p className="text-xs text-brown-dark leading-tight">{t("guest.banner")}</p>
          <a
            href="/register"
            className="shrink-0 px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta-light active:scale-95 transition-all"
          >
            {t("guest.bannerCta")}
          </a>
        </div>
      )}

      {/* Подсказка про подробный режим (для гостя на вкладке трекера) */}
      {isGuest && activeTab === "tracker" && (
        <a
          href="/register"
          className="mx-4 mb-2 flex items-center gap-2 rounded-2xl bg-card border border-warm-beige/60 px-3.5 py-2 card-shadow hover:border-terracotta/40 transition-all"
        >
          <span className="shrink-0 text-terracotta">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="7" />
              <path d="M9 5v4l2.5 1.5" />
            </svg>
          </span>
          <span className="text-xs text-brown-dark leading-tight">{t("guest.detailedHint")}</span>
        </a>
      )}

      {/* Переключатель режима трекера (только для вошедших) */}
      {activeTab === "tracker" && !isGuest && (
        <div className="flex justify-center gap-1 px-4 pb-2">
          <button
            onClick={() => setTrackerMode("simple")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              trackerMode === "simple"
                ? "bg-terracotta text-white"
                : "bg-warm-beige/50 text-brown-light hover:text-brown"
            }`}
          >
            {t("mode.simple")}
          </button>
          <button
            onClick={() => setTrackerMode("detailed")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              trackerMode === "detailed"
                ? "bg-terracotta text-white"
                : "bg-warm-beige/50 text-brown-light hover:text-brown"
            }`}
          >
            {t("mode.detailed")}
          </button>
        </div>
      )}

      {/* Контент вкладки */}
      <main className="flex-1 pb-20 animate-fade-up">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><p className="text-brown-light">{t("loading")}</p></div>}>
          {activeTab === "tracker" && (isGuest || trackerMode === "simple") && <SimpleTrackerTab />}
          {activeTab === "tracker" && !isGuest && trackerMode === "detailed" && <TrackerTab />}
          {activeTab === "calculator" && <CalculatorTab />}
          {activeTab === "recipes" && (isGuest ? <GuestGate titleKey="guest.gate.recipesTitle" /> : <RecipesTab goToListSignal={recipesListKey} />)}
          {activeTab === "community" && (isGuest ? <GuestGate titleKey="guest.gate.communityTitle" /> : <CommunityTab />)}
        </Suspense>
      </main>

      {/* Навигация */}
      <TabBar active={activeTab} onChange={handleTabChange} />
    </>
  );
}
