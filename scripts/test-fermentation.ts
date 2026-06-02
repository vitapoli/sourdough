import {
  calculateFermentation,
  type UserObservation,
} from "../src/lib/fermentation";

// --- Тестовые наблюдения ---

const wheat4obs: UserObservation[] = [
  { ratio: 1, hydration: 100, temperature: 24, flourType: "Пшеничная", peakTimeHours: 4, peakMultiplier: 2.5 },
  { ratio: 1, hydration: 100, temperature: 22, flourType: "Пшеничная", peakTimeHours: 5, peakMultiplier: 2.5 },
  { ratio: 2, hydration: 100, temperature: 24, flourType: "Пшеничная", peakTimeHours: 5.5, peakMultiplier: 2.8 },
  { ratio: 2, hydration: 100, temperature: 28, flourType: "Пшеничная", peakTimeHours: 3, peakMultiplier: 2.7 },
];

const rye3obs: UserObservation[] = [
  { ratio: 1, hydration: 100, temperature: 25, flourType: "Ржаная", peakTimeHours: 2.5, peakMultiplier: 1.8 },
  { ratio: 1, hydration: 100, temperature: 22, flourType: "Ржаная", peakTimeHours: 3.5, peakMultiplier: 2.0 },
  { ratio: 3, hydration: 100, temperature: 25, flourType: "Ржаная", peakTimeHours: 5, peakMultiplier: 1.9 },
];

const extremeObs: UserObservation[] = [
  { ratio: 5, hydration: 100, temperature: 18, flourType: "Пшеничная", peakTimeHours: 18, peakMultiplier: 2.0 },
  { ratio: 0.5, hydration: 100, temperature: 30, flourType: "Пшеничная", peakTimeHours: 1, peakMultiplier: 2.5 },
];

const singleObs: UserObservation[] = [
  { ratio: 1, hydration: 100, temperature: 24, flourType: "Пшеничная", peakTimeHours: 4.5, peakMultiplier: 2.5 },
];

// Набор 5 — разная гидратация
const hydrationObs: UserObservation[] = [
  { ratio: 1, hydration: 100, temperature: 22, flourType: "Пшеничная", peakTimeHours: 5, peakMultiplier: 2.5 },
  { ratio: 1, hydration: 60, temperature: 22, flourType: "Пшеничная", peakTimeHours: 6.5, peakMultiplier: 2.8 },
  { ratio: 1, hydration: 150, temperature: 22, flourType: "Пшеничная", peakTimeHours: 4, peakMultiplier: 2.3 },
];

// --- Тесты ---

const tests = [
  // Набор 1: пшеничная, 4 наблюдения, гидратация 100%
  { name: "Пшеничная 1:1:1 26°C (4 набл.)", s: 50, f: 50, w: 50, temp: 26, type: "Пшеничная", obs: wheat4obs, expect: "~3.3 ч" },
  { name: "Пшеничная 1:1:1 22°C (точное)", s: 50, f: 50, w: 50, temp: 22, type: "Пшеничная", obs: wheat4obs, expect: "~5 ч" },
  { name: "Пшеничная 1:2:2 22°C", s: 50, f: 100, w: 100, temp: 22, type: "Пшеничная", obs: wheat4obs, expect: "~6.5-7 ч" },

  // Набор 2: ржаная
  { name: "Ржаная 1:2:2 25°C", s: 50, f: 100, w: 100, temp: 25, type: "Ржаная", obs: rye3obs, expect: "~3.5 ч" },
  { name: "Ржаная 1:1:1 28°C", s: 50, f: 50, w: 50, temp: 28, type: "Ржаная", obs: rye3obs, expect: "~1.8 ч" },

  // Набор 3: крайние значения
  { name: "Пшеничная 1:10:10 18°C (экстрем.)", s: 10, f: 100, w: 100, temp: 18, type: "Пшеничная", obs: extremeObs, expect: "~25 ч" },

  // Набор 4: одно наблюдение
  { name: "Пшеничная 1:3:3 20°C (1 набл.)", s: 30, f: 90, w: 90, temp: 20, type: "Пшеничная", obs: singleObs, expect: "экстраполяция" },

  // Набор 5: влияние гидратации
  { name: "Гидр. 100%: 1:1:1 22°C", s: 50, f: 50, w: 50, temp: 22, type: "Пшеничная", obs: hydrationObs, expect: "~5 ч" },
  { name: "Гидр. 60%: 1:1:0.6 22°C", s: 50, f: 50, w: 30, temp: 22, type: "Пшеничная", obs: hydrationObs, expect: "~6.5 ч (густая, медленнее)" },
  { name: "Гидр. 150%: 1:1:1.5 22°C", s: 50, f: 50, w: 75, temp: 22, type: "Пшеничная", obs: hydrationObs, expect: "~4 ч (жидкая, быстрее)" },
  { name: "Гидр. 60% 28°C (густая+жара)", s: 50, f: 50, w: 30, temp: 28, type: "Пшеничная", obs: hydrationObs, expect: "~3 ч" },

  // Без наблюдений — общий расчёт
  { name: "Общий: пшеничная 1:1:1 26°C", s: 50, f: 50, w: 50, temp: 26, type: "Пшеничная", obs: [], expect: "~3 ч" },
  { name: "Общий: гидр. 60% 1:1:0.6 22°C", s: 50, f: 50, w: 30, temp: 22, type: "Пшеничная", obs: [], expect: "~6.4 ч" },
  { name: "Общий: гидр. 150% 1:1:1.5 22°C", s: 50, f: 50, w: 75, temp: 22, type: "Пшеничная", obs: [], expect: "~4.3 ч" },
];

for (const t of tests) {
  const result = calculateFermentation(
    { starterAmount: t.s, flourAmount: t.f, waterAmount: t.w, temperature: t.temp, flourType: t.type },
    t.obs.length > 0 ? t.obs : undefined
  );
  const hydration = t.f > 0 ? Math.round((t.w / t.f) * 100) : 100;
  const src = result.source === "user" ? "польз." : "общий";
  console.log(
    `${t.name} | гидр: ${hydration}% | пик: ${result.peakTimeHours.toFixed(2)} ч | готова: ${result.readyTimeHours.toFixed(2)} ч | x${result.peakMultiplier.toFixed(1)} | ${src} | ожид: ${t.expect}`
  );
}
