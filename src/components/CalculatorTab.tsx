"use client";

import { useState } from "react";
import { Icon } from "./Icon";

type LastEdited = "weight" | "hydration" | "flour" | "water";

export function CalculatorTab() {
  const [flour, setFlour] = useState("50");
  const [water, setWater] = useState("50");
  const [hydration, setHydration] = useState("100");
  const [weight, setWeight] = useState("100");
  const [lastEdited, setLastEdited] = useState<LastEdited>("weight");

  const [targetHydration, setTargetHydration] = useState("50");
  function recalc(field: LastEdited, value: string) {
    const raw = parseFloat(value) || 0;
    const v = Math.max(0, raw);

    switch (field) {
      case "flour": {
        setFlour(String(v));
        const w = Math.max(0, parseFloat(water) || 0);
        setWeight((v + w).toFixed(1));
        if (v > 0) setHydration(((w / v) * 100).toFixed(0));
        break;
      }
      case "water": {
        setWater(String(v));
        const f = Math.max(0, parseFloat(flour) || 0);
        setWeight((f + v).toFixed(1));
        if (f > 0) setHydration(((v / f) * 100).toFixed(0));
        break;
      }
      case "weight": {
        setWeight(String(v));
        const h = Math.max(0, parseFloat(hydration) || 0);
        const newFlour = v / (1 + h / 100);
        const newWater = v - newFlour;
        setFlour(newFlour.toFixed(1));
        setWater(newWater.toFixed(1));
        break;
      }
      case "hydration": {
        setHydration(String(v));
        const w = Math.max(0, parseFloat(water) || 0);
        // Вода фиксирована, пересчитываем муку и вес
        const newFlour = v > 0 ? (w / v) * 100 : 0;
        setFlour(newFlour.toFixed(1));
        setWeight((newFlour + w).toFixed(1));
        break;
      }
    }
    setLastEdited(field);
  }

  const currentFlour = parseFloat(flour) || 0;
  const currentWater = parseFloat(water) || 0;
  const currentH = parseFloat(hydration) || 0;
  const targetH = parseFloat(targetHydration) || 0;

  const hydrationMatches = Math.abs(currentH - targetH) < 0.5;

  // Если целевая гидратация выше текущей — добавляем воду, муку не трогаем
  // Если ниже — добавляем муку, воду не трогаем
  const needMoreWater = targetH > currentH;
  const targetWaterForCurrentFlour = currentFlour * (targetH / 100);
  const addWater = targetWaterForCurrentFlour - currentWater; // >0 значит доливаем воду
  const targetFlourForCurrentWater = targetH > 0 ? (currentWater / targetH) * 100 : 0;
  const addFlour = targetFlourForCurrentWater - currentFlour; // >0 значит досыпаем муку

  const resultFlour = needMoreWater ? currentFlour : currentFlour + Math.max(0, addFlour);
  const resultWater = needMoreWater ? currentWater + Math.max(0, addWater) : currentWater;
  const resultTotal = resultFlour + resultWater;

  const inputClass =
    "w-full px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-base font-bold text-brown-dark focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-20 gap-3 animate-fade-up">
      <div className="flex items-center gap-2">
        <Icon name="scales" size={28} className="text-terracotta" />
        <h2 className="text-lg font-extrabold text-brown-dark">Калькулятор закваски</h2>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Текущая закваска */}
        <div className="bg-card rounded-2xl p-3.5 card-shadow border border-warm-beige/60 space-y-2.5">
          <h3 className="font-extrabold text-sm text-brown-dark flex items-center gap-2">
            <span className="w-5.5 h-5.5 bg-terracotta text-white rounded-full flex items-center justify-center text-xs">
              1
            </span>
            Текущая закваска
          </h3>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-xs font-medium text-brown-light">Мука, г</label>
              <input
                type="number"
                min="0"
                value={flour}
                onChange={(e) => recalc("flour", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light">Вода, г</label>
              <input
                type="number"
                min="0"
                value={water}
                onChange={(e) => recalc("water", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light">Вес, г</label>
              <input
                type="number"
                min="0"
                value={weight}
                onChange={(e) => recalc("weight", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light">Гидр, %</label>
              <input
                type="number"
                min="0"
                value={hydration}
                onChange={(e) => recalc("hydration", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Целевая гидратация */}
        <div className="bg-card rounded-2xl p-3.5 card-shadow border border-warm-beige/60 space-y-2.5">
          <h3 className="font-extrabold text-sm text-brown-dark flex items-center gap-2">
            <span className="w-5.5 h-5.5 bg-terracotta text-white rounded-full flex items-center justify-center text-xs">
              2
            </span>
            Нужная гидратация
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={targetHydration}
                onChange={(e) => setTargetHydration(String(Math.max(0, parseFloat(e.target.value) || 0)))}
                className={inputClass}
              />
            </div>
            <div className="flex gap-1.5">
              {[50, 60, 75, 80, 100].map((h) => (
                <button
                  key={h}
                  onClick={() => setTargetHydration(String(h))}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    targetHydration === String(h)
                      ? "bg-terracotta text-white card-shadow"
                      : "bg-warm-beige text-brown hover:bg-terracotta-light hover:text-white"
                  }`}
                >
                  {h}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Результат */}
        <div className="bg-gradient-to-br from-terracotta to-terracotta-light rounded-2xl p-4 card-shadow-lg text-white space-y-2.5">
          <div className="text-center">
            {currentFlour <= 0 || targetH <= 0 ? (
              <p className="text-base font-bold">Введи данные закваски выше</p>
            ) : hydrationMatches ? (
              <p className="text-base font-bold">Гидратация уже совпадает!</p>
            ) : needMoreWater ? (
              <p className="text-base">
                Добавь <span className="text-2xl font-extrabold">{addWater.toFixed(1)}г</span> воды
              </p>
            ) : (
              <p className="text-base">
                Добавь <span className="text-2xl font-extrabold">{addFlour.toFixed(1)}г</span> муки
              </p>
            )}
          </div>
          <div className="bg-white/20 rounded-xl py-2 px-3 flex justify-around">
            <div className="text-center">
              <p className="text-xs opacity-70">Мука</p>
              <p className="text-base font-bold">{resultFlour.toFixed(1)}г</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-70">Вода</p>
              <p className="text-base font-bold">{resultWater.toFixed(1)}г</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-70">Итого</p>
              <p className="text-base font-bold">{resultTotal.toFixed(1)}г</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
