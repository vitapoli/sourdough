"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";

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

interface FeedingHistoryProps {
  feedings: Feeding[];
  onChanged?: () => void;
}

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}

function ObservationMiniForm({
  feeding,
  onSaved,
  onCancel,
}: {
  feeding: Feeding;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [peakH, setPeakH] = useState(feeding.peakTimeHours ? String(Math.floor(feeding.peakTimeHours)) : "");
  const [peakM, setPeakM] = useState(feeding.peakTimeHours ? String(Math.round((feeding.peakTimeHours % 1) * 60)) : "");
  const [readyH, setReadyH] = useState(feeding.readyTimeHours ? String(Math.floor(feeding.readyTimeHours)) : "");
  const [readyM, setReadyM] = useState(feeding.readyTimeHours ? String(Math.round((feeding.readyTimeHours % 1) * 60)) : "");
  const [mult, setMult] = useState(feeding.peakMultiplier ? String(feeding.peakMultiplier) : "");
  const [saving, setSaving] = useState(false);

  const peakTotal = (parseFloat(peakH) || 0) + (parseFloat(peakM) || 0) / 60;
  const readyTotal = (parseFloat(readyH) || 0) + (parseFloat(readyM) || 0) / 60;
  const readyOverPeak = readyTotal > 0 && peakTotal > 0 && readyTotal > peakTotal;

  function setMinClamped(setter: (v: string) => void, value: string) {
    const num = parseInt(value);
    if (value === "" || (num >= 0 && num <= 59)) setter(value);
  }

  async function handleSave() {
    if (peakTotal === 0 || !mult) return;
    setSaving(true);
    const readyFinal = readyTotal > 0 ? readyTotal : peakTotal * 0.75;
    await fetch("/api/feedings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: feeding.id,
        peakTimeHours: peakTotal,
        readyTimeHours: readyFinal,
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
        <span className="text-xs text-brown-light">Пик:</span>
        <input type="number" value={peakH} onChange={(e) => setPeakH(e.target.value)} placeholder="6" min="0" max="99" className={inputClass} />
        <span className="text-[10px] text-brown-light">ч</span>
        <input type="number" value={peakM} onChange={(e) => setMinClamped(setPeakM, e.target.value)} placeholder="0" min="0" max="59" className={inputClass} />
        <span className="text-[10px] text-brown-light">мин</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-brown-light">Готова:</span>
        <input type="number" value={readyH} onChange={(e) => setReadyH(e.target.value)} placeholder="" min="0" max="99" className={inputClass} />
        <span className="text-[10px] text-brown-light">ч</span>
        <input type="number" value={readyM} onChange={(e) => setMinClamped(setReadyM, e.target.value)} placeholder="" min="0" max="59" className={inputClass} />
        <span className="text-[10px] text-brown-light">мин</span>
        <span className="text-[10px] text-brown-light/60 ml-1">(необяз.)</span>
      </div>
      {readyOverPeak && (
        <p className="text-[10px] text-orange-hungry">Готовность не может быть позже пика</p>
      )}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-brown-light">Подъём:</span>
        <input type="number" value={mult} onChange={(e) => setMult(e.target.value)} placeholder="2.5" step="0.1" min="1" className={`${inputClass} w-16`} />
        <span className="text-[10px] text-brown-light">раз</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || peakTotal === 0 || !mult || readyOverPeak}
          className="flex-1 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs hover:bg-terracotta-light transition-all disabled:opacity-50"
        >
          {saving ? "..." : "Сохранить"}
        </button>
        {feeding.peakTimeHours && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="px-3 py-1.5 text-orange-hungry hover:bg-orange-hungry/10 font-medium text-xs rounded-lg transition-all disabled:opacity-50"
          >
            Убрать
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-brown-light hover:text-brown text-xs transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

function EditFeedingForm({
  feeding,
  onSaved,
  onCancel,
}: {
  feeding: Feeding;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [starterAmount, setStarterAmount] = useState(feeding.starterAmount?.toString() ?? "");
  const [flourAmount, setFlourAmount] = useState(feeding.flourAmount?.toString() ?? "");
  const [waterAmount, setWaterAmount] = useState(feeding.waterAmount?.toString() ?? "");
  const [flourType, setFlourType] = useState(feeding.flourType ?? "");
  const [temperature, setTemperature] = useState(feeding.temperature?.toString() ?? "");
  const [notes, setNotes] = useState(feeding.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
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
          <label className="text-xs font-medium text-brown">Закваска (г)</label>
          <input type="number" value={starterAmount} onChange={(e) => setStarterAmount(e.target.value)} placeholder="30" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">Мука (г)</label>
          <input type="number" value={flourAmount} onChange={(e) => setFlourAmount(e.target.value)} placeholder="50" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">Вода (г)</label>
          <input type="number" value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} placeholder="50" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">Тип муки</label>
          <Dropdown
            value={flourType}
            options={["Пшеничная", "Ржаная"]}
            onChange={setFlourType}
            placeholder="—"
            allowCustom
          />
        </div>
        <div>
          <label className="text-xs font-medium text-brown">Температура °C</label>
          <input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="22" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-brown">Заметки</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Запах, консистенция..." className={inputClass} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-terracotta text-white font-bold rounded-xl text-sm hover:bg-terracotta-light transition-all disabled:opacity-50">
          {saving ? "..." : "Сохранить"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-brown-light hover:text-brown text-sm transition-colors">
          Отмена
        </button>
      </div>
    </div>
  );
}

export function FeedingHistory({ feedings, onChanged }: FeedingHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [observingId, setObservingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/feedings?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    onChanged?.();
  }

  if (feedings.length === 0) {
    return (
      <div className="w-full max-w-sm text-center py-6">
        <p className="text-brown-light">Ещё ни одного кормления</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <h3 className="text-lg font-extrabold text-brown-dark flex items-center gap-2">
        <Icon name="notebook" size={20} />
        История кормлений
      </h3>
      {feedings.slice(0, 10).map((f, i) => {
        const date = new Date(f.fedAt);
        const timeStr = date.toLocaleDateString("ru-RU", {
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
                    наблюдение
                  </span>
                )}
              </div>

              <div className="flex gap-1 shrink-0 ml-2">
                <button
                  onClick={() => setEditingId(f.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-brown-light hover:text-terracotta hover:bg-terracotta/10 transition-all"
                  title="Редактировать"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 2.5l3 3M1 10l-.5 3.5L4 13l8.5-8.5-3-3L1 10z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={isDeleting}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-brown-light hover:text-orange-hungry hover:bg-orange-hungry/10 transition-all disabled:opacity-30"
                  title="Удалить"
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
                  {f.starterAmount && `${f.starterAmount}г зак. / `}
                  {f.flourAmount && `${f.flourAmount}г муки`}
                  {f.flourAmount && f.waterAmount && " / "}
                  {f.waterAmount && `${f.waterAmount}г воды`}
                </span>
              )}
              {f.flourType && (
                <span className="text-xs text-brown-light bg-warm-beige/70 px-2.5 py-1 rounded-lg font-medium">
                  {f.flourType}
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
                  пик: {formatHours(f.peakTimeHours!)}
                </span>
                <span className="text-green-happy bg-green-happy/10 px-2 py-0.5 rounded-lg font-medium">
                  готова: {formatHours(f.readyTimeHours!)}
                </span>
                <span className="text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-lg font-medium">
                  x{f.peakMultiplier}
                </span>
              </div>
            )}

            {f.notes && (
              <p className="text-sm text-brown-light mt-1.5">{f.notes}</p>
            )}

            {/* Кнопка записать результат */}
            {hasAmounts && observingId !== f.id && (
              <button
                onClick={() => setObservingId(f.id)}
                className="mt-2 text-[11px] text-terracotta hover:underline font-medium"
              >
                {hasObservation ? "Изменить результат" : "Записать результат подъёма"}
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
    </div>
  );
}
