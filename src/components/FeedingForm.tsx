"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";

const FLOUR_TYPES = ["Пшеничная", "Ржаная"];

export interface FeedingData {
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  temperature: number;
  flourType: string;
  notes: string;
  fedAt: Date;
}

interface FeedingFormProps {
  starterId: string;
  defaultFlourType?: string;
  onFed: (data: FeedingData | null) => void;
}

export function FeedingForm({ starterId, defaultFlourType, onFed }: FeedingFormProps) {
  const [loading, setLoading] = useState(false);
  const [starterAmount, setStarterAmount] = useState("10");
  const [flourAmount, setFlourAmount] = useState("20");
  const [waterAmount, setWaterAmount] = useState("30");
  const [temperature, setTemperature] = useState("22");
  const [flourType, setFlourType] = useState(defaultFlourType || "Пшеничная");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  async function handleFeed() {
    const data: FeedingData = {
      starterAmount: parseFloat(starterAmount) || 30,
      flourAmount: parseFloat(flourAmount) || 50,
      waterAmount: parseFloat(waterAmount) || 50,
      temperature: parseFloat(temperature) || 22,
      flourType,
      notes,
      fedAt: new Date(),
    };

    setLoading(true);
    await fetch("/api/feedings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starterId,
        starterAmount: data.starterAmount,
        flourAmount: data.flourAmount,
        waterAmount: data.waterAmount,
        temperature: data.temperature,
        flourType,
        notes: notes || null,
      }),
    });
    setLoading(false);
    setDone(true);
    setShowExtra(false);
    setTimeout(() => setDone(false), 2000);
    onFed(data);
  }

  if (done) {
    return (
      <div className="px-6 py-2.5 bg-green-happy text-white font-bold rounded-2xl card-shadow-lg animate-fade-up">
        Покормлена!
      </div>
    );
  }

  const sa = parseFloat(starterAmount) || 0;
  const fa = parseFloat(flourAmount) || 0;
  const wa = parseFloat(waterAmount) || 0;
  const fmt = (v: number) => v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
  const ratio = sa > 0 ? `1:${fmt(fa / sa)}:${fmt(wa / sa)}` : "—";

  const inputClass =
    "w-full px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-sm font-bold text-brown-dark text-center focus:outline-none focus:border-terracotta transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

  return (
    <div className="w-full max-w-sm bg-card rounded-2xl p-3.5 card-shadow border border-warm-beige/60 space-y-2.5 animate-fade-up">
      {/* Пропорции — всегда видны */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] font-medium text-brown-light text-center block">Закваска</label>
          <input
            type="number"
            value={starterAmount}
            onChange={(e) => setStarterAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-brown-light text-center block">Мука, г</label>
          <input
            type="number"
            value={flourAmount}
            onChange={(e) => setFlourAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-brown-light text-center block">Вода, г</label>
          <input
            type="number"
            value={waterAmount}
            onChange={(e) => setWaterAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-brown-light text-center block">Соотн.</label>
          <div className="px-3 py-2 rounded-xl bg-warm-beige/50 text-sm font-bold text-terracotta text-center">
            {ratio}
          </div>
        </div>
      </div>

      {/* Тип муки */}
      <Dropdown
        value={flourType}
        options={FLOUR_TYPES}
        onChange={setFlourType}
        allowCustom
      />

      {/* Доп. поля — по кнопке */}
      {showExtra && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Icon name="thermometer" size={14} className="text-brown-light shrink-0" />
            <input
              type="range"
              min="0"
              max="35"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="flex-1 accent-terracotta"
            />
            <span className="text-sm font-bold text-brown-dark w-10 text-center">
              {temperature}°
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Заметки: запах, консистенция..."
            rows={2}
            className="w-full px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-sm text-brown-dark focus:outline-none focus:border-terracotta transition-colors resize-none"
          />
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-2">
        <button
          onClick={handleFeed}
          disabled={loading}
          className="flex-1 py-2.5 bg-gradient-to-r from-terracotta to-terracotta-light text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Icon name="flour-bag" size={18} className="opacity-90" />
          {loading ? "..." : "Покормить"}
        </button>
        <button
          onClick={() => setShowExtra(!showExtra)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            showExtra
              ? "bg-terracotta/10 text-terracotta border border-terracotta/30"
              : "bg-warm-beige/50 text-brown-light hover:text-brown border border-warm-beige"
          }`}
        >
          {showExtra ? "Скрыть" : "Темп. и заметки"}
        </button>
      </div>
    </div>
  );
}
