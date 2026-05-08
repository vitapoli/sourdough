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

// Время до пика (часы) при 22°C для разных соотношений кормления
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
// Пшеничная поднимается выше за счёт глютена
// Ржаная ниже, но визуально обманчива из-за пентозанов
const defaultPeakMultiplier: Record<string, number> = {
  "Пшеничная": 2.8,
  "Ржаная": 2.0,
};

// Маппинг типа муки -> профиль ферментации
function getFlourProfile(flourType: string): "wheat" | "rye" {
  const lower = flourType.toLowerCase();
  if (lower.includes("ржан")) return "rye";
  return "wheat";
}

// Температурный коэффициент: каждые +5.5°C время сокращается вдвое
function temperatureCoefficient(temp: number): number {
  const baseTemp = 22;
  const diff = temp - baseTemp;
  return Math.pow(0.5, diff / 5.5);
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
  temperature: number;
  flourType: string;
  peakTimeHours: number;
  readyTimeHours: number;
  peakMultiplier: number;
}

// Расчёт на основе пользовательских данных
// Ищем ближайшее наблюдение и корректируем по температуре
function calculateFromUserData(
  observations: UserObservation[],
  ratio: number,
  temperature: number,
  flourType: string
): FermentationResult | null {
  if (observations.length === 0) return null;

  // Фильтруем по типу муки
  let relevant = observations.filter((o) => o.flourType === flourType);
  if (relevant.length === 0) relevant = observations;

  // Ищем ближайшее по соотношению
  relevant.sort((a, b) => Math.abs(a.ratio - ratio) - Math.abs(b.ratio - ratio));
  const closest = relevant[0];

  // Нормализуем время к 22°C, потом пересчитываем на нужную температуру
  const closestTempCoeff = temperatureCoefficient(closest.temperature);
  const peakAt22 = closest.peakTimeHours / closestTempCoeff;
  const readyAt22 = closest.readyTimeHours / closestTempCoeff;

  // Корректировка по разнице в соотношении
  const ratioDiff = ratio / closest.ratio;
  const adjustedPeakAt22 = peakAt22 * Math.pow(ratioDiff, 0.7);
  const adjustedReadyAt22 = readyAt22 * Math.pow(ratioDiff, 0.7);

  // Применяем целевую температуру
  const targetTempCoeff = temperatureCoefficient(temperature);
  const peakTime = adjustedPeakAt22 * targetTempCoeff;
  const readyTime = adjustedReadyAt22 * targetTempCoeff;

  // Среднее значение множителя из наблюдений той же муки
  const sameFlourObs = observations.filter((o) => o.flourType === flourType);
  const avgMultiplier =
    sameFlourObs.length > 0
      ? sameFlourObs.reduce((s, o) => s + o.peakMultiplier, 0) / sameFlourObs.length
      : closest.peakMultiplier;

  return {
    peakTimeHours: peakTime,
    peakMultiplier: avgMultiplier,
    readyAtPercent: 80,
    readyTimeHours: readyTime,
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

// Расчёт по общим данным
export function calculateFermentation(
  params: FermentationParams,
  userObservations?: UserObservation[]
): FermentationResult {
  const { starterAmount, flourAmount, temperature, flourType } = params;

  const ratio = starterAmount > 0 ? flourAmount / starterAmount : 2;
  const clampedRatio = Math.max(0.02, Math.min(15, ratio));

  // Попробовать расчёт по пользовательским данным
  if (userObservations && userObservations.length > 0) {
    const userResult = calculateFromUserData(
      userObservations,
      clampedRatio,
      temperature,
      flourType
    );
    if (userResult) return userResult;
  }

  // Общий расчёт
  const baseTime = interpolatePeakTime(clampedRatio, flourType);
  const tempCoeff = temperatureCoefficient(temperature);
  const peakTime = baseTime * tempCoeff;
  const profile = getFlourProfile(flourType);
  const multiplier = defaultPeakMultiplier[flourType] || (profile === "rye" ? 2.0 : 2.8);

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
