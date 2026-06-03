"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { TabBar, Tab } from "@/components/TabBar";

const TrackerTab = lazy(() => import("@/components/TrackerTab").then(m => ({ default: m.TrackerTab })));
const SimpleTrackerTab = lazy(() => import("@/components/SimpleTrackerTab").then(m => ({ default: m.SimpleTrackerTab })));
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
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("activeTab") as Tab | null;
      if (saved === "tracker" || saved === "calculator" || saved === "recipes" || saved === "community") return saved;
    }
    return "tracker";
  });
  const [recipesListKey, setRecipesListKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) window.location.href = "/login";
      else setAuthChecked(true);
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-brown-light">Загрузка...</p>
      </div>
    );
  }

  return (
    <>
      {/* Шапка */}
      <header className="flex items-center justify-between px-4 pt-6 pb-3">
        <div className="w-8" />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-brown-dark tracking-tight leading-none">
            Sourdough
          </h1>
          <p className="text-xs text-brown-light mt-0.5">трекер закваски</p>
        </div>
        <a href="/profile" className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-beige/50 text-brown-light hover:text-terracotta hover:bg-terracotta/10 transition-all">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="6" r="3.5" />
            <path d="M2.5 16.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
          </svg>
        </a>
      </header>

      {/* Переключатель режима трекера */}
      {activeTab === "tracker" && (
        <div className="flex justify-center gap-1 px-4 pb-2">
          <button
            onClick={() => setTrackerMode("simple")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              trackerMode === "simple"
                ? "bg-terracotta text-white"
                : "bg-warm-beige/50 text-brown-light hover:text-brown"
            }`}
          >
            Простой
          </button>
          <button
            onClick={() => setTrackerMode("detailed")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              trackerMode === "detailed"
                ? "bg-terracotta text-white"
                : "bg-warm-beige/50 text-brown-light hover:text-brown"
            }`}
          >
            Подробный
          </button>
        </div>
      )}

      {/* Контент вкладки */}
      <main className="flex-1 pb-20 animate-fade-up">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><p className="text-brown-light">Загрузка...</p></div>}>
          {activeTab === "tracker" && trackerMode === "simple" && <SimpleTrackerTab />}
          {activeTab === "tracker" && trackerMode === "detailed" && <TrackerTab />}
          {activeTab === "calculator" && <CalculatorTab />}
          {activeTab === "recipes" && <RecipesTab goToListSignal={recipesListKey} />}
          {activeTab === "community" && <CommunityTab />}
        </Suspense>
      </main>

      {/* Навигация */}
      <TabBar active={activeTab} onChange={handleTabChange} />
    </>
  );
}
