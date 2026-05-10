"use client";

import { useEffect, useState, useRef } from "react";
import {
  calculateFermentation,
  getCurrentRise,
  UserObservation,
} from "@/lib/fermentation";
import { formatTime } from "@/lib/formatTime";

interface LiveJarProps {
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  temperature: number;
  flourType: string;
  startTime: Date | null;
  userObservations?: UserObservation[];
}

export function LiveJar({
  starterAmount,
  flourAmount,
  waterAmount,
  temperature,
  flourType,
  startTime,
  userObservations,
}: LiveJarProps) {
  const [now, setNow] = useState(new Date());
  const [showHint, setShowHint] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Динамический интервал: чаще при переходах состояний, реже в спокойные фазы
  useEffect(() => {
    function getInterval() {
      if (!startTime) return 30000;
      const elapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
      const res = calculateFermentation(
        { starterAmount, flourAmount, waterAmount, temperature, flourType },
        userObservations
      );
      const readyTime = res.readyTimeHours;
      const peakTime = res.peakTimeHours;
      // Только покормили — обновляем каждые 10 сек
      if (elapsed < readyTime * 0.2) return 10000;
      // Приближаемся к готовности — каждую минуту
      if (elapsed < readyTime) return 60000;
      // Между готовностью и пиком — каждые 30 сек
      if (elapsed < peakTime) return 30000;
      // После пика — каждую минуту
      return 60000;
    }

    function tick() {
      setNow(new Date());
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setNow(new Date());
        // Пересчитаем интервал при следующем тике
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setNow(new Date()), getInterval());
      }, getInterval());
    }

    tick();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, starterAmount, flourAmount, waterAmount, temperature, flourType, userObservations]);

  const result = calculateFermentation(
    { starterAmount, flourAmount, waterAmount, temperature, flourType },
    userObservations
  );

  const elapsedHours = startTime
    ? (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    : 0;

  const currentRise = startTime ? getCurrentRise(elapsedHours, result) : 1;

  // Проценты для отображения в баночке
  // Банка вмещает до 3.5x подъёма
  const maxMultiplier = 3.5;
  const maxJarHeight = 90;
  const baseHeight = maxJarHeight / maxMultiplier;
  const currentHeight = Math.min(baseHeight * currentRise, 95);
  const peakHeight = Math.min(baseHeight * result.peakMultiplier, maxJarHeight);
  const readyHeight = baseHeight * (1 + (result.peakMultiplier - 1) * 0.8);

  // Время до пика и готовности
  const timeToPeak = Math.max(0, result.peakTimeHours - elapsedHours);
  const timeToReady = Math.max(0, result.readyTimeHours - elapsedHours);

  // Статус
  let status: { text: string; color: string; hint?: string };
  if (!startTime) {
    status = { text: "Ожидание кормления", color: "text-brown-light" };
  } else if (elapsedHours < result.peakTimeHours * 0.2) {
    status = {
      text: "Покормлена!",
      color: "text-green-happy",
      hint: "Закваска «просыпается» — бактерии и дрожжи привыкают к свежей муке. Видимого подъёма пока нет, но внутри уже идёт работа.",
    };
  } else if (elapsedHours < result.readyTimeHours) {
    status = { text: "Активный рост", color: "text-golden" };
  } else if (elapsedHours < result.peakTimeHours) {
    status = { text: "Готова к использованию!", color: "text-green-happy" };
  } else if (elapsedHours < result.peakTimeHours * 1.1) {
    status = { text: "На пике!", color: "text-green-happy" };
  } else {
    status = { text: "Прошла пик, опадает", color: "text-orange-hungry" };
  }

  const showBubbles =
    startTime &&
    elapsedHours > result.peakTimeHours * 0.2 &&
    elapsedHours < result.peakTimeHours * 1.2;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {/* Баночка с метками */}
      <div className="relative w-56 h-56 mx-auto">
        {/* Крышка */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gradient-to-b from-terracotta to-terracotta-light rounded-t-xl z-20 shadow-md" />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-44 h-3 bg-warm-beige border-x-2 border-brown-light/30 z-10" />

        {/* Тело банки */}
        <div className="absolute top-8 left-3 right-3 bottom-0 bg-white/40 backdrop-blur border-3 border-brown-light/40 rounded-3xl rounded-t-2xl overflow-hidden shadow-lg">
          {/* Закваска */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-200 to-yellow-100 transition-all duration-1000 ease-out"
            style={{
              height: `${currentHeight}%`,
              borderRadius: "35% 35% 0 0",
            }}
          >
            {/* Пузырьки */}
            {showBubbles && (
              <>
                <div className="absolute top-2 left-5 w-3.5 h-3.5 bg-white/50 rounded-full animate-bubble" />
                <div className="absolute top-5 right-6 w-2.5 h-2.5 bg-white/40 rounded-full animate-bubble-delay-1" />
                <div className="absolute top-1 left-1/2 w-3 h-3 bg-white/45 rounded-full animate-bubble-delay-2" />
                <div className="absolute top-8 left-8 w-2 h-2 bg-white/35 rounded-full animate-bubble-delay-1" />
              </>
            )}
          </div>

          {/* Метка: начальный уровень */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-brown-light/40 z-10"
            style={{ bottom: `${baseHeight}%` }}
          >
            <span className="absolute right-1 bottom-0.5 text-[10px] leading-none text-brown-light bg-cream/80 px-1 rounded">
              замес
            </span>
          </div>

          {/* Метка: готова (80% пика) */}
          {startTime && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-green-happy/60 z-10"
              style={{ bottom: `${readyHeight}%` }}
            >
              <span className="absolute right-1 bottom-0.5 text-[10px] leading-none text-green-happy font-bold bg-cream/80 px-1 rounded">
                готова
              </span>
            </div>
          )}

          {/* Метка: пик */}
          {startTime && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-golden/60 z-10"
              style={{ bottom: `${peakHeight}%` }}
            >
              <span className="absolute right-1 bottom-0.5 text-[10px] leading-none text-golden font-bold bg-cream/80 px-1 rounded">
                пик
              </span>
            </div>
          )}

          {/* Метка: текущий уровень */}
          {startTime && (
            <div
              className="absolute left-0 z-20 flex items-center"
              style={{ bottom: `${currentHeight}%` }}
            >
              <span className="text-[10px] text-terracotta font-bold bg-terracotta/10 px-1.5 py-0.5 rounded-r-lg border-l-2 border-terracotta">
                сейчас
              </span>
            </div>
          )}

        </div>

        {/* Шкала справа — снаружи банки, но позиции пересчитаны от общего контейнера */}
        {/* Тело банки: top-8 (2rem=32px) до bottom-0, значит bottom в контейнере = bottom_тела * (1 - 32/224) */}
        <div className="absolute -right-9 top-8 bottom-0 w-9 text-[9px] text-brown-light/60 z-10">
          <span className="absolute" style={{ bottom: `${peakHeight - 2}%` }}>
            {result.peakMultiplier.toFixed(1)}x
          </span>
          <span className="absolute" style={{ bottom: `${readyHeight - 2}%` }}>
            {(1 + (result.peakMultiplier - 1) * 0.8).toFixed(1)}x
          </span>
          <span className="absolute" style={{ bottom: `${baseHeight - 2}%` }}>
            1x
          </span>
        </div>
      </div>

      {/* Статус */}
      <div className="text-center">
        <p
          className={`font-bold text-lg ${status.color} ${status.hint ? "cursor-pointer" : ""}`}
          onClick={(e) => { if (status.hint) { e.stopPropagation(); setShowHint((v) => !v); } }}
        >
          {status.text} {status.hint && <span className="text-xs no-underline">ⓘ</span>}
        </p>
        {status.hint && showHint && (
          <p className="text-xs text-brown-light/80 mt-1 max-w-xs leading-snug">
            {status.hint}
          </p>
        )}
      </div>

      {/* Таймеры */}
      {startTime && (
        <div className="w-full bg-card rounded-2xl p-4 shadow-sm border border-warm-beige">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-brown-light">Прошло</p>
              <p className="text-lg font-bold text-brown">
                {formatTime(elapsedHours)}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-happy font-medium">До готовности</p>
              <p className="text-lg font-bold text-green-happy">
                {timeToReady > 0 ? formatTime(timeToReady) : "Готова!"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brown-light">До пика</p>
              <p className="text-lg font-bold text-golden">
                {timeToPeak > 0 ? formatTime(timeToPeak) : "На пике"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Прогноз */}
      <div className="w-full bg-card rounded-2xl p-4 shadow-sm border border-warm-beige space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-sm text-brown-dark">Прогноз</h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            result.source === "user"
              ? "bg-green-happy/15 text-green-happy"
              : "bg-warm-beige text-brown-light"
          }`}>
            {result.source === "user" ? "по моим данным" : "общие данные"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-brown-light">Пик через: </span>
            <span className="font-bold text-brown">
              {formatTime(result.peakTimeHours)}
            </span>
          </div>
          <div>
            <span className="text-brown-light">Подъём: </span>
            <span className="font-bold text-brown">
              x{result.peakMultiplier.toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-brown-light">Готова через: </span>
            <span className="font-bold text-green-happy">
              {formatTime(result.readyTimeHours)}
            </span>
          </div>
          <div>
            <span className="text-brown-light">Темп: </span>
            <span className="font-bold text-brown">{temperature}°C</span>
          </div>
        </div>
        {result.source !== "user" && (
          <p className="text-[11px] text-brown-light/70 leading-snug pt-1">
            Время рассчитано по усреднённым данным и может отличаться от реальности. Добавьте свои наблюдения в настройках — прогноз станет точнее.
          </p>
        )}
      </div>
    </div>
  );
}
