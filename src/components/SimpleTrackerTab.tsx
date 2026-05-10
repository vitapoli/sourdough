"use client";

import { useEffect, useState, useCallback } from "react";
import { StarterJar } from "./StarterJar";
import { CreateStarterForm } from "./CreateStarterForm";
import { Icon } from "./Icon";
import { getStarterMood } from "@/lib/starterMood";
import { formatTime } from "@/lib/formatTime";

interface Feeding {
  id: string;
  fedAt: string;
  starterAmount: number | null;
  flourAmount: number | null;
  waterAmount: number | null;
}

interface Starter {
  id: string;
  name: string;
  flour: string;
  createdAt: string;
  feedings: Feeding[];
}

// Мини-календарь текущего месяца с возможностью выбора дня
function MiniCalendar({
  feedingDates,
  selectedDate,
  onSelectDate,
}: {
  feedingDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Пн=0
  const daysInMonth = lastDay.getDate();
  const today = now.getDate();

  const monthName = firstDay.toLocaleDateString("ru-RU", { month: "long" });
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full max-w-sm bg-card rounded-2xl p-4 card-shadow border border-warm-beige/60">
      <p className="text-sm font-bold text-brown-dark text-center mb-2 capitalize">
        {monthName} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <span key={d} className="text-[10px] text-brown-light font-medium">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasFed = feedingDates.has(dateStr);
          const isToday = day === today;
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative text-xs py-1 rounded-lg font-medium transition-all ${
                isSelected
                  ? "bg-golden text-white ring-2 ring-golden/40"
                  : isToday
                    ? "bg-terracotta text-white"
                    : hasFed
                      ? "text-brown-dark hover:bg-warm-beige/50"
                      : "text-brown-light/50 hover:bg-warm-beige/30"
              }`}
            >
              {day}
              {hasFed && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected || isToday ? "bg-white" : "bg-green-happy"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SimpleTrackerTab() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Starter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Форма кормления
  const [starterAmount, setStarterAmount] = useState("10");
  const [flourAmount, setFlourAmount] = useState("20");
  const [waterAmount, setWaterAmount] = useState("30");
  const [feeding, setFeeding] = useState(false);
  const [done, setDone] = useState(false);

  // Календарь и редактирование
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSa, setEditSa] = useState("");
  const [editFa, setEditFa] = useState("");
  const [editWa, setEditWa] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingForDate, setAddingForDate] = useState(false);
  const [addTime, setAddTime] = useState("12:00");
  const [addSa, setAddSa] = useState("10");
  const [addFa, setAddFa] = useState("20");
  const [addWa, setAddWa] = useState("30");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

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
      if (data.length > 0) setSelectedId(data[0].id);
    });
  }, [loadStarters]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  function reload() {
    if (detail) loadDetail(detail.id);
    loadStarters();
  }

  async function handleFeed() {
    if (!detail) return;
    setFeeding(true);
    await fetch("/api/feedings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starterId: detail.id,
        starterAmount: parseFloat(starterAmount) || 10,
        flourAmount: parseFloat(flourAmount) || 20,
        waterAmount: parseFloat(waterAmount) || 30,
      }),
    });
    setFeeding(false);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    reload();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/feedings?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    reload();
  }

  function startEdit(f: Feeding) {
    setEditingId(f.id);
    setEditSa(f.starterAmount?.toString() ?? "");
    setEditFa(f.flourAmount?.toString() ?? "");
    setEditWa(f.waterAmount?.toString() ?? "");
  }

  async function saveEdit(id: string) {
    await fetch("/api/feedings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        starterAmount: parseFloat(editSa) || null,
        flourAmount: parseFloat(editFa) || null,
        waterAmount: parseFloat(editWa) || null,
      }),
    });
    setEditingId(null);
    reload();
  }

  async function handleAddForDate() {
    if (!detail || !selectedDate) return;
    const [h, m] = addTime.split(":").map(Number);
    const date = new Date(selectedDate);
    date.setHours(h || 12, m || 0, 0, 0);
    await fetch("/api/feedings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starterId: detail.id,
        starterAmount: parseFloat(addSa) || 10,
        flourAmount: parseFloat(addFa) || 20,
        waterAmount: parseFloat(addWa) || 30,
        fedAt: date.toISOString(),
      }),
    });
    setAddingForDate(false);
    reload();
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
          {starters.length === 0 ? "Давай создадим твою первую закваску" : "Добавь ещё одну закваску"}
        </p>
        <CreateStarterForm
          onCreated={async () => {
            const data = await loadStarters();
            if (data.length > 0) setSelectedId(data[0].id);
            setShowCreate(false);
          }}
        />
        {starters.length > 0 && (
          <button onClick={() => setShowCreate(false)} className="mt-3 text-brown-light hover:text-brown text-sm transition-colors">
            Отмена
          </button>
        )}
      </div>
    );
  }

  const lastFeeding = detail?.feedings?.[0] ?? null;
  const { mood, message } = getStarterMood(lastFeeding?.fedAt ?? null, undefined, now);

  // Даты кормлений для календарика
  const feedingDates = new Set(
    (detail?.feedings ?? []).map((f) => {
      const d = new Date(f.fedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  const sa = parseFloat(starterAmount) || 0;
  const fa = parseFloat(flourAmount) || 0;
  const wa = parseFloat(waterAmount) || 0;
  const fmt = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));
  const ratio = sa > 0 ? `1:${fmt(fa / sa)}:${fmt(wa / sa)}` : "—";

  const inputClass =
    "w-full px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-sm font-bold text-brown-dark text-center focus:outline-none focus:border-terracotta transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-20 gap-3">
      {/* Переключатель заквасок */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {starters.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
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
          {/* Баночка */}
          <StarterJar mood={mood} name={detail.name} />

          {/* Настроение */}
          <span className={`px-3.5 py-1.5 rounded-full font-bold text-xs ${
            mood === "hungry" ? "bg-orange-hungry/10 text-orange-hungry border border-orange-hungry/30" :
            mood === "new" ? "bg-golden/10 text-golden border border-golden/30" :
            "bg-green-happy/10 text-green-happy border border-green-happy/30"
          }`}>
            {message}
          </span>

          {/* Форма кормления */}
          {done ? (
            <div className="px-6 py-2.5 bg-green-happy text-white font-bold rounded-2xl card-shadow-lg animate-fade-up">
              Покормлена!
            </div>
          ) : (
            <div className="w-full max-w-sm bg-card rounded-2xl p-3.5 card-shadow border border-warm-beige/60 space-y-2.5 animate-fade-up">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-brown-light text-center block">Закваска</label>
                  <input type="number" value={starterAmount} onChange={(e) => setStarterAmount(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-brown-light text-center block">Мука, г</label>
                  <input type="number" value={flourAmount} onChange={(e) => setFlourAmount(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-brown-light text-center block">Вода, г</label>
                  <input type="number" value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-brown-light text-center block">Соотн.</label>
                  <div className="px-3 py-2 rounded-xl bg-warm-beige/50 text-sm font-bold text-terracotta text-center">
                    {ratio}
                  </div>
                </div>
              </div>
              <button
                onClick={handleFeed}
                disabled={feeding}
                className="w-full py-2.5 bg-gradient-to-r from-terracotta to-terracotta-light text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Icon name="flour-bag" size={18} className="opacity-90" />
                {feeding ? "..." : "Покормить"}
              </button>
            </div>
          )}

          {/* Календарик */}
          <MiniCalendar
            feedingDates={feedingDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Панель выбранного дня */}
          {selectedDate && (() => {
            const dayFeedings = (detail.feedings ?? []).filter((f) => {
              const d = new Date(f.fedAt);
              const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              return ds === selectedDate;
            });
            const dateObj = new Date(selectedDate);
            const dateLabel = dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

            return (
              <div className="w-full max-w-sm bg-card rounded-2xl p-4 card-shadow border border-golden/30 space-y-2 animate-fade-up">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-brown-dark">{dateLabel}</h4>
                  <button onClick={() => setSelectedDate(null)} className="text-brown-light hover:text-brown text-lg">✕</button>
                </div>

                {dayFeedings.length === 0 && (
                  <p className="text-xs text-brown-light py-1">Нет кормлений в этот день</p>
                )}

                {dayFeedings.map((f) => {
                  const time = new Date(f.fedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                  const sa = f.starterAmount || 0;
                  const fa = f.flourAmount || 0;
                  const wa = f.waterAmount || 0;
                  const fmt = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));
                  const r = sa > 0 ? `1:${fmt(fa / sa)}:${fmt(wa / sa)}` : "—";
                  const isDeleting = deletingId === f.id;

                  if (editingId === f.id) {
                    const esa = parseFloat(editSa) || 0;
                    const efa = parseFloat(editFa) || 0;
                    const ewa = parseFloat(editWa) || 0;
                    const efmt = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));
                    const editRatio = esa > 0 ? `1:${efmt(efa / esa)}:${efmt(ewa / esa)}` : "—";

                    return (
                      <div key={f.id} className="bg-warm-beige/30 rounded-xl p-3 space-y-2 animate-fade-up">
                        <p className="text-xs text-brown-light">{time}</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <label className="text-[9px] text-brown-light block text-center">Закв.</label>
                            <input type="number" value={editSa} onChange={(e) => setEditSa(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="text-[9px] text-brown-light block text-center">Мука</label>
                            <input type="number" value={editFa} onChange={(e) => setEditFa(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="text-[9px] text-brown-light block text-center">Вода</label>
                            <input type="number" value={editWa} onChange={(e) => setEditWa(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="text-[9px] text-brown-light block text-center">Соотн.</label>
                            <div className="px-1 py-2 rounded-xl bg-warm-beige/50 text-xs font-bold text-terracotta text-center">{editRatio}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(f.id)} className="flex-1 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs">Сохранить</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-brown-light text-xs">Отмена</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={f.id} className={`flex items-center justify-between py-1.5 ${isDeleting ? "opacity-30" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-brown-light">{time}</span>
                        <span className="text-sm font-bold text-terracotta">{r}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(f)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-brown-light hover:text-terracotta hover:bg-terracotta/10 transition-all"
                        >
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8.5 2.5l3 3M1 10l-.5 3.5L4 13l8.5-8.5-3-3L1 10z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          disabled={isDeleting}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-brown-light hover:text-orange-hungry hover:bg-orange-hungry/10 transition-all disabled:opacity-30"
                        >
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M3 4l.7 8.1a1 1 0 001 .9h4.6a1 1 0 001-.9L11 4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Добавить кормление на эту дату */}
                {addingForDate ? (
                  <div className="bg-warm-beige/30 rounded-xl p-3 space-y-2 animate-fade-up">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-brown-light">Время:</label>
                      <input type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)} className="px-2 py-1 border-2 border-warm-beige rounded-lg bg-cream text-sm text-brown-dark focus:outline-none focus:border-terracotta" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="text-[9px] text-brown-light block text-center">Закв.</label>
                        <input type="number" value={addSa} onChange={(e) => setAddSa(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-[9px] text-brown-light block text-center">Мука</label>
                        <input type="number" value={addFa} onChange={(e) => setAddFa(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-[9px] text-brown-light block text-center">Вода</label>
                        <input type="number" value={addWa} onChange={(e) => setAddWa(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddForDate} className="flex-1 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs">Добавить</button>
                      <button onClick={() => setAddingForDate(false)} className="px-3 py-1.5 text-brown-light text-xs">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingForDate(true); setAddSa("10"); setAddFa("20"); setAddWa("30"); setAddTime("12:00"); }}
                    className="w-full py-2 text-xs font-bold text-terracotta border-2 border-dashed border-terracotta/30 rounded-xl hover:border-terracotta/60 transition-all"
                  >
                    + Добавить кормление
                  </button>
                )}
              </div>
            );
          })()}

          {/* Краткая история */}
          <div className="w-full max-w-sm space-y-2">
            <h3 className="text-lg font-extrabold text-brown-dark flex items-center gap-2">
              <Icon name="notebook" size={20} />
              Последние кормления
            </h3>
            {(detail.feedings ?? []).length === 0 && (
              <p className="text-brown-light text-center py-4">Ещё ни одного кормления</p>
            )}
            {(detail.feedings ?? []).slice(0, 7).map((f) => {
              const date = new Date(f.fedAt);
              const timeStr = date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
              const sa = f.starterAmount || 0;
              const fa = f.flourAmount || 0;
              const wa = f.waterAmount || 0;
              const fmt = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));
              const r = sa > 0 ? `1:${fmt(fa / sa)}:${fmt(wa / sa)}` : "—";

              return (
                <div
                  key={f.id}
                  className="bg-card rounded-xl px-4 py-2.5 border border-warm-beige/60 card-shadow flex justify-between items-center"
                >
                  <span className="text-sm font-bold text-brown">{timeStr}</span>
                  <span className="text-sm font-bold text-terracotta">{r}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
