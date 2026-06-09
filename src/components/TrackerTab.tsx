"use client";

import { useEffect, useState, useCallback } from "react";
import { StarterJar } from "./StarterJar";
import { FeedingForm, FeedingData } from "./FeedingForm";
import { FeedingHistory } from "./FeedingHistory";
import { CreateStarterForm } from "./CreateStarterForm";
import { LiveJar } from "./LiveJar";
import { RiseSettings } from "./RiseSettings";
import { Icon } from "./Icon";
import { getStarterMood, Mood } from "@/lib/starterMood";
import { UserObservation, calculateFermentation } from "@/lib/fermentation";
import { formatTime } from "@/lib/formatTime";
import { useT, useFlourLabel } from "@/lib/i18n";

interface Feeding {
  id: string;
  fedAt: string;
  starterAmount: number | null;
  flourAmount: number | null;
  waterAmount: number | null;
  flourType: string | null;
  temperature: number | null;
  notes: string | null;
  photos: string | null;
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
  isPaused?: boolean;
  pausedAt?: string | null;
  resumedAt?: string | null;
}

const moodBadgeColors: Record<string, string> = {
  happy: "bg-green-happy/10 text-green-happy border border-green-happy/30",
  hungry: "bg-orange-hungry/10 text-orange-hungry border border-orange-hungry/30",
  paused: "bg-blue-sleepy/10 text-blue-sleepy border border-blue-sleepy/30",
  new: "bg-golden/10 text-golden border border-golden/30",
  ready: "bg-green-happy/10 text-green-happy border border-green-happy/30",
  peak: "bg-green-happy/10 text-green-happy border border-green-happy/30",
};

