"use client";

// Слой данных трекера закваски.
// Для вошедшего пользователя — обычные запросы на сервер (как раньше).
// Для гостя (без регистрации) — всё хранится в браузере (localStorage),
// чтобы человек мог сразу попробовать закваску-тамагочи без аккаунта.

interface GuestFeeding {
  id: string;
  fedAt: string;
  starterAmount: number | null;
  flourAmount: number | null;
  waterAmount: number | null;
}

interface GuestStarter {
  id: string;
  name: string;
  flour: string;
  createdAt: string;
  isPaused: boolean;
  pausedAt: string | null;
  resumedAt: string | null;
  feedings: GuestFeeding[];
}

const KEY = "guestStarters";

// Режим включается один раз на главной после проверки авторизации.
let _guest = false;
export function setGuestMode(v: boolean) {
  _guest = v;
}
export function isGuestMode() {
  return _guest;
}

function genId() {
  return "g-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readAll(): GuestStarter[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(list: GuestStarter[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

// Есть ли у гостя закваски, которые нужно перенести в аккаунт после входа.
// Нужно главной странице, чтобы решить, можно ли показывать UI оптимистично.
export function hasGuestStarters(): boolean {
  return readAll().length > 0;
}

const sortByFedDesc = (a: GuestFeeding, b: GuestFeeding) => b.fedAt.localeCompare(a.fedAt);

// --- Операции (одинаковый интерфейс для гостя и для сервера) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listStarters(): Promise<any[]> {
  if (_guest) {
    return readAll()
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((s) => ({ ...s, feedings: [...s.feedings].sort(sortByFedDesc).slice(0, 1) }));
  }
  const res = await fetch("/api/starters");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStarter(id: string): Promise<any> {
  if (_guest) {
    const s = readAll().find((x) => x.id === id);
    if (!s) return null;
    return { ...s, feedings: [...s.feedings].sort(sortByFedDesc) };
  }
  const res = await fetch(`/api/starters/${id}`);
  if (!res.ok) return null;
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createStarter(input: { name: string; flour: string }): Promise<any | null> {
  if (_guest) {
    const list = readAll();
    const s: GuestStarter = {
      id: genId(),
      name: input.name,
      flour: input.flour,
      createdAt: new Date().toISOString(),
      isPaused: false,
      pausedAt: null,
      resumedAt: null,
      feedings: [],
    };
    list.push(s);
    writeAll(list);
    return s;
  }
  const res = await fetch("/api/starters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.ok ? res.json() : null;
}

export async function addFeeding(input: {
  starterId: string;
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  fedAt?: string;
}): Promise<void> {
  if (_guest) {
    const list = readAll();
    const s = list.find((x) => x.id === input.starterId);
    if (!s) return;
    s.feedings.push({
      id: genId(),
      fedAt: input.fedAt || new Date().toISOString(),
      starterAmount: input.starterAmount,
      flourAmount: input.flourAmount,
      waterAmount: input.waterAmount,
    });
    writeAll(list);
    return;
  }
  await fetch("/api/feedings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateFeeding(input: {
  id: string;
  starterAmount: number | null;
  flourAmount: number | null;
  waterAmount: number | null;
}): Promise<void> {
  if (_guest) {
    const list = readAll();
    for (const s of list) {
      const f = s.feedings.find((x) => x.id === input.id);
      if (f) {
        f.starterAmount = input.starterAmount;
        f.flourAmount = input.flourAmount;
        f.waterAmount = input.waterAmount;
        writeAll(list);
        return;
      }
    }
    return;
  }
  await fetch("/api/feedings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteFeeding(id: string): Promise<void> {
  if (_guest) {
    const list = readAll();
    for (const s of list) {
      const i = s.feedings.findIndex((x) => x.id === id);
      if (i >= 0) {
        s.feedings.splice(i, 1);
        writeAll(list);
        return;
      }
    }
    return;
  }
  await fetch(`/api/feedings?id=${id}`, { method: "DELETE" });
}

export async function pauseResume(id: string, action: "pause" | "resume"): Promise<void> {
  if (_guest) {
    const list = readAll();
    const s = list.find((x) => x.id === id);
    if (!s) return;
    const now = new Date().toISOString();
    if (action === "pause") {
      s.isPaused = true;
      s.pausedAt = now;
    } else {
      s.isPaused = false;
      s.pausedAt = null;
      s.resumedAt = now;
    }
    writeAll(list);
    return;
  }
  await fetch(`/api/starters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

// Перенос гостевых заквасок в аккаунт после регистрации/входа.
// Вызывается на главной, когда пользователь уже авторизован.
export async function migrateGuestData(): Promise<void> {
  if (typeof window === "undefined") return;
  const list = readAll();
  if (!list.length) return;

  for (const s of list) {
    const res = await fetch("/api/starters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, flour: s.flour }),
    });
    if (!res.ok) continue;
    const created = await res.json();
    // Кормления переносим от старых к новым, чтобы сохранить порядок.
    const feedings = [...s.feedings].sort((a, b) => a.fedAt.localeCompare(b.fedAt));
    for (const f of feedings) {
      await fetch("/api/feedings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starterId: created.id,
          starterAmount: f.starterAmount,
          flourAmount: f.flourAmount,
          waterAmount: f.waterAmount,
          fedAt: f.fedAt,
        }),
      });
    }
  }

  localStorage.removeItem(KEY);
}
