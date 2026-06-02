// Данные о времени брожения закваски
//
// Источники:
// [1] The Sourdough Journey — "White, Wheat, or Rye? What is the best flour to feed your starter?"
//     Эксперимент с CO2-датчиком, 20°C, 1:1:1, 36ч наблюдения.
//     https://thesourdoughjourney.com/white-wheat-or-rye-what-is-the-best-flour-to-feed-your-starter/
//
// [2] Ya-Hsuan Hsu et al. — "Comparing fermentation gas production between wheat and apple
//     sourdough starters using the Risograph", Journal of Food Research, 2013.
//     https://www.sciencedirect.com/science/article/abs/pii/S2212429213000333
//
// [3] Weekend Bakery — "Rye sourdough starter in easy steps" + Catchymeals — "Sourdough Starter
//     Feeding Guide: Ratios & Peak Times". Практические таблицы пик-таймов.
//     https://www.weekendbakery.com/posts/rye-sourdough-starter-in-easy-steps/
//     https://catchymeals.com/sourdough-starter-feeding-guide-ratios-peak-times/
//
// Научные обзоры (микробиология и биохимия закваски):
// [4] Arora K. et al. (2021) "Thirty years of knowledge on sourdough fermentation"
//     Trends in Food Science & Technology, 108, 71–83
// [5] De Vuyst L. et al. (2023) "Sourdough production: fermentation strategies, microbial ecology"
//     Critical Reviews in Food Science and Nutrition, 63(15), 2447–2479
// [6] Gänzle M.G. (2014) "Enzymatic and bacterial conversions during sourdough fermentation"
//     Food Microbiology, 37, 2–10
//
// Эмпирические данные: King Arthur Baking (2025), Brod & Taylor, The Bread Code

// --- ОБЩИЕ ДАННЫЕ ---

// Время до пика (часы) при 22°C, 100% гидратации для разных соотношений кормления
// Ржаная ~20-25% быстрее пшеничной [1][3]
const peakTimeAt22: Record<string, Record<number, number>> = {
  wheat: {
    0.1: 1.5, // 1:0.1:0.1 — почти не разбавлена, очень быстро
    0.2: 2,   // 1:0.2:0.2
    0.5: 3.5, // 1:0.5:0.5
    1: 5,     // 1:1:1
    2: 7,     // 1:2:2
    3: 9,     // 1:3:3
    5: 12,    // 1:5:5
    10: 17,   // 1:10:10
  },
  rye: {
    0.1: 1,   // 1:0.1:0.1
    0.2: 1.5, // 1:0.2:0.2
    0.5: 2.5, // 1:0.5:0.5
    1: 3.5,   // 1:1:1
    2: 5,     // 1:2:2
    3: 7,     // 1:3:3
    5: 9,     // 1:5:5
    10: 14,   // 1:10:10
  },
};

// Множитель визуального объёма на пике [1][2][3]
const defaultPeakMultiplier: Record<string, number> = {
  "Пшеничная": 2.8,
  "Ржаная": 2.0,
};

function getFlourProfile(flourType: string): "wheat" | "rye" {
  const lower = flourType.toLowerCase();
  if (lower.includes("ржан")) return "rye";
  return "wheat";
}

// Температурный коэффициент: каждые +5.5°C время сокращается вдвое
function temperatureCoefficient(temp: number): number {
  return Math.pow(0.5, (temp - 22) / 5.5);
}

// Коэффициент гидратации: при 100% = 1.0, густая (50%) — медленнее, жидкая (200%) — быстрее
// (100 / H)^0.35 даёт: H=50% → 1.28, H=100% → 1.0, H=150% → 0.87, H=200% → 0.79
function hydrationCoefficient(hydration: number): number {
  const clamped = Math.max(30, Math.min(300, hydration));
  return Math.pow(100 / clamped, 0.35);
}

// Интерполяция времени до пика по соотношению и типу муки
function interpolatePeakTime(ratio: number, flourType: string): number {
  const profile = getFlourProfile(flourType);
  const data = peakTimeAt22[profile];
  const knownRatios = [0.1, 0.2, 0.5, 1, 2, 3, 5, 10];

  if (ratio <= knownRatios[0]) return data[knownRatios[0]];
  if (ratio >= knownRatios[knownRatios.length - 1]) return data[knownRatios[knownRatios.length - 1]];

  let lower = knownRatios[0], upper = knownRatios[knownRatios.length - 1];
  for (let i = 0; i < knownRatios.length - 1; i++) {
    if (ratio >= knownRatios[i] && ratio <= knownRatios[i + 1]) {
      lower = knownRatios[i];
      upper = knownRatios[i + 1];
      break;
    }
  }

  const t = (ratio - lower) / (upper - lower);
  return data[lower] + t * (data[upper] - data[lower]);
}

// --- ПОЛЬЗОВАТЕЛЬСКИЕ НАБЛЮДЕНИЯ ---

export interface UserObservation {
  ratio: number;
  hydration: number; // % (вода/мука * 100)
  temperature: number;
  flourType: string;
  peakTimeHours: number;
  peakMultiplier: number;
}

