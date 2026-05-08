"use client";

import { Icon } from "./Icon";

export type Tab = "tracker" | "calculator" | "recipes";

const tabs: { id: Tab; label: string; icon: "jar" | "scales" | "bread" }[] = [
  { id: "tracker", label: "Трекер", icon: "jar" },
  { id: "calculator", label: "Калькулятор", icon: "scales" },
  { id: "recipes", label: "Рецепты", icon: "bread" },
];

export function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-warm-beige/60 z-50 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all duration-200 ${
              active === tab.id
                ? "text-terracotta"
                : "text-brown-light hover:text-brown"
            }`}
          >
            <Icon name={tab.icon} size={24} />
            <span
              className={`text-[11px] font-semibold ${
                active === tab.id ? "text-terracotta" : ""
              }`}
            >
              {tab.label}
            </span>
            {active === tab.id && (
              <div className="w-6 h-[3px] bg-terracotta rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
