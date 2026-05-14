"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { TabBar, Tab } from "@/components/TabBar";

const TrackerTab = lazy(() => import("@/components/TrackerTab").then(m => ({ default: m.TrackerTab })));
const SimpleTrackerTab = lazy(() => import("@/components/SimpleTrackerTab").then(m => ({ default: m.SimpleTrackerTab })));
const CalculatorTab = lazy(() => import("@/components/CalculatorTab").then(m => ({ default: m.CalculatorTab })));
const RecipesTab = lazy(() => import("@/components/RecipesTab").then(m => ({ default: m.RecipesTab })));

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
  const [activeTab, setActiveTab] = useState<Tab>("tracker");
  const [recipesListKey, setRecipesListKey] = useState(0);

  function handleTabChange(tab: Tab) {
    if (tab === "recipes" && activeTab === "recipes") {
      // Повторное нажатие — вернуть к списку
      setRecipesListKey(k => k + 1);
    }
    setActiveTab(tab);
  }
  const [trackerMode, setTrackerMode] = useTrackerMode();

  return (
    <>
      {/* Шапка */}
      <header className="text-center pt-6 pb-3">
        <h1 className="text-2xl font-extrabold text-brown-dark tracking-tight leading-none">
          Sourdough
        </h1>
        <p className="text-xs text-brown-light mt-0.5">трекер закваски</p>
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
        </Suspense>
      </main>

      {/* Навигация */}
      <TabBar active={activeTab} onChange={handleTabChange} />
    </>
  );
}
