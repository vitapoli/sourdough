"use client";

import { useState } from "react";
import { TabBar, Tab } from "@/components/TabBar";
import { TrackerTab } from "@/components/TrackerTab";
import { CalculatorTab } from "@/components/CalculatorTab";
import { RecipesTab } from "@/components/RecipesTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tracker");

  return (
    <>
      {/* Шапка */}
      <header className="text-center pt-6 pb-3">
        <h1 className="text-2xl font-extrabold text-brown-dark tracking-tight">
          Sourdough
        </h1>
        <p className="text-xs text-brown-light mt-0.5">трекер закваски</p>
        <a
          href="/fermentation.html"
          className="inline-block mt-2 text-xs text-terracotta hover:underline font-medium"
        >
          Как работает брожение? →
        </a>
      </header>

      {/* Контент вкладки */}
      <main className="flex-1 pb-20 animate-fade-up">
        {activeTab === "tracker" && <TrackerTab />}
        {activeTab === "calculator" && <CalculatorTab />}
        {activeTab === "recipes" && <RecipesTab />}
      </main>

      {/* Навигация */}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </>
  );
}