function PauseButton({ isPaused, starterId, onDone }: { isPaused: boolean; starterId: string; onDone: () => void }) {
  const t = useT();
  return (
    <button
      onClick={async () => {
        await fetch(`/api/starters/${starterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: isPaused ? "resume" : "pause" }),
        });
        onDone();
      }}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-terracotta text-white shadow-sm transition-all active:scale-95"
      title={isPaused ? t("tracker.resume") : t("tracker.pause")}
    >
      <span className="text-sm leading-none">{isPaused ? "▶" : "⏸"}</span>
    </button>
  );
}

function FermentationTimers({ hoursAgo, peakTimeHours }: { hoursAgo: number; peakTimeHours: number }) {
  const t = useT();
  const timeToPeak = Math.max(0, peakTimeHours - hoursAgo);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-brown-light">
        {t("tracker.elapsed")} <span className="font-bold text-brown">{formatTime(hoursAgo)}</span>
      </span>
      <span className="text-brown-light/40">|</span>
      <span className="text-brown-light">
        {t("tracker.toPeak")} <span className="font-bold text-golden">{timeToPeak > 0 ? formatTime(timeToPeak) : t("tracker.atPeak")}</span>
      </span>
    </div>
  );
}

export function TrackerTab() {
  const t = useT();
  const flourLabel = useFlourLabel();
  const [starters, setStarters] = useState<Starter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Starter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [liveData, setLiveData] = useState<FeedingData | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Обновляем время каждые 30 сек чтобы mood и таймеры пересчитывались
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);
  const [useCustomCurve, setUseCustomCurve] = useState(false);
  const [userObservations, setUserObservations] = useState<UserObservation[]>([]);
  const [obsVersion, setObsVersion] = useState(0);

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
    if (!confirm(t("tracker.deleteConfirm").replace("{name}", detail.name))) return;
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
          <p className="text-brown-light">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (starters.length === 0 || showCreate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 min-h-[60vh] animate-fade-up">
        <Icon name="wheat" size={48} className="mb-3 text-terracotta" />
        <h2 className="text-xl font-extrabold text-brown-dark mb-1">
          {starters.length === 0 ? t("tracker.hello") : t("tracker.newStarter")}
        </h2>
        <p className="text-brown-light mb-6 text-center">
          {starters.length === 0
            ? t("tracker.createFirst")
            : t("tracker.addAnother")}
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
            {t("cancel")}
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

  const isPaused = detail?.isPaused ?? false;
  const effectiveCurrentTime = isPaused && detail?.pausedAt ? new Date(detail.pausedAt).getTime() : now;
  const effectiveLastFeeding = !isPaused && detail?.resumedAt && lastFeedingAt
    && new Date(detail.resumedAt).getTime() > new Date(lastFeedingAt).getTime()
    ? detail.resumedAt : lastFeedingAt;

  const moodRaw = isPaused
    ? { mood: "paused" as Mood, label: "", message: "", hoursAgo: null }
    : getStarterMood(effectiveLastFeeding, peakTimeHours, effectiveCurrentTime);
  const { mood, hoursAgo } = moodRaw;

  const moodLabelMap: Record<string, string> = {
    "Новенькая": t("mood.label.new"), "Покормлена": t("mood.label.fed"), "Готова!": t("mood.label.ready"),
    "На пике!": t("mood.label.peak"), "Опадает": t("mood.label.falling"), "Счастливая": t("mood.label.happy"),
    "Голодная": t("mood.label.hungry"),
  };
  const moodMsgMap: Record<string, string> = {
    "Покорми меня в первый раз!": t("mood.msg.new"), "Только покормили, работаю!": t("mood.msg.fed"),
    "Можно использовать в тесто!": t("mood.msg.ready"), "Я на максимуме! Используй меня!": t("mood.msg.peak"),
    "Прошла пик... покорми меня!": t("mood.msg.falling"), "Я сытая и пузырюсь!": t("mood.msg.happy"),
    "Пора бы подкрепиться...": t("mood.msg.hungry"),
  };
  const label = isPaused ? t("mood.label.paused") : (moodLabelMap[moodRaw.label] || moodRaw.label);
  const message = isPaused ? t("mood.msg.paused") : (moodMsgMap[moodRaw.message] || moodRaw.message);

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-20 gap-2">
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

              {/* Таймеры: прошло / до пика + кнопка паузы */}
              <div className="flex items-center gap-2">
                {hoursAgo !== null && peakTimeHours && (
                  <FermentationTimers hoursAgo={hoursAgo} peakTimeHours={peakTimeHours} />
                )}
                <PauseButton
                  isPaused={isPaused}
                  starterId={detail.id}
                  onDone={async () => {
                    const res = await fetch(`/api/starters/${detail.id}`);
                    if (res.ok) setDetail(await res.json());
                    loadStarters();
                  }}
                />
              </div>

            </>
          )}

          {/* Кнопка кормления */}
          {!isPaused && <FeedingForm starterId={detail.id} defaultFlourType={detail.flour} onFed={handleFed} />}

          {/* Инфо — компактная строка */}
          <div className="w-full max-w-sm bg-card rounded-xl px-3 py-2 card-shadow border border-warm-beige/60 flex justify-around items-center">
            <div className="text-center">
              <p className="text-[10px] text-brown-light leading-tight">{t("tracker.flour")}</p>
              <p className="text-xs font-bold text-brown">{flourLabel(detail.flour)}</p>
            </div>
            <div className="w-px h-6 bg-warm-beige" />
            <div className="text-center">
              <p className="text-[10px] text-brown-light leading-tight">{t("tracker.age")}</p>
              <p className="text-xs font-bold text-brown">
                {Math.floor(
                  (Date.now() - new Date(detail.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                {t("tracker.days")}
              </p>
            </div>
            <div className="w-px h-6 bg-warm-beige" />
            <div className="text-center">
              <p className="text-[10px] text-brown-light leading-tight">{t("tracker.feedings")}</p>
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
            refreshKey={obsVersion}
          />

          {/* История */}
          <FeedingHistory
            feedings={detail.feedings}
            starterId={selectedId!}
            onChanged={() => {
              if (selectedId) loadDetail(selectedId);
              loadStarters();
              setObsVersion((v) => v + 1);
            }}
          />
        </>
      )}
    </div>
  );
}
