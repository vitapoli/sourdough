"use client";

type IconName =
  | "jar"
  | "scales"
  | "bread"
  | "drop"
  | "wheat"
  | "leaven"
  | "flour-bag"
  | "timer"
  | "thermometer"
  | "notebook"
  | "spoon"
  | "back"
  | "trash"
  | "recipe-page"
  | "camera"
  | "calculator"
  | "calculator-classic"
  | "close"
  | "pencil"
  | "pin"
  | "bookmark"
  | "bookmark-fill"
  | "eye-off"
  | "eye"
  | "community"
  | "heart"
  | "heart-fill"
  | "comment"
  | "save"
  | "search"
  | "globe";

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
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" stroke="none">
      {/* Стебель */}
      <rect x="15" y="18" width="2" height="12" rx="1" />
      {/* Верхний лист */}
      <path d="M16 4 C14 7 14 10 16 12 C18 10 18 7 16 4z" />
      {/* Левые листья */}
      <path d="M8 8 C10 10 12 11 16 12 C14 9 11 7 8 8z" />
      <path d="M6 14 C9 15 12 15 16 15 C13 13 9 12 6 14z" />
      <path d="M7 20 C10 20 13 19 16 18 C13 17 10 17 7 20z" />
      {/* Правые листья */}
      <path d="M24 8 C22 10 20 11 16 12 C18 9 21 7 24 8z" />
      <path d="M26 14 C23 15 20 15 16 15 C19 13 23 12 26 14z" />
      <path d="M25 20 C22 20 19 19 16 18 C19 17 22 17 25 20z" />
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
  "recipe-page": (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Лист с загнутым уголком */}
      <path d="M7 4h12l6 6v18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4z" />
      <path d="M19 4v6h6" />
      {/* Линии текста */}
      <path d="M11 14h10" opacity="0.6" />
      <path d="M11 18h10" opacity="0.6" />
      <path d="M11 22h6" opacity="0.4" />
    </svg>
  ),
  trash: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h20M12 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M26 8l-1.5 18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2L6 8" />
      <path d="M13 14v8M19 14v8" />
    </svg>
  ),
  camera: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a2 2 0 0 1 2-2h3l2-3h10l2 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V11z" />
      <circle cx="16" cy="17" r="5" />
      <circle cx="16" cy="17" r="2" opacity="0.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  calculator: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Стакан */}
      <path d="M9 6 h14 l-2 22 H11 L9 6z" />
      {/* Деления */}
      <path d="M12 12 h8" opacity="0.4" />
      <path d="M12 17 h8" opacity="0.4" />
      <path d="M13 22 h6" opacity="0.4" />
      {/* Жидкость */}
      <path d="M12 17 l-0.5 7 h9 l-0.5-7z" fill="currentColor" opacity="0.15" stroke="none" />
    </svg>
  ),
  "calculator-classic": (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Корпус */}
      <rect x="7" y="4" width="18" height="24" rx="2" />
      {/* Экран */}
      <rect x="10" y="7" width="12" height="5" rx="1" opacity="0.3" fill="currentColor" stroke="none" />
      {/* Кнопки */}
      <rect x="10" y="15" width="3" height="3" rx="0.5" />
      <rect x="14.5" y="15" width="3" height="3" rx="0.5" />
      <rect x="19" y="15" width="3" height="3" rx="0.5" />
      <rect x="10" y="21" width="3" height="3" rx="0.5" />
      <rect x="14.5" y="21" width="3" height="3" rx="0.5" />
      <rect x="19" y="21" width="3" height="3" rx="0.5" />
    </svg>
  ),
  leaven: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Два параллельных стебля */}
      <path d="M14.5 30V17" />
      <path d="M17.5 30V17" />
      {/* Нижняя пара зёрен */}
      <path d="M14.5 20C8 18 8 12 14.5 10" />
      <path d="M17.5 20C24 18 24 12 17.5 10" />
      {/* Верхняя пара зёрен */}
      <path d="M14.5 12C10 10.5 10 6.5 14.5 5.5" />
      <path d="M17.5 12C22 10.5 22 6.5 17.5 5.5" />
      {/* Верхушка */}
      <path d="M14.5 5.5L16 2" />
      <path d="M17.5 5.5L16 2" />
    </svg>
  ),
  close: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8l16 16M24 8L8 24" />
    </svg>
  ),
  pin: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22L6 28" />
      <path d="M19 4l9 9-4 1-5 5-1 4-9-9 4-1 5-5z" />
    </svg>
  ),
  pencil: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Корпус карандаша */}
      <path d="M19.5 5.5l7 7L11 28H4v-7L19.5 5.5z" />
      {/* Разделитель ластика */}
      <path d="M16 9l7 7" />
    </svg>
  ),
  bookmark: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h16v24l-8-5-8 5V4z" />
    </svg>
  ),
  "bookmark-fill": (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h16v24l-8-5-8 5V4z" />
    </svg>
  ),
  "eye-off": (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l20 20" />
      <path d="M10.6 10.6A12.5 12.5 0 0 0 3 16c2.7 5 7.2 8 13 8 2.1 0 4-.5 5.7-1.3" />
      <path d="M16 8c5.8 0 10.3 3 13 8-.8 1.5-1.8 2.8-3 3.8" />
      <path d="M19.4 19.4A4 4 0 0 1 12.6 12.6" />
    </svg>
  ),
  eye: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16c2.7-5 7.2-8 13-8s10.3 3 13 8c-2.7 5-7.2 8-13 8s-10.3-3-13-8z" />
      <circle cx="16" cy="16" r="4" />
    </svg>
  ),
  // Сообщество — два человечка
  community: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="4" />
      <path d="M4 26c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      <circle cx="22" cy="10" r="3" />
      <path d="M22 18c3.3 0 6 2.7 6 6" />
    </svg>
  ),
  // Сердце — пустое
  heart: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 28S4 20 4 12a6 6 0 0 1 12 0 6 6 0 0 1 12 0c0 8-12 16-12 16z" />
    </svg>
  ),
  // Сердце — заполненное
  "heart-fill": (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 28S4 20 4 12a6 6 0 0 1 12 0 6 6 0 0 1 12 0c0 8-12 16-12 16z" />
    </svg>
  ),
  // Комментарий — облачко
  comment: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h24a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H10l-6 4V8a2 2 0 0 1 2-2z" />
    </svg>
  ),
  // Сохранить — стрелка вниз в лоток
  save: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4v16M10 14l6 6 6-6" />
      <path d="M4 22v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4" />
    </svg>
  ),
  // Поиск — лупа
  search: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="8" />
      <path d="M20 20l7 7" />
    </svg>
  ),
  // Глобус — индикатор публичного рецепта
  globe: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="12" />
      <path d="M4 16h24" />
      <path d="M16 4c4 4 6 8 6 12s-2 8-6 12c-4-4-6-8-6-12s2-8 6-12" />
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
