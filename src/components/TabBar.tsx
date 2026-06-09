"use client";

import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

export type Tab = "tracker" | "calculator" | "recipes" | "community";

const tabDefs: { id: Tab; labelKey: string; icon: "jar" | "calculator-classic" | "recipe-page" | "community" }[] = [
  { id: "tracker", labelKey: "tab.tracker", icon: "jar" },
  { id: "calculator", labelKey: "tab.calculator", icon: "calculator-classic" },
  { id: "recipes", labelKey: "tab.recipes", icon: "recipe-page" },
  { id: "community", labelKey: "tab.community", icon: "community" },
];

export function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const t = useT();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-warm-beige/60 z-50 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabDefs.map((tab) => (
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
              className={`text-[10px] font-semibold ${
                active === tab.id ? "text-terracotta" : ""
              }`}
            >
              {t(tab.labelKey)}
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
