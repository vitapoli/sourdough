"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";
import { formatTime } from "@/lib/formatTime";
import { PhotoViewer } from "./PhotoViewer";
import { useT, useFlourLabel, useLang } from "@/lib/i18n";

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

interface FeedingHistoryProps {
  feedings: Feeding[];
  starterId: string;
  onChanged?: () => void;
}

const formatHours = formatTime;

function ObservationMiniForm({
  feeding,
  onSaved,
  onCancel,
}: {
  feeding: Feeding;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [peakH, setPeakH] = useState(feeding.peakTimeHours ? String(Math.floor(feeding.peakTimeHours)) : "");
  const [peakM, setPeakM] = useState(feeding.peakTimeHours ? String(Math.round((feeding.peakTimeHours % 1) * 60)) : "");
  const [mult, setMult] = useState(feeding.peakMultiplier ? String(feeding.peakMultiplier) : "");
  const [saving, setSaving] = useState(false);

  const peakTotal = (parseFloat(peakH) || 0) + (parseFloat(peakM) || 0) / 60;

  function setMinClamped(setter: (v: string) => void, value: string) {
    const num = parseInt(value);
    if (value === "" || (num >= 0 && num <= 59)) setter(value);
  }

  async function handleSave() {
    if (peakTotal === 0 || !mult) return;
    setSaving(true);
    await fetch("/api/feedings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: feeding.id,
        peakTimeHours: peakTotal,
        readyTimeHours: peakTotal * 0.75,
        peakMultiplier: parseFloat(mult),
      }),
    });
    setSaving(false);
    onSaved();
  }

  async function handleClear() {
    setSaving(true);
    await fetch("/api/feedings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: feeding.id,
        peakTimeHours: null,
        readyTimeHours: null,
        peakMultiplier: null,
      }),
    });
    setSaving(false);
    onSaved();
  }

  const inputClass =
    "px-2.5 py-1.5 border-2 border-warm-beige rounded-lg bg-cream text-sm text-brown-dark text-center focus:outline-none focus:border-terracotta transition-colors w-14";

  return (
    <div className="mt-2 pt-2 border-t border-warm-beige space-y-2 animate-fade-up">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-brown-light">{t("history.peak")}</span>
        <input type="number" value={peakH} onChange={(e) => setPeakH(e.target.value)} placeholder="6" min="0" max="99" className={inputClass} />
        <span className="text-[10px] text-brown-light">{t("history.hours")}</span>
        <input type="number" value={peakM} onChange={(e) => setMinClamped(setPeakM, e.target.value)} placeholder="0" min="0" max="59" className={inputClass} />
        <span className="text-[10px] text-brown-light">{t("history.minutes")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-brown-light">{t("history.rise")}</span>
        <input type="number" value={mult} onChange={(e) => setMult(e.target.value)} placeholder="2.5" step="0.1" min="1" className={`${inputClass} w-16`} />
        <span className="text-[10px] text-brown-light">{t("history.times")}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || peakTotal === 0 || !mult}
          className="flex-1 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs hover:bg-terracotta-light transition-all disabled:opacity-50"
        >
          {saving ? "..." : t("save")}
        </button>
        {feeding.peakTimeHours && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="px-3 py-1.5 text-orange-hungry hover:bg-orange-hungry/10 font-medium text-xs rounded-lg transition-all disabled:opacity-50"
          >
            {t("history.remove")}
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-brown-light hover:text-brown text-xs transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

function EditFeedingForm({
  feeding,
  starterId,
  onSaved,
  onCancel,
}: {
  feeding: Feeding;
  starterId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [starterAmount, setStarterAmount] = useState(feeding.starterAmount?.toString() ?? "");
  const [flourAmount, setFlourAmount] = useState(feeding.flourAmount?.toString() ?? "");
  const [waterAmount, setWaterAmount] = useState(feeding.waterAmount?.toString() ?? "");
  const [flourType, setFlourType] = useState(feeding.flourType ?? "");
  const [temperature, setTemperature] = useState(feeding.temperature?.toString() ?? "");
  const [notes, setNotes] = useState(feeding.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Внутри храним русское значение из БД, на экране показываем перевод (как в форме добавления)
  const flourLabelMap: Record<string, string> = {
    "Пшеничная": t("create.wheat"),
    "Ржаная": t("create.rye"),
  };
  const flourLabelToValue: Record<string, string> = {};
  for (const [val, label] of Object.entries(flourLabelMap)) {
    flourLabelToValue[label] = val;
  }
  const flourLabels = Object.keys(flourLabelMap).map((ft) => flourLabelMap[ft]);
  const flourDisplayValue = flourLabelMap[flourType] || flourType;

  const existingPhotos: string[] = feeding.photos ? JSON.parse(feeding.photos) : [];
  const [keepPhotos, setKeepPhotos] = useState<string[]>(existingPhotos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const totalPhotos = keepPhotos.length + newFiles.length;

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const allowed = 4 - totalPhotos;
    const added = Array.from(files).slice(0, allowed);
    const updated = [...newFiles, ...added];
    setNewFiles(updated);
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  }

  function removeExisting(url: string) {
    setKeepPhotos(keepPhotos.filter((u) => u !== url));
  }

  function removeNew(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    const updated = newFiles.filter((_, i) => i !== index);
    setNewFiles(updated);
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  }

  async function handleSave() {
    setSaving(true);

    let allPhotos = [...keepPhotos];

    if (newFiles.length > 0) {
      const formData = new FormData();
      formData.append("starterId", starterId);
      newFiles.forEach((f) => formData.append("photos", f));
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.urls) allPhotos = [...allPhotos, ...data.urls];
      } catch {}
    }

    await fetch("/api/feedings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: feeding.id,
        starterAmount: starterAmount ? parseFloat(starterAmount) : null,
        flourAmount: flourAmount ? parseFloat(flourAmount) : null,
        waterAmount: waterAmount ? parseFloat(waterAmount) : null,
        flourType: flourType || null,
        temperature: temperature ? parseFloat(temperature) : null,
        notes: notes || null,
        photos: allPhotos.length > 0 ? JSON.stringify(allPhotos) : null,
      }),
    });
    setSaving(false);
    onSaved();
  }

  const inputClass =
    "w-full px-3 py-2 border-2 border-warm-beige rounded-xl bg-cream text-sm text-brown-dark focus:outline-none focus:border-terracotta transition-colors";

  return (
    <div className="bg-card rounded-2xl px-4 py-4 border border-terracotta/30 card-shadow space-y-3 animate-fade-up">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-brown">{t("history.starterG")}</label>
          <input type="number" value={starterAmount} onChange={(e) => setStarterAmount(e.target.value)} placeholder="30" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">{t("history.flourG")}</label>
          <input type="number" value={flourAmount} onChange={(e) => setFlourAmount(e.target.value)} placeholder="50" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">{t("history.waterG")}</label>
          <input type="number" value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} placeholder="50" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">{t("history.flourType")}</label>
          <Dropdown
            value={flourDisplayValue}
            options={flourLabels}
            onChange={(label) => setFlourType(flourLabelToValue[label] || label)}
            placeholder="—"
            allowCustom
          />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">{t("history.tempC")}</label>
          <input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="22" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-brown">{t("history.notes")}</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("history.notesPlaceholder")} className={inputClass} />
      </div>

      {/* Фото */}
      <div>
        <label className="text-xs font-medium text-brown">{t("history.photo")}</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {keepPhotos.map((url, i) => (
            <div key={url} className="relative w-16 h-16">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border-2 border-warm-beige" />
              <button type="button" onClick={() => removeExisting(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">×</button>
            </div>
          ))}
          {newPreviews.map((src, i) => (
            <div key={i} className="relative w-16 h-16">
              <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border-2 border-terracotta/30" />
              <button type="button" onClick={() => removeNew(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">×</button>
            </div>
          ))}
          {totalPhotos < 4 && (
            <label className="w-16 h-16 flex items-center justify-center rounded-xl border-2 border-dashed border-warm-beige text-brown-light hover:border-terracotta hover:text-terracotta cursor-pointer transition-colors">
              <Icon name="camera" size={20} />
              <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-terracotta text-white font-bold rounded-xl text-sm hover:bg-terracotta-light transition-all disabled:opacity-50">
          {saving ? "..." : t("save")}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-brown-light hover:text-brown text-sm transition-colors">
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export function FeedingHistory({ feedings, starterId, onChanged }: FeedingHistoryProps) {
  const t = useT();
  const flourLabel = useFlourLabel();
  const { lang } = useLang();
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [observingId, setObservingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const [viewPhotoIndex, setViewPhotoIndex] = useState(0);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/feedings?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    onChanged?.();
  }

  if (feedings.length === 0) {
    return (
      <div className="w-full max-w-sm text-center py-6">
        <p className="text-brown-light">{t("history.noFeedings")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <h3 className="text-lg font-extrabold text-brown-dark flex items-center gap-2">
        <Icon name="notebook" size={20} />
        {t("history.title")}
      </h3>
      {feedings.slice(0, 10).map((f, i) => {
        const date = new Date(f.fedAt);
        const timeStr = date.toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const isDeleting = deletingId === f.id;
        const hasObservation = f.peakTimeHours != null;
        const hasAmounts = f.flourAmount || f.starterAmount;

        if (editingId === f.id) {
          return (
            <EditFeedingForm
              key={f.id}
              feeding={f}
              starterId={starterId}
              onSaved={() => { setEditingId(null); onChanged?.(); }}
              onCancel={() => setEditingId(null)}
            />
          );
        }

        return (
          <div
            key={f.id}
            className={`bg-card rounded-2xl px-4 py-3 border card-shadow transition-all ${
              i === 0 ? "border-green-happy/30" : hasObservation ? "border-golden/30" : "border-warm-beige/60"
            } ${isDeleting ? "opacity-30" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {i === 0 && (
                  <span className="w-2 h-2 bg-green-happy rounded-full shrink-0" />
                )}
                <span className="text-sm font-bold text-brown">{timeStr}</span>
                {hasObservation && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-golden/15 text-golden font-medium">
                    {t("history.observation")}
                  </span>
                )}
              </div>

              <div className="flex gap-1 shrink-0 ml-2">
                <button
                  onClick={() => setEditingId(f.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-brown-light hover:text-terracotta hover:bg-terracotta/10 transition-all"
                  title={t("edit")}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 2.5l3 3M1 10l-.5 3.5L4 13l8.5-8.5-3-3L1 10z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={isDeleting}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-brown-light hover:text-orange-hungry hover:bg-orange-hungry/10 transition-all disabled:opacity-30"
                  title={t("delete")}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M3 4l.7 8.1a1 1 0 001 .9h4.6a1 1 0 001-.9L11 4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Детали кормления */}
            <div className="flex gap-3 flex-wrap mt-1.5">
              {(f.flourAmount || f.waterAmount) && (
                <span className="text-xs text-brown-light bg-warm-beige/70 px-2.5 py-1 rounded-lg font-medium">
                  {f.starterAmount && `${f.starterAmount}${t("history.gStarter")} / `}
                  {f.flourAmount && `${f.flourAmount}${t("history.gFlour")}`}
                  {f.flourAmount && f.waterAmount && " / "}
                  {f.waterAmount && `${f.waterAmount}${t("history.gWater")}`}
                </span>
              )}
              {f.starterAmount && f.flourAmount && (
                <span className="text-xs text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-lg font-medium">
                  1:{f.flourAmount / f.starterAmount % 1 === 0 ? (f.flourAmount / f.starterAmount).toFixed(0) : (f.flourAmount / f.starterAmount).toFixed(1)}:{(f.waterAmount || 0) / f.starterAmount % 1 === 0 ? ((f.waterAmount || 0) / f.starterAmount).toFixed(0) : ((f.waterAmount || 0) / f.starterAmount).toFixed(1)}
                </span>
              )}
              {f.flourType && (
                <span className="text-xs text-brown-light bg-warm-beige/70 px-2.5 py-1 rounded-lg font-medium">
                  {flourLabel(f.flourType)}
                </span>
              )}
              {f.temperature && (
                <span className="text-xs text-brown-light bg-warm-beige/70 px-2.5 py-1 rounded-lg font-medium">
                  {f.temperature}°C
                </span>
              )}
            </div>

            {/* Данные наблюдения, если есть */}
            {hasObservation && (
              <div className="flex gap-3 mt-1.5 text-xs">
                <span className="text-golden bg-golden/10 px-2 py-0.5 rounded-lg font-medium">
                  {t("history.peakLabel")} {formatHours(f.peakTimeHours!)}
                </span>
                <span className="text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-lg font-medium">
                  x{f.peakMultiplier}
                </span>
              </div>
            )}

            {f.notes && (
              <p className="text-sm text-brown-light mt-1.5">{f.notes}</p>
            )}

            {/* Фото кормления */}
            {f.photos && (() => {
              const urls: string[] = JSON.parse(f.photos);
              return urls.length > 0 ? (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {urls.map((url, pi) => (
                    <img
                      key={pi}
                      src={url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-xl border border-warm-beige cursor-pointer hover:opacity-80 transition-opacity opacity-75 brightness-90 saturate-[0.85]"
                      onClick={() => { setViewPhotos(urls); setViewPhotoIndex(pi); }}
                    />
                  ))}
                </div>
              ) : null;
            })()}

            {/* Кнопка записать результат */}
            {hasAmounts && observingId !== f.id && (
              <button
                onClick={() => setObservingId(f.id)}
                className="mt-2 text-[11px] text-terracotta hover:underline font-medium"
              >
                {hasObservation ? t("history.editResult") : t("history.recordResult")}
              </button>
            )}

            {/* Форма наблюдения */}
            {observingId === f.id && (
              <ObservationMiniForm
                feeding={f}
                onSaved={() => { setObservingId(null); onChanged?.(); }}
                onCancel={() => setObservingId(null)}
              />
            )}
          </div>
        );
      })}

      {/* Просмотр фото */}
      {viewPhotos && (
        <PhotoViewer
          photos={viewPhotos}
          startIndex={viewPhotoIndex}
          onClose={() => setViewPhotos(null)}
        />
      )}
    </div>
  );
}
