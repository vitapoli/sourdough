export type Mood = "happy" | "hungry" | "sleepy" | "new" | "ready" | "peak";

export function getStarterMood(lastFeedingAt: string | null, peakTimeHours?: number, currentTime?: number): {
  mood: Mood;
  label: string;
  message: string;
  hoursAgo: number | null;
} {
  if (!lastFeedingAt) {
    return {
      mood: "new",
      label: "Новенькая",
      message: "Покорми меня в первый раз!",
      hoursAgo: null,
    };
  }

  const hoursAgo = ((currentTime ?? Date.now()) - new Date(lastFeedingAt).getTime()) / (1000 * 60 * 60);

  if (peakTimeHours) {
    const readyTime = peakTimeHours * 0.75;

    // Готова к использованию (от 75% до пика)
    if (hoursAgo >= readyTime && hoursAgo < peakTimeHours) {
      return {
        mood: "ready",
        label: "Готова!",
        message: "Можно использовать в тесто!",
        hoursAgo: Math.round(hoursAgo),
      };
    }

    // На пике (от пика до +30%)
    if (hoursAgo >= peakTimeHours && hoursAgo <= peakTimeHours * 1.3) {
      return {
        mood: "peak",
        label: "На пике!",
        message: "Я на максимуме! Используй меня!",
        hoursAgo: Math.round(hoursAgo),
      };
    }

    // После пика — опадает, пора кормить
    if (hoursAgo > peakTimeHours * 1.3 && hoursAgo < 12) {
      return {
        mood: "hungry",
        label: "Опадает",
        message: "Прошла пик... покорми меня!",
        hoursAgo: Math.round(hoursAgo),
      };
    }
  }

  if (hoursAgo < 12) {
    return {
      mood: "happy",
      label: "Счастливая",
      message: "Я сытая и пузырюсь!",
      hoursAgo: Math.round(hoursAgo),
    };
  }

  return {
    mood: "hungry",
    label: "Голодная",
    message: "Пора бы подкрепиться...",
    hoursAgo: Math.round(hoursAgo),
  };
}

export const moodColors: Record<Mood, string> = {
  happy: "text-green-happy",
  hungry: "text-orange-hungry",
  sleepy: "text-blue-sleepy",
  new: "text-golden",
  ready: "text-green-happy",
  peak: "text-green-happy",
};

export const moodBgColors: Record<Mood, string> = {
  happy: "bg-green-happy",
  hungry: "bg-orange-hungry",
  sleepy: "bg-blue-sleepy",
  new: "bg-golden",
  ready: "bg-green-happy",
  peak: "bg-green-happy",
};
