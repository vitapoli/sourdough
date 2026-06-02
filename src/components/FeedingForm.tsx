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
  photos?: string; // JSON массив URL
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newFiles = [...photoFiles, ...Array.from(files)].slice(0, 4);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    const newFiles = photoFiles.filter((_, i) => i !== index);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

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

    // Загрузить фото, если есть
    let photosJson: string | undefined;
    if (photoFiles.length > 0) {
      try {
        const formData = new FormData();
        formData.append("starterId", starterId);
        photoFiles.forEach((f) => formData.append("photos", f));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.urls) {
          photosJson = JSON.stringify(uploadData.urls);
          data.photos = photosJson;
        } else {
          alert("Не удалось загрузить фото: " + (uploadData.error || "неизвестная ошибка"));
        }
      } catch (err) {
        alert("Ошибка загрузки фото: " + String(err));
      }
    }

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
        ...(photosJson ? { photos: photosJson } : {}),
      }),
    });
    setLoading(false);
    setDone(true);
    setShowExtra(false);
    setPhotoFiles([]);
    setPhotoPreviews([]);
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
        <div className="flex flex-col">
          <label className="text-[10px] font-medium text-brown-light text-center h-4 leading-4">Закваска</label>
          <input
            type="number"
            inputMode="decimal"
            value={starterAmount}
            onChange={(e) => setStarterAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-medium text-brown-light text-center h-4 leading-4">Мука, г</label>
          <input
            type="number"
            inputMode="decimal"
            value={flourAmount}
            onChange={(e) => setFlourAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-medium text-brown-light text-center h-4 leading-4">Вода, г</label>
          <input
            type="number"
            inputMode="decimal"
            value={waterAmount}
            onChange={(e) => setWaterAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-medium text-brown-light text-center h-4 leading-4">Соотн.</label>
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

      {/* Фото */}
      {photoPreviews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photoPreviews.map((src, i) => (
            <div key={i} className="relative w-16 h-16">
              <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border-2 border-warm-beige" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-2">
        <button
          onClick={handleFeed}
          disabled={loading || sa <= 0 || fa <= 0 || wa <= 0}
          className="flex-1 py-2.5 bg-gradient-to-r from-terracotta to-terracotta-light text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Icon name="flour-bag" size={18} className="opacity-90" />
          {loading ? "..." : "Покормить"}
        </button>
        <label
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            photoFiles.length > 0
              ? "bg-terracotta/10 text-terracotta border border-terracotta/30"
              : "bg-warm-beige/50 text-brown-light hover:text-brown border border-warm-beige"
          } ${photoFiles.length >= 4 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Icon name="camera" size={16} />
          {photoFiles.length > 0 ? photoFiles.length : ""}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
            className="hidden"
            disabled={photoFiles.length >= 4}
          />
        </label>
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