// Расчёт на основе пользовательских данных
// Взвешенное среднее по всем наблюдениям: ближние по условиям весят больше
function calculateFromUserData(
  observations: UserObservation[],
  ratio: number,
  hydration: number,
  temperature: number,
  flourType: string
): FermentationResult | null {
  if (observations.length === 0) return null;

  let relevant = observations.filter((o) => o.flourType === flourType);
  if (relevant.length === 0) relevant = observations;

  // Каждое наблюдение нормализуем к целевым условиям и считаем вес
  const estimates: { peakTime: number; multiplier: number; weight: number }[] = [];

  for (const obs of relevant) {
    // Нормализуем к базовым условиям (22°C, 100% гидратации)
    const normalized = obs.peakTimeHours
      / temperatureCoefficient(obs.temperature)
      / hydrationCoefficient(obs.hydration);

    // Корректируем пропорцию через таблицу
    const generalAtObs = interpolatePeakTime(obs.ratio, flourType);
    const generalAtTarget = interpolatePeakTime(ratio, flourType);
    const adjustedBase = normalized * (generalAtTarget / generalAtObs);

    // Применяем целевые условия
    const peakTime = adjustedBase
      * temperatureCoefficient(temperature)
      * hydrationCoefficient(hydration);

    // Вес: обратная дистанция по всем осям (пропорция, температура, гидратация)
    const dRatio = Math.abs(obs.ratio - ratio) / Math.max(ratio, 0.1);
    const dTemp = Math.abs(obs.temperature - temperature) / 10;
    const dHydr = Math.abs(obs.hydration - hydration) / 100;
    const distance = Math.sqrt(dRatio * dRatio + dTemp * dTemp + dHydr * dHydr);
    const weight = 1 / (distance + 0.05); // 0.05 чтобы не делить на 0

    estimates.push({ peakTime, multiplier: obs.peakMultiplier, weight });
  }

  // Взвешенное среднее
  const totalWeight = estimates.reduce((s, e) => s + e.weight, 0);
  const peakTime = estimates.reduce((s, e) => s + e.peakTime * e.weight, 0) / totalWeight;
  const avgMultiplier = estimates.reduce((s, e) => s + e.multiplier * e.weight, 0) / totalWeight;

  return {
    peakTimeHours: peakTime,
    peakMultiplier: avgMultiplier,
    readyAtPercent: 80,
    readyTimeHours: peakTime * 0.75,
    lagPhaseEnd: 0.2,
    plateauStart: 0.8,
    source: "user",
  };
}

export interface FermentationParams {
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  temperature: number;
  flourType: string;
}

export interface FermentationResult {
  peakTimeHours: number;
  peakMultiplier: number;
  readyAtPercent: number;
  readyTimeHours: number;
  lagPhaseEnd: number;
  plateauStart: number;
  source?: "general" | "user";
}

// Основная функция расчёта
// t_пик = t_база(R, мука) × K_темп(T) × K_гидр(H)
export function calculateFermentation(
  params: FermentationParams,
  userObservations?: UserObservation[]
): FermentationResult {
  const { starterAmount, flourAmount, waterAmount, temperature, flourType } = params;

  const ratio = starterAmount > 0 ? flourAmount / starterAmount : 2;
  const clampedRatio = Math.max(0.02, Math.min(15, ratio));
  const hydration = flourAmount > 0 ? (waterAmount / flourAmount) * 100 : 100;

  // Попробовать расчёт по пользовательским данным
  if (userObservations && userObservations.length > 0) {
    const userResult = calculateFromUserData(
      userObservations,
      clampedRatio,
      hydration,
      temperature,
      flourType
    );
    if (userResult) return userResult;
  }

  // Общий расчёт: t_база × K_темп × K_гидр
  const baseTime = interpolatePeakTime(clampedRatio, flourType);
  const peakTime = baseTime * temperatureCoefficient(temperature) * hydrationCoefficient(hydration);
  const multiplier = defaultPeakMultiplier[flourType] ?? 2.4;

  return {
    peakTimeHours: peakTime,
    peakMultiplier: multiplier,
    readyAtPercent: 80,
    readyTimeHours: peakTime * 0.75,
    lagPhaseEnd: 0.2,
    plateauStart: 0.8,
    source: "general",
  };
}

// Рассчитать текущий объём по прошедшему времени
export function getCurrentRise(
  elapsedHours: number,
  result: FermentationResult
): number {
  const { peakTimeHours, peakMultiplier: peak, lagPhaseEnd, plateauStart } = result;
  const totalCycleTime = peakTimeHours * 1.3;

  if (elapsedHours <= 0) return 1;

  const t = elapsedHours / peakTimeHours;

  if (t <= lagPhaseEnd) {
    const progress = t / lagPhaseEnd;
    return 1 + (peak - 1) * 0.05 * progress;
  }

  if (t <= plateauStart) {
    const progress = (t - lagPhaseEnd) / (plateauStart - lagPhaseEnd);
    const s = progress * progress * (3 - 2 * progress);
    return 1 + (peak - 1) * (0.05 + 0.85 * s);
  }

  if (t <= 1) {
    const progress = (t - plateauStart) / (1 - plateauStart);
    return 1 + (peak - 1) * (0.9 + 0.1 * progress);
  }

  if (elapsedHours <= totalCycleTime) {
    const decayProgress = (elapsedHours - peakTimeHours) / (totalCycleTime - peakTimeHours);
    return peak - (peak - 1.2) * decayProgress;
  }

  return 1.2;
}
