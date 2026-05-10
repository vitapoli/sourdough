"use client";

type IconName =
  | "jar"
  | "scales"
  | "bread"
  | "drop"
  | "wheat"
  | "flour-bag"
  | "timer"
  | "thermometer"
  | "notebook"
  | "spoon"
  | "back"
  | "trash";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const icons: Record<IconName, (size: number) => React.ReactElement> = {
  // Баночка с пузырьками — таб "Трекер"
  jar: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Крышка */}
      <rect x="10" y="4" width="12" height="4" rx="2" />
      {/* Горлышко */}
      <path d="M11 8 v2 M21 8 v2" />
      {/* Тело банки */}
      <path d="M9 10 h14 c1 0 2 1 2 2 v14 c0 2-1 3-3 3 H10 c-2 0-3-1-3-3 V12 c0-1 1-2 2-2z" />
      {/* Пузырьки */}
      <circle cx="13" cy="20" r="1.5" fill="currentColor" opacity="0.3" stroke="none" />
      <circle cx="18" cy="22" r="1" fill="currentColor" opacity="0.25" stroke="none" />
      <circle cx="15" cy="17" r="1" fill="currentColor" opacity="0.2" stroke="none" />
    </svg>
  ),

  // Весы — таб "Калькулятор"
  scales: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Основание */}
      <path d="M10 28 h12" />
      <path d="M16 28 V10" />
      {/* Перекладина */}
      <path d="M6 12 h20" />
      {/* Чашки */}
      <path d="M4 12 l2 8 h6 l2-8" />
      <path d="M18 12 l2 8 h6 l2-8" />
      {/* Зёрнышко на перекладине */}
      <ellipse cx="16" cy="8" rx="2" ry="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" />
    </svg>
  ),

  // Круглый хлеб с надрезами — таб "Рецепты"
  bread: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Буль */}
      <ellipse cx="16" cy="17" rx="11" ry="10" />
      {/* Надрезы (score marks) */}
      <path d="M11 13 c2 3 4 5 7 6" opacity="0.7" />
      <path d="M13 10 c2 4 5 7 8 8" opacity="0.7" />
      <path d="M16 9 c1 3 4 6 6 7" opacity="0.7" />
      {/* Пар */}
      <path d="M13 6 c0-2 2-2 2-4" opacity="0.4" />
      <path d="M17 5 c0-2 2-2 2-4" opacity="0.4" />
    </svg>
  ),

  // Капля воды — гидратация
  drop: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4 C16 4 8 14 8 20 c0 4.4 3.6 8 8 8 s8-3.6 8-8 C24 14 16 4 16 4z" />
      {/* Блик */}
      <path d="M12 19 c0-2 2-5 4-7" opacity="0.4" strokeWidth="1.5" />
    </svg>
  ),

  // Колосок — закваска %
  wheat: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Стебель */}
      <path d="M16 28 V12" />
      {/* Зёрна */}
      <path d="M16 12 c-3-1-5-4-4-6 c2 0 4 2 4 6" />
      <path d="M16 12 c3-1 5-4 4-6 c-2 0-4 2-4 6" />
      <path d="M16 16 c-3-1-5-4-4-6 c2 0 4 2 4 6" />
      <path d="M16 16 c3-1 5-4 4-6 c-2 0-4 2-4 6" />
      <path d="M16 20 c-3-1-5-4-4-6 c2 0 4 2 4 6" />
      <path d="M16 20 c3-1 5-4 4-6 c-2 0-4 2-4 6" />
      {/* Верхушка */}
      <path d="M16 12 c0-3-1-5 0-7" />
    </svg>
  ),

  // Мешочек муки с ложкой — кормление
  "flour-bag": (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Мешок */}
      <path d="M8 12 h12 l2 16 H6 l2-16z" />
      {/* Завязка */}
      <path d="M10 12 c0-4 2-6 4-6 s4 2 4 6" />
      <path d="M9 12 h10" />
      {/* Крестик на мешке */}
      <path d="M12 20 l4 4 M16 20 l-4 4" opacity="0.5" />
      {/* Ложка */}
      <path d="M22 6 c2 0 4 1 4 3 s-2 3-4 3" />
      <path d="M22 12 v14" />
    </svg>
  ),

  // Кухонный таймер
  timer: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Корпус */}
      <circle cx="16" cy="18" r="10" />
      {/* Верхушка */}
      <path d="M13 6 h6" />
      <path d="M16 6 v2" />
      {/* Кнопка */}
      <path d="M24 10 l2-2" />
      {/* Стрелки */}
      <path d="M16 18 V13" />
      <path d="M16 18 l4 3" opacity="0.6" />
      {/* Точка центра */}
      <circle cx="16" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),

  // Термометр-колосок
  thermometer: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Корпус */}
      <path d="M14 6 h4 v16 c2 1 4 3 4 5 a6 6 0 1 1-12 0 c0-2 2-4 4-5 V6z" />
      {/* Ртуть */}
      <path d="M16 24 V14" strokeWidth="3" opacity="0.4" />
      {/* Шкала */}
      <path d="M19 10 h2 M19 14 h2 M19 18 h2" opacity="0.5" strokeWidth="1.5" />
      {/* Листик сверху */}
      <path d="M16 6 c-2-2-4-2-4-4 c2 0 4 2 4 4" opacity="0.6" />
    </svg>
  ),

  // Блокнот с колоском — журнал
  notebook: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Обложка */}
      <rect x="7" y="4" width="18" height="24" rx="2" />
      {/* Корешок */}
      <path d="M7 4 v24" strokeWidth="3" />
      {/* Строки */}
      <path d="M12 10 h9 M12 14 h9 M12 18 h6" opacity="0.4" />
      {/* Колосок на обложке */}
      <path d="M21 22 v-4 c-1-0.5-2-1.5-1.5-2.5 c0.5 0 1.5 1 1.5 2.5 c1-0.5 2-1.5 1.5-2.5 c-0.5 0-1.5 1-1.5 2.5" opacity="0.6" />
    </svg>
  ),

  // Деревянная ложка
  spoon: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Ручка */}
      <path d="M10 28 L18 16" strokeWidth="2.5" />
      {/* Чашечка */}
      <ellipse cx="21" cy="11" rx="5" ry="6" />
      <ellipse cx="21" cy="11" rx="3" ry="4" opacity="0.3" />
    </svg>
  ),

  // Стрелка назад
  back: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 L10 16 L20 26" />
    </svg>
  ),
  trash: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h20M12 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M26 8l-1.5 18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2L6 8" />
      <path d="M13 14v8M19 14v8" />
    </svg>
  ),
};

export function Icon({ name, size = 24, className = "" }: IconProps) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {icons[name](size)}
    </span>
  );
}
