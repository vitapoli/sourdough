"use client";

import { useEffect, useState, useCallback } from "react";
import { StarterJar } from "./StarterJar";
import { FeedingForm, FeedingData } from "./FeedingForm";
import { FeedingHistory } from "./FeedingHistory";
import { CreateStarterForm } from "./CreateStarterForm";
import { LiveJar } from "./LiveJar";
import { RiseSettings } from "./RiseSettings";
import { Icon } from "./Icon";
import { getStarterMood } from "@/lib/starterMood";
import { UserObservation, calculateFermentation } from "@/lib/fermentation";

interface Feeding {
  id: string;
  fedAt: string;
  starterAmount: number | null;
  flourAmount: number | null;
  waterAmount: number | null;
  flourType: string | null;
  temperature: number | null;
  notes: string | null;
  peakTimeHours: number | null;
  readyTimeHours: number | null;
  peakMultiplier: number | null;
}

interface Starter {
  id: string;
  name: string;
  flour: string;
  createdAt: string;
  feedings: Feeding[];
}

const moodBadgeColors: Record<string, string> = {
  happy: "bg-green-happy/10 text-green-happy border border-green-happy/30",
  hungry: "bg-orange-hungry/10 text-orange-hungry border border-orange-hungry/30",
  sleepy: "bg-blue-sleepy/10 text-blue-sleepy border border-blue-sleepy/30",
  new: "bg-golden/10 text-golden border border-golden/30",
  ready: "bg-green-happy/10 text-green-happy border border-green-happy/30",
  peak: "bg-green-happy/10 text-green-happy border border-green-happy/30",
};

