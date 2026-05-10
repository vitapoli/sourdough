export type Mood = "happy" | "hungry" | "new" | "ready" | "peak";

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

    const fedDuration = readyTime * 0.2;         // длительность статуса "покормлена"
    const readyDuration = fedDuration / 3;         // длительность статуса "готова" после пика

    // Только что покормлена
    if (hoursAgo < fedDuration) {
      return {
        mood: "happy",
        label: "Покормлена",
        message: "Только покормили, работаю!",
        hoursAgo,
      };
    }

    // Готова к использованию (от readyTime до пика)
    if (hoursAgo >= readyTime && hoursAgo < peakTimeHours) {
      return {
        mood: "ready",
        label: "Готова!",
        message: "Можно использовать в тесто!",
        hoursAgo,
      };
    }

    // На пике (от пика до пик + readyDuration)
    if (hoursAgo >= peakTimeHours && hoursAgo <= peakTimeHours + readyDuration) {
      return {
        mood: "peak",
        label: "На пике!",
        message: "Я на максимуме! Используй меня!",
        hoursAgo,
      };
    }

    // После пика — опадает, пора кормить
    if (hoursAgo > peakTimeHours + readyDuration) {
      return {
        mood: "hungry",
        label: "Опадает",
        message: "Прошла пик... покорми меня!",
        hoursAgo,
      };
    }
  }

  if (hoursAgo < 12) {
    return {
      mood: "happy",
      label: "Счастливая",
      message: "Я сытая и пузырюсь!",
      hoursAgo,
    };
  }

  return {
    mood: "hungry",
    label: "Голодная",
    message: "Пора бы подкрепиться...",
    hoursAgo,
  };
}

export const moodColors: Record<Mood, string> = {
  happy: "text-green-happy",
  hungry: "text-orange-hungry",
  new: "text-golden",
  ready: "text-green-happy",
  peak: "text-green-happy",
};

export const moodBgColors: Record<Mood, string> = {
  happy: "bg-green-happy",
  hungry: "bg-orange-hungry",
  new: "bg-golden",
  ready: "bg-green-happy",
  peak: "bg-green-happy",
};
