"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserObservation } from "@/lib/fermentation";

interface RiseSettingsProps {
  starterId: string;
  flourType: string;
  useCustom: boolean;
  onToggleCustom: (v: boolean) => void;
  onObservationsLoaded: (obs: UserObservation[]) => void;
}

interface FeedingWithObs {
  id: string;
  fedAt: string;
  starterAmount: number | null;
  flourAmount: number | null;
  waterAmount: number | null;
  flourType: string | null;
  temperature: number | null;
  peakTimeHours: number;
  readyTimeHours: number;
  peakMultiplier: number;
}

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}

function toUserObs(f: FeedingWithObs, defaultFlourType: string): UserObservation {
  const sa = f.starterAmount || 30;
  const fa = f.flourAmount || 50;
  return {
    ratio: fa / sa,
    temperature: f.temperature || 22,
    flourType: f.flourType || defaultFlourType,
    peakTimeHours: f.peakTimeHours,
    readyTimeHours: f.readyTimeHours,
    peakMultiplier: f.peakMultiplier,
  };
}

export function RiseSettings({
  starterId,
  flourType,
  useCustom,
  onToggleCustom,
  onObservationsLoaded,
}: RiseSettingsProps) {
  const [open, setOpen] = useState(false);
  const [feedingsWithObs, setFeedingsWithObs] = useState<FeedingWithObs[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);

  const onObservationsLoadedRef = useRef(onObservationsLoaded);
  onObservationsLoadedRef.current = onObservationsLoaded;

  const loadObservations = useCallback(async () => {
    const res = await fetch(`/api/starters/${starterId}`);
    const data = await res.json();
    const withObs: FeedingWithObs[] = (data.feedings || []).filter(
      (f: FeedingWithObs) => f.peakTimeHours != null
    );
    setFeedingsWithObs(withObs);
    setSelectedIds((prev) => {
      if (prev.size === 0) return new Set(withObs.map((o: FeedingWithObs) => o.id));
      const existing = new Set(withObs.map((o: FeedingWithObs) => o.id));
      const cleaned = new Set([...prev].filter((id) => existing.has(id)));
      return cleaned.size > 0 ? cleaned : new Set(withObs.map((o: FeedingWithObs) => o.id));
    });
    onObservationsLoadedRef.current(withObs.map((f: FeedingWithObs) => toUserObs(f, flourType)));
  }, [starterId, flourType]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  function updateSelection(newSelected: Set<string>) {
    setSelectedIds(newSelected);
    const selected = feedingsWithObs.filter((o) => newSelected.has(o.id));
    onObservationsLoadedRef.current(selected.map((f) => toUserObs(f, flourType)));
  }

  function toggleObservation(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    updateSelection(next);
  }

  function selectAll() {
    updateSelection(new Set(feedingsWithObs.map((o) => o.id)));
  }

  function selectNone() {
    updateSelection(new Set());
  }

  const selectedCount = feedingsWithObs.filter((o) => selectedIds.has(o.id)).length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-brown-light hover:text-terracotta underline transition-colors"
      >
        Настройки шкалы подъёма
        {useCustom && selectedCount > 0 && (
          <span className="ml-1 text-green-happy no-underline">
            (свои данные: {selectedCount})
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm bg-card rounded-2xl p-5 card-shadow-lg border border-warm-beige/60 space-y-4 animate-fade-up">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-brown-dark">Шкала подъёма</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-brown-light hover:text-brown text-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Переключатель режима */}
      <div className="bg-warm-beige/30 rounded-xl p-4 space-y-3">
        <p className="text-sm text-brown font-medium">Какие данные использовать?</p>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleCustom(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              !useCustom
                ? "bg-terracotta text-white card-shadow"
                : "bg-card text-brown border border-warm-beige"
            }`}
          >
            Общие
          </button>
          <button
            onClick={() => onToggleCustom(true)}
            disabled={selectedCount === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              useCustom
                ? "bg-terracotta text-white card-shadow"
                : "bg-card text-brown border border-warm-beige"
            } disabled:opacity-40`}
          >
            Мои данные {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
        <p className="text-xs text-brown-light">
          {useCustom
            ? selectedCount === 1
              ? "Расчёт по одному наблюдению"
              : `Расчёт усредняет ${selectedCount} выбранных наблюдений`
            : "Средние значения из пекарских источников"}
        </p>
      </div>

      {/* Расшифровка общих данных */}
      {!useCustom && (
        <details className="group">
          <summary className="text-xs text-terracotta hover:underline font-medium cursor-pointer list-none">
            На чём основан расчёт?
          </summary>
          <div className="bg-warm-beige/20 rounded-xl p-3.5 mt-2 space-y-3 text-sm text-brown animate-fade-up">

          <div>
            <p className="font-medium text-xs text-brown-dark mb-1">Время до пика при 22°C:</p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-xs">
              <span className="text-brown-light">Соотношение</span>
              <span className="font-bold text-brown-light">Пшеничная</span>
              <span className="font-bold text-brown-light">Ржаная</span>
              <span className="text-brown-light">1:1:1</span>
              <span className="font-bold">~5 ч</span>
              <span className="font-bold">~3.5 ч</span>
              <span className="text-brown-light">1:2:2</span>
              <span className="font-bold">~7 ч</span>
              <span className="font-bold">~5 ч</span>
              <span className="text-brown-light">1:3:3</span>
              <span className="font-bold">~9 ч</span>
              <span className="font-bold">~7 ч</span>
              <span className="text-brown-light">1:5:5</span>
              <span className="font-bold">~12 ч</span>
              <span className="font-bold">~9 ч</span>
              <span className="text-brown-light">1:10:10</span>
              <span className="font-bold">~17 ч</span>
              <span className="font-bold">~14 ч</span>
            </div>
            <p className="text-[10px] text-brown-light/70 mt-1">Ржаная на 20-25% быстрее за счёт большего содержания свободных сахаров и активных ферментов</p>
          </div>

          <div>
            <p className="font-medium text-xs text-brown-dark mb-1">Визуальный подъём:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <span className="text-brown-light">Пшеничная</span>
              <span className="font-bold">x2.8</span>
              <span className="text-brown-light">Ржаная</span>
              <span className="font-bold">x2.0</span>
            </div>
            <p className="text-[10px] text-brown-light/70 mt-1">Пшеничная поднимается выше за счёт глютеновой сетки. Ржаная ниже — газ удерживают пентозаны, а не глютен</p>
          </div>

          <div>
            <p className="font-medium text-xs text-brown-dark mb-1">Влияние температуры:</p>
            <p className="text-xs text-brown-light">
              Каждые +5.5°C время сокращается вдвое. При 28°C пшеничная 1:2:2 достигнет пика за ~3.5 ч, при 16°C — за ~14 ч.
            </p>
          </div>

          <div className="border-t border-warm-beige pt-2">
            <p className="font-medium text-xs text-brown-dark mb-1">Источники:</p>
            <ul className="text-[11px] text-brown-light space-y-1">
              <li>
                <span className="font-medium text-brown">The Sourdough Journey</span> — эксперимент с CO₂-датчиком, сравнение пшеничной и ржаной муки при 20°C
              </li>
              <li>
                <span className="font-medium text-brown">Hsu et al.</span> (2013) «Comparing fermentation gas production using the Risograph» — <span className="italic">Journal of Food Research</span>
              </li>
              <li>
                <span className="font-medium text-brown">Arora K. et al.</span> (2021) «Thirty years of knowledge on sourdough fermentation» — <span className="italic">Trends in Food Science & Technology</span>, 108, 71–83
              </li>
              <li>
                <span className="font-medium text-brown">De Vuyst L. et al.</span> (2023) «Sourdough production: fermentation strategies, microbial ecology» — <span className="italic">Critical Reviews in Food Science and Nutrition</span>, 63(15), 2447–2479
              </li>
              <li>
                <span className="font-medium text-brown">Gänzle M.G.</span> (2014) «Enzymatic and bacterial conversions during sourdough fermentation» — <span className="italic">Food Microbiology</span>, 37, 2–10
              </li>
            </ul>
            <p className="text-[10px] text-brown-light/70 mt-1.5">
              Эмпирические данные: King Arthur Baking (2025), Brod & Taylor, The Bread Code, Weekend Bakery, Catchymeals
            </p>
          </div>

          <div className="border-t border-warm-beige pt-2">
            <a href="/fermentation.html" target="_blank" className="text-xs text-terracotta hover:underline font-medium">
              Подробнее о процессе брожения →
            </a>
          </div>
        </div>
        </details>
      )}

      {/* Подсказка */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="text-xs text-terracotta hover:underline font-medium"
      >
        {showHelp ? "Скрыть подсказки" : "Что такое «готовность» и «пик»?"}
      </button>

      {showHelp && (
        <div className="bg-golden/10 rounded-xl p-4 space-y-3 text-sm text-brown animate-fade-up">
          <div>
            <p className="font-bold text-golden">Готовность к использованию</p>
            <p>
              Закваска достигла ~80% от максимального подъёма. Поверхность
              куполообразная, много пузырьков. Тест: ложка закваски плавает в воде.
              В этот момент в ней максимум силы для подъёма теста.
            </p>
          </div>
          <div>
            <p className="font-bold text-terracotta">Пик</p>
            <p>
              Максимальный объём. Поверхность начинает выравниваться или слегка
              проседать в центре. После пика закваска начинает опадать — дрожжи
              съели весь корм. Можно использовать, но сила подъёма уже чуть слабее.
            </p>
          </div>
          <div>
            <p className="font-bold text-orange-hungry">После пика</p>
            <p>
              Закваска опадает, появляется жидкость сверху (hooch). Кислотность
              растёт. Хлеб получится более кислый и хуже поднимется.
              Лучше покормить и подождать заново.
            </p>
          </div>
        </div>
      )}

      {/* Список кормлений-наблюдений */}
      {feedingsWithObs.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-brown">Мои наблюдения:</p>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[10px] text-terracotta hover:underline">Все</button>
              <button onClick={selectNone} className="text-[10px] text-brown-light hover:underline">Ни одного</button>
            </div>
          </div>

          {feedingsWithObs.map((f) => {
            const isSelected = selectedIds.has(f.id);
            const sa = f.starterAmount || 30;
            const fa = f.flourAmount || 50;
            const wa = f.waterAmount || 50;
            const ratio = `1:${(fa / sa).toFixed(1)}:${(wa / sa).toFixed(1)}`;
            const date = new Date(f.fedAt);
            const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

            return (
              <div
                key={f.id}
                className={`rounded-xl px-3 py-2.5 text-sm border transition-all ${
                  isSelected
                    ? "bg-green-happy/10 border-green-happy/40"
                    : "bg-warm-beige/20 border-warm-beige opacity-60"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleObservation(f.id)}
                    className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "bg-green-happy border-green-happy text-white"
                        : "border-brown-light/40"
                    }`}
                  >
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-brown">
                        {ratio} при {f.temperature || 22}°C
                      </span>
                      <span className="text-brown-light text-xs shrink-0 ml-1">{dateStr}</span>
                    </div>
                    <div className="flex gap-4 mt-0.5 text-xs text-brown-light">
                      <span>Пик: {formatHours(f.peakTimeHours)}</span>
                      <span>Готова: {formatHours(f.readyTimeHours)}</span>
                      <span>x{f.peakMultiplier}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {feedingsWithObs.length === 0 && useCustom && (
        <p className="text-xs text-brown-light text-center py-2">
          Пока нет наблюдений. Записать результат подъёма можно в истории кормлений.
        </p>
      )}
    </div>
  );
}