function formatTime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function FermentationTimers({ hoursAgo, peakTimeHours }: { hoursAgo: number; peakTimeHours: number }) {
  const readyTimeHours = peakTimeHours * 0.75;
  const timeToPeak = Math.max(0, peakTimeHours - hoursAgo);
  const timeToReady = Math.max(0, readyTimeHours - hoursAgo);

  return (
    <div className="w-full max-w-sm bg-card rounded-2xl p-3 shadow-sm border border-warm-beige">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-brown-light">Прошло</p>
          <p className="text-sm font-bold text-brown">{formatTime(hoursAgo)}</p>
        </div>
        <div>
          <p className="text-[10px] text-green-happy font-medium">До готовности</p>
          <p className="text-sm font-bold text-green-happy">
            {timeToReady > 0 ? formatTime(timeToReady) : "Готова!"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-brown-light">До пика</p>
          <p className="text-sm font-bold text-golden">
            {timeToPeak > 0 ? formatTime(timeToPeak) : "На пике"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TrackerTab() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Starter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [liveData, setLiveData] = useState<FeedingData | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [testMood, setTestMood] = useState<string | null>(null);

  // Обновляем время каждые 30 сек чтобы mood и таймеры пересчитывались
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);
  const [useCustomCurve, setUseCustomCurve] = useState(false);
  const [userObservations, setUserObservations] = useState<UserObservation[]>([]);

  const loadStarters = useCallback(async () => {
    const res = await fetch("/api/starters");
    const data = await res.json();
    setStarters(data);
    setLoading(false);
    return data;
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/starters/${id}`);
    const data = await res.json();
    setDetail(data);
  }, []);

  useEffect(() => {
    loadStarters().then((data) => {
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    });
  }, [loadStarters]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function handleDelete() {
    if (!detail) return;
    if (!confirm(`Удалить закваску "${detail.name}"? Это действие нельзя отменить.`)) return;
    await fetch(`/api/starters/${detail.id}`, { method: "DELETE" });
    setDetail(null);
    setSelectedId(null);
    const data = await loadStarters();
    if (data.length > 0) setSelectedId(data[0].id);
  }

  function handleFed(data: FeedingData | null) {
    if (selectedId) loadDetail(selectedId);
    loadStarters();
    if (data) {
      setLiveData(data);
      setShowLive(true);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-up">
          <Icon name="jar" size={40} className="mb-3 animate-bounce text-terracotta mx-auto" />
          <p className="text-brown-light">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (starters.length === 0 || showCreate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 min-h-[60vh] animate-fade-up">
        <Icon name="wheat" size={48} className="mb-3 text-terracotta" />
        <h2 className="text-xl font-extrabold text-brown-dark mb-1">
          {starters.length === 0 ? "Привет, пекарь!" : "Новая закваска"}
        </h2>
        <p className="text-brown-light mb-6 text-center">
          {starters.length === 0
            ? "Давай создадим твою первую закваску"
            : "Добавь ещё одну закваску"}
        </p>
        <CreateStarterForm
          onCreated={async () => {
            const data = await loadStarters();
            if (data.length > 0) {
              setSelectedId(data[0].id);
            }
            setShowCreate(false);
          }}
        />
        {starters.length > 0 && (
          <button
            onClick={() => setShowCreate(false)}
            className="mt-3 text-brown-light hover:text-brown text-sm transition-colors"
          >
            Отмена
          </button>
        )}
      </div>
    );
  }

  const lastFeeding = detail?.feedings?.[0] ?? null;
  const lastFeedingAt = lastFeeding?.fedAt ?? null;

  // Вычисляем время пика для определения mood=peak
  const peakTimeHours = lastFeeding
    ? calculateFermentation({
        starterAmount: lastFeeding.starterAmount ?? 10,
        flourAmount: lastFeeding.flourAmount ?? 20,
        waterAmount: lastFeeding.waterAmount ?? 20,
        temperature: lastFeeding.temperature ?? 22,
        flourType: lastFeeding.flourType ?? detail?.flour ?? "Пшеничная",
      }, useCustomCurve ? userObservations : undefined).peakTimeHours
    : undefined;

  const realMood = getStarterMood(lastFeedingAt, peakTimeHours, now);
  const { mood, label, message, hoursAgo } = testMood
    ? { mood: testMood as import("@/lib/starterMood").Mood, label: testMood, message: `Тест: ${testMood}`, hoursAgo: realMood.hoursAgo }
    : realMood;

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-20 gap-3">
      {/* Переключатель заквасок */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {starters.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedId(s.id);
              setLiveData(null);
            }}
            className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
              s.id === selectedId
                ? "bg-terracotta text-white card-shadow-lg scale-105"
                : "bg-card text-brown border border-warm-beige hover:border-terracotta/40 card-shadow"
            }`}
          >
            {s.name}
          </button>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-2xl text-sm font-bold bg-card text-terracotta border-2 border-dashed border-terracotta/30 hover:border-terracotta/60 transition-all"
        >
          +
        </button>
      </div>

      {detail && (
        <>
          {showLive && lastFeeding ? (
            <div className="cursor-pointer" onClick={() => setShowLive(false)}>
              <LiveJar
                starterAmount={liveData?.starterAmount ?? lastFeeding.starterAmount ?? 10}
                flourAmount={liveData?.flourAmount ?? lastFeeding.flourAmount ?? 20}
                waterAmount={liveData?.waterAmount ?? lastFeeding.waterAmount ?? 20}
                temperature={liveData?.temperature ?? lastFeeding.temperature ?? 22}
                flourType={liveData?.flourType ?? lastFeeding.flourType ?? detail.flour}
                startTime={liveData?.fedAt ?? new Date(lastFeeding.fedAt)}
                userObservations={useCustomCurve ? userObservations : undefined}
              />
            </div>
          ) : (
            <>
              {/* Баночка — тап переключает на LiveJar */}
              <div
                className={lastFeeding ? "cursor-pointer" : ""}
                onClick={() => lastFeeding && setShowLive(true)}
              >
                <StarterJar mood={mood} name={detail.name} />
              </div>

              {/* Настроение */}
              <span
                className={`px-3.5 py-1.5 rounded-full font-bold text-xs ${moodBadgeColors[mood]}`}
              >
                {message}
              </span>

              {/* Таймеры: прошло / до готовности / до пика */}
              {hoursAgo !== null && peakTimeHours && (
                <FermentationTimers hoursAgo={hoursAgo} peakTimeHours={peakTimeHours} />
              )}

              {/* ТЕСТ — переключение состояний (убрать потом) */}
              <div className="flex gap-1.5 flex-wrap justify-center">
                {(["happy", "ready", "peak", "hungry", "new"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTestMood(testMood === m ? null : m)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      testMood === m
                        ? "bg-terracotta text-white"
                        : "bg-warm-beige/50 text-brown-light"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Кнопка кормления */}
          <FeedingForm starterId={detail.id} defaultFlourType={detail.flour} onFed={handleFed} />

          {/* Инфо — компактная строка */}
          <div className="w-full max-w-sm bg-card rounded-xl px-3 py-2 card-shadow border border-warm-beige/60 flex justify-around items-center">
            <div className="text-center">
              <p className="text-[10px] text-brown-light leading-tight">Мука</p>
              <p className="text-xs font-bold text-brown">{detail.flour}</p>
            </div>
            <div className="w-px h-6 bg-warm-beige" />
            <div className="text-center">
              <p className="text-[10px] text-brown-light leading-tight">Возраст</p>
              <p className="text-xs font-bold text-brown">
                {Math.floor(
                  (Date.now() - new Date(detail.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                дн.
              </p>
            </div>
            <div className="w-px h-6 bg-warm-beige" />
            <div className="text-center">
              <p className="text-[10px] text-brown-light leading-tight">Кормлений</p>
              <p className="text-xs font-bold text-brown">
                {detail.feedings.length}
              </p>
            </div>
            <div className="w-px h-6 bg-warm-beige" />
            <button
              onClick={handleDelete}
              className="p-1.5 text-brown-light/40 hover:text-red-400 transition-colors"
              title="Удалить закваску"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 4h9M5.5 4V2.5a1 1 0 011-1h1a1 1 0 011 1V4M4 4v7.5a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Настройки шкалы подъёма */}
          <RiseSettings
            starterId={detail.id}
            flourType={detail.flour}
            useCustom={useCustomCurve}
            onToggleCustom={setUseCustomCurve}
            onObservationsLoaded={setUserObservations}
          />

          {/* История */}
          <FeedingHistory
            feedings={detail.feedings}
            onChanged={() => {
              if (selectedId) loadDetail(selectedId);
              loadStarters();
            }}
          />
        </>
      )}
    </div>
  );
}
