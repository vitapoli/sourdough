"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

type LastEdited = "weight" | "hydration" | "flour" | "water";

export function CalculatorTab() {
  const t = useT();
  const [flour, setFlour] = useState("50");
  const [water, setWater] = useState("50");
  const [hydration, setHydration] = useState("100");
  const [weight, setWeight] = useState("100");
  const [lastEdited, setLastEdited] = useState<LastEdited>("weight");

  const [targetHydration, setTargetHydration] = useState("50");
  const [showStarterCalc, setShowStarterCalc] = useState(false);
  const [starterAmount, setStarterAmount] = useState("");
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

  // --- Режим "хочу получить N г закваски" ---
  // Сравниваем РЕАЛЬНУЮ текущую закваску (шаг 1) с целью (N г при нужной гидратации).
  const sAmount = parseFloat(starterAmount) || 0;
  const amountActive = showStarterCalc && sAmount > 0;

  const W1 = currentFlour + currentWater;          // текущий общий вес
  const f1frac = W1 > 0 ? currentFlour / W1 : 0;   // доля муки в текущей закваске
  const v1frac = W1 > 0 ? currentWater / W1 : 0;   // доля воды в текущей закваске

  const targetFlour = sAmount / (1 + targetH / 100); // мука в цели
  const targetWater = sAmount - targetFlour;         // вода в цели

  // Убрать можно только смесь (выбросить закваску целиком), долить — чистую муку/воду.
  // Выбрасываем столько, чтобы по обоим компонентам не осталось лишнего, остальное доливаем.
  const discardRaw = Math.max(
    0,
    f1frac > 0 ? (currentFlour - targetFlour) / f1frac : 0,
    v1frac > 0 ? (currentWater - targetWater) / v1frac : 0
  );
  const discard = Math.min(discardRaw, W1);
  const discardFlour = discard * f1frac;
  const discardWater = discard * v1frac;
  const addFlourAmt = Math.max(0, targetFlour - (currentFlour - discardFlour));
  const addWaterAmt = Math.max(0, targetWater - (currentWater - discardWater));
  const amountDone = discard < 0.5 && addFlourAmt < 0.5 && addWaterAmt < 0.5;

  const inputClass =
    "w-full px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-base font-bold text-brown-dark focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-20 gap-3 animate-fade-up">
      <h2 className="text-lg font-extrabold text-brown-dark">{t("calc.title")}</h2>

      <div className="w-full max-w-sm space-y-3">
        {/* Текущая закваска */}
        <div className="bg-card rounded-2xl p-3.5 card-shadow border border-warm-beige/60 space-y-2.5">
          <h3 className="font-extrabold text-sm text-brown-dark flex items-center gap-2">
            <span className="w-5.5 h-5.5 bg-terracotta text-white rounded-full flex items-center justify-center text-xs">
              1
            </span>
            {t("calc.current")}
          </h3>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-xs font-medium text-brown-light">{t("calc.flourG")}</label>
              <input
                type="number"
                min="0"
                value={flour}
                onChange={(e) => recalc("flour", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light">{t("calc.waterG")}</label>
              <input
                type="number"
                min="0"
                value={water}
                onChange={(e) => recalc("water", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light">{t("calc.weightG")}</label>
              <input
                type="number"
                min="0"
                value={weight}
                onChange={(e) => recalc("weight", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light">{t("calc.hydrPct")}</label>
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
            {t("calc.targetHydration")}
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

          {/* Раскрытие: количество закваски */}
          <button
            type="button"
            onClick={() => setShowStarterCalc(!showStarterCalc)}
            className="text-xs text-terracotta font-bold hover:underline flex items-center gap-1"
          >
            {showStarterCalc ? "−" : "+"} {t("calc.specifyAmount")}
          </button>

          {showStarterCalc && (
            <div className="animate-fade-up">
              <label className="text-xs font-medium text-brown-light">{t("calc.amountG")}</label>
              <input
                type="number"
                min="0"
                value={starterAmount}
                onChange={(e) => setStarterAmount(e.target.value)}
                placeholder={t("calc.eg100")}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Результат */}
        <div className="bg-gradient-to-br from-terracotta to-terracotta-light rounded-2xl p-4 card-shadow-lg text-white space-y-2.5">
          <div className="text-center">
            {currentFlour <= 0 || targetH <= 0 ? (
              <p className="text-base font-bold">{t("calc.enterData")}</p>
            ) : amountActive ? (
              amountDone ? (
                <p className="text-base font-bold">{t("calc.targetReached")}</p>
              ) : (
                <div className="space-y-1.5">
                  {discard >= 0.5 && (
                    <p className="text-base">
                      {t("calc.remove")} <span className="text-2xl font-extrabold">{Math.round(discard)}г</span> {t("calc.starterGen")}
                      <span className="block text-xs opacity-80">
                        ({Math.round(discardFlour)}г {t("calc.flour")} + {Math.round(discardWater)}г {t("calc.water")})
                      </span>
                    </p>
                  )}
                  {addFlourAmt >= 0.5 && (
                    <p className="text-base">
                      {t("calc.add")} <span className="text-xl font-extrabold">{Math.round(addFlourAmt)}г</span> {t("calc.flour")}
                    </p>
                  )}
                  {addWaterAmt >= 0.5 && (
                    <p className="text-base">
                      {t("calc.add")} <span className="text-xl font-extrabold">{Math.round(addWaterAmt)}г</span> {t("calc.water")}
                    </p>
                  )}
                </div>
              )
            ) : hydrationMatches ? (
              <p className="text-base font-bold">{t("calc.alreadyMatch")}</p>
            ) : needMoreWater ? (
              <p className="text-base">
                {t("calc.add")} <span className="text-2xl font-extrabold">{addWater.toFixed(1)}г</span> {t("calc.water")}
              </p>
            ) : (
              <p className="text-base">
                {t("calc.add")} <span className="text-2xl font-extrabold">{addFlour.toFixed(1)}г</span> {t("calc.flour")}
              </p>
            )}
          </div>
          <div className="bg-white/20 rounded-xl py-2 px-3 flex justify-around">
            <div className="text-center">
              <p className="text-xs opacity-70">{t("tracker.flour")}</p>
              <p className="text-base font-bold">{(amountActive ? targetFlour : resultFlour).toFixed(1)}г</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-70">{t("tracker.water")}</p>
              <p className="text-base font-bold">{(amountActive ? targetWater : resultWater).toFixed(1)}г</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-70">{t("calc.total")}</p>
              <p className="text-base font-bold">{(amountActive ? sAmount : resultTotal).toFixed(1)}г</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
