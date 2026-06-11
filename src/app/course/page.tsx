"use client";

import { useState, useEffect } from "react";

const DAYS = [
  { num: 1, title: "Знакомство", ready: true },
  { num: 2, title: "Наблюдаем", ready: true },
  { num: 3, title: "Закваска оживает", ready: true },
  { num: 4, title: "На что смотреть", ready: true },
  { num: 5, title: "Набирает силу", ready: true },
  { num: 6, title: "Проверяем готовность", ready: true },
  { num: 7, title: "Что дальше", ready: true },
];

const DAY_COMPONENTS: Record<number, () => React.ReactNode> = {
  1: () => <Day1 />,
  2: () => <Day2 />,
  3: () => <Day3 />,
  4: () => <Day4 />,
  5: () => <Day5 />,
  6: () => <Day6 />,
  7: () => <Day7 />,
};

export default function CoursePage() {
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const day = Math.min(Math.max(Number(params.get("day")) || 1, 1), 7);
    setCurrentDay(day);
  }, []);

  function goToDay(day: number) {
    setCurrentDay(day);
    window.history.replaceState(null, "", `/course?day=${day}`);
    window.scrollTo(0, 0);
  }

  const DayContent = DAY_COMPONENTS[currentDay];

  return (
    <div className="min-h-screen bg-cream">
      {/* Шапка */}
      <header className="pt-8 pb-6 px-4 text-center max-w-2xl mx-auto">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <a href="/login" className="text-sm text-brown-light hover:text-terracotta transition-colors">Levain Lab</a>
          <a
            href={`/course/en?day=${currentDay}`}
            className="text-sm font-bold text-brown-light hover:text-terracotta transition-colors"
          >
            EN
          </a>
        </div>
        <h1 className="text-3xl font-extrabold text-brown-dark mt-3 leading-tight">
          Первая закваска
          <br />
          <span className="text-terracotta">за 7 дней</span>
        </h1>
        <p className="text-brown-light mt-2 text-sm max-w-md mx-auto">
          Бесплатный мини-курс для начинающих. Один урок в день — и через
          неделю у тебя будет своя живая закваска.
        </p>
      </header>

      {/* Прогресс-бар по дням */}
      <nav className="px-4 pb-6 max-w-2xl mx-auto">
        <div className="flex gap-1.5 justify-center flex-wrap">
          {DAYS.map((day) =>
            day.ready ? (
              <button
                key={day.num}
                onClick={() => goToDay(day.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  day.num === currentDay
                    ? "bg-terracotta text-white ring-2 ring-terracotta/30 ring-offset-2"
                    : "bg-terracotta/70 text-white hover:bg-terracotta"
                }`}
              >
                <span>{day.num}</span>
                <span className="hidden sm:inline">· {day.title}</span>
              </button>
            ) : (
              <div
                key={day.num}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-warm-beige/60 text-brown-light"
              >
                <span>{day.num}</span>
                <span className="hidden sm:inline">· {day.title}</span>
              </div>
            )
          )}
        </div>
      </nav>

      {/* Контент выбранного дня */}
      <main className="px-4 pb-16 max-w-2xl mx-auto">
        {DayContent ? (
          <article className="course-content bg-card rounded-2xl card-shadow p-5 sm:p-8">
            <DayContent />
          </article>
        ) : (
          <div className="text-center py-12">
            <div className="px-5 py-3 rounded-xl bg-warm-beige/40 text-brown-light text-sm">
              День {currentDay} будет доступен скоро
            </div>
          </div>
        )}

        {/* Навигация вперёд/назад */}
        <div className="flex justify-center gap-3 mt-8">
          {currentDay > 1 && (
            <button
              onClick={() => goToDay(currentDay - 1)}
              className="px-5 py-3 rounded-xl bg-warm-beige/60 text-brown text-sm font-bold hover:bg-warm-beige transition-colors"
            >
              ← День {currentDay - 1}
            </button>
          )}
          {currentDay < 7 && DAYS[currentDay]?.ready ? (
            <button
              onClick={() => goToDay(currentDay + 1)}
              className="px-5 py-3 rounded-xl bg-terracotta text-white text-sm font-bold hover:bg-terracotta-light transition-colors"
            >
              День {currentDay + 1} →
            </button>
          ) : currentDay < 7 ? (
            <div className="px-5 py-3 rounded-xl bg-warm-beige/40 text-brown-light text-sm">
              День {currentDay + 1} будет доступен скоро
            </div>
          ) : null}
        </div>
      </main>

      {/* Подвал */}
      <footer className="text-center pb-8 px-4">
        <p className="text-xs text-brown-light/60">
          Levain Lab · Мини-курс «Первая закваска за 7 дней»
        </p>
      </footer>
    </div>
  );
}

/* ========== UI-компоненты ========== */

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`mb-8 last:mb-0 ${className}`}>{children}</section>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-extrabold text-brown-dark mb-3">{children}</h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-brown mb-2">{children}</h3>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-golden/10 border-l-3 border-golden rounded-r-lg p-3 my-4 text-sm text-brown">
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        className="mt-0.5 w-5 h-5 rounded border-2 border-warm-beige accent-terracotta flex-shrink-0"
      />
      <span className="text-sm text-brown group-has-checked:line-through group-has-checked:text-brown-light transition-colors">
        {children}
      </span>
    </label>
  );
}

function Details({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group my-4">
      <summary className="cursor-pointer text-sm font-bold text-terracotta hover:text-terracotta-light transition-colors list-none flex items-center gap-1.5">
        <span className="text-xs transition-transform group-open:rotate-90">▶</span>
        {title}
      </summary>
      <div className="mt-3 pl-4 border-l-2 border-warm-beige text-sm text-brown leading-relaxed">
        {children}
      </div>
    </details>
  );
}

function PhotoGallery({ images, priority = false }: { images: { src: string; alt: string }[]; priority?: boolean }) {
  return (
    <div className={`my-4 grid gap-2 ${images.length === 1 ? '' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          className="rounded-xl w-full h-auto object-cover aspect-square"
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
          width={400}
          height={400}
          decoding={priority ? "sync" : "async"}
        />
      ))}
    </div>
  );
}

/* ========== Контент Дня 1 ========== */

function Day1() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 1</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Знакомство: что мы будем делать и зачем
        </h2>
      </div>

      {/* Крючок — результат */}
      <Section>
        <PhotoGallery priority images={[
          { src: "/course/IMG_2232.webp", alt: "Хлеб на закваске с сыром" },
          { src: "/course/EFBD9C7D-66B7-4D2B-8D3D-059F0F23B6E3.webp", alt: "Буль на закваске" },
          { src: "/course/IMG_4807.webp", alt: "Разрез хлеба на закваске" },
        ]} />
        <p className="text-brown text-sm leading-relaxed">
          Через 5-7 дней у тебя будет своя закваска — живой организм, который
          может жить годами и давать невероятный хлеб. Всё, что нужно — мука,
          вода и немного терпения.
        </p>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Каждый день — один короткий урок и одно простое действие. Сегодня
          подготовим всё необходимое и сделаем первый замес.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что понадобится — сразу к делу */}
      <Section>
        <H2>Что понадобится</H2>

        <H3>Мука</H3>
        <p className="text-brown text-sm leading-relaxed mb-2">
          Для старта лучше <strong>ржаная и пшеничная цельнозерновая</strong>{" "}
          (или обойная ржаная) мука. Почему именно она:
        </p>
        <ul className="space-y-1 mb-3 text-sm text-brown list-disc pl-5">
          <li>
            В цельнозерновой муке сохранены оболочка и зародыш зерна — именно
            там живут ферменты, которые расщепляют крахмал в еду для
            бактерий.
          </li>
          <li>
            Ржаная мука содержит больше «еды» для микроорганизмов — она
            запускает ферментацию быстрее и прощает ошибки.
          </li>
        </ul>

        <H3>Вода</H3>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Обычная вода из-под крана или фильтрованная. Температура — комнатная,
          21-25°C.
        </p>

        <H3>Банка</H3>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Сосуд объёмом с пластиковый стаканчик, желательно ровные стенки и
          наличие предмета, которым можно прикрыть горлышко.
        </p>

        <H3>Крышка</H3>
        <p className="text-brown text-sm leading-relaxed">
          Накрыть, но <strong>не закручивать</strong>! В процессе брожения
          выделяется газ, ему нужно куда-то выходить. Можно положить крышку
          сверху не закручивая, накрыть блюдцем или плотной тканью с резинкой.
        </p>

        <PhotoGallery images={[
          { src: "/course/IMG_4774.webp", alt: "Закваска в банке — пузыри и подъём" },
          { src: "/course/IMG_1778.webp", alt: "Закваска в стеклянной баночке" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Где поставить */}
      <Section>
        <H2>Где поставить банку</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>Температура 21-26°C</strong> — тёплое место на кухне.
          </li>
          <li>
            <strong>Не у батареи</strong> — нагрев с одной стороны создаёт
            неравномерную среду.
          </li>
          <li>
            <strong>Не на подоконнике</strong> — перепады температуры днём/ночью
            замедляют процесс.
          </li>
          <li>
            <strong>Не под прямыми лучами</strong> — может начать подсыхать,
            может перегреться.
          </li>
        </ul>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Первый замес */}
      <Section>
        <H2>Делаем первый замес</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Два варианта — выбирай, какой ближе:
        </p>

        {/* Интуитивный */}
        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>
            Вариант 1: интуитивный (без весов) — рекомендую!
          </H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Налей в банку воду — примерно рюмку (30-50 мл)</li>
            <li>Добавь столовую ложку ржаной цельнозерновой муки</li>
            <li>
              Досыпь пшеничную муку, помешивая, до консистенции{" "}
              <strong>густого теста на оладьи</strong> — прям густого, ложка
              стоит, но масса ещё пластичная
            </li>
            <li>Хорошо перемешай, чтобы не было комочков</li>
            <li>Накрой (не закручивай!) и поставь в тёплое место</li>
          </ol>
          <PhotoGallery images={[
            { src: "/course/IMG_4686.webp", alt: "Хлеб на закваске — результат" },
            { src: "/course/IMG_6618.webp", alt: "Буль на крафтовой бумаге" },
            { src: "/course/IMG_9006.webp", alt: "Зелёный хлеб в разрезе" },
          ]} />
          <Tip>
            Почему без весов? Так ты учишься чувствовать закваску — её
            консистенцию, запах, поведение. Это пригодится потом, когда будешь
            печь хлеб.
          </Tip>
        </div>

        {/* С весами */}
        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>Вариант 2: с весами (точные пропорции)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>
              На весах отмерь <strong>50 г воды</strong> комнатной температуры
            </li>
            <li>
              Добавь <strong>5 г ржаной цельнозерновой</strong> +{" "}
              <strong>45 г пшеничной</strong> 1 сорта (или 50 г чисто ржаной
              цельнозерновой)
            </li>
            <li>Перемешай до однородности</li>
            <li>Накрой и поставь в тёплое место</li>
          </ol>
          <p className="text-xs text-brown-light mt-3">
            Это закваска 100% влажности — соотношение муки и воды 1:1 по весу.
          </p>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что будет происходить */}
      <Section>
        <H2>Что будет происходить</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          В ближайшие 24-48 часов внутри банки начнётся настоящая борьба за
          территорию. На муке живут десятки видов микроорганизмов. Когда ты
          добавляешь воду, ферменты активируются и начинают расщеплять крахмал
          на сахара — и на эти сахара сбегаются все «жители».
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          На этом этапе может появиться странный запах. Это нормально — это
          временные «гости», которых потом вытеснят молочнокислые бактерии.
        </p>
        <div className="bg-terracotta/8 rounded-xl p-4 text-sm text-brown font-medium">
          <strong>Твоя задача на сегодня:</strong> замесить и забыть до завтра.
          Серьёзно — не надо открывать, мешать и проверять каждый час. Просто дай
          микроорганизмам время.
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Купить ржаную и (или) пшеничную цельнозерновую муку</CheckItem>
          <CheckItem>Подготовить банку и крышку</CheckItem>
          <CheckItem>Сделать первый замес</CheckItem>
          <CheckItem>Поставить в тёплое место (21-26°C)</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Теория — сворачиваемые блоки */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Необязательно для начала, но полезно для понимания процесса
        </p>

        <Details title="Что такое закваска с точки зрения науки">
          <p className="mb-3">
            Закваска — это мука и вода, в которых поселились два вида
            микроорганизмов:
          </p>
          <p className="mb-2">
            🔸 <strong>Дрожжи</strong> — поднимают тесто. Они едят простые
            сахара из муки и выделяют углекислый газ.
          </p>
          <p className="mb-3">
            🔸 <strong>Молочнокислые бактерии (МКБ)</strong> — отвечают за вкус
            и сохранность. Они производят молочную и уксусную кислоты — отсюда
            характерная кислинка и устойчивость к плесени.
          </p>
          <p>
            Эти два вида живут в симбиозе: бактерии создают кислую среду, которая
            убивает всё «плохое», а дрожжи делятся с бактериями витаминами и
            аминокислотами.
          </p>
        </Details>

        <Details title="Почему закваска лучше магазинных дрожжей">
          <p className="mb-3">
            Магазинные дрожжи — это один штамм (Saccharomyces cerevisiae),
            заточенный под скорость. А в закваске — целое сообщество. Что это
            даёт:
          </p>
          <p className="mb-2">
            <strong>Вкус и аромат.</strong> Бактерии и дрожжи вместе производят
            десятки ароматических соединений. При выпечке остаточные сахара
            участвуют в реакции Майяра — она даёт корочке золотистый цвет и тот
            самый «хлебный» запах.
          </p>
          <p className="mb-2">
            <strong>Хранение.</strong> Кислая среда — естественный консервант.
            Хлеб на закваске хранится в разы дольше без плесени.
          </p>
          <p>
            <strong>Усвоение.</strong> Длительное брожение расщепляет сложные
            соединения в муке. Белки легче усваиваются, высвобождаются витамины
            группы B, снижается гликемический индекс.
          </p>
        </Details>

        <Details title="Зачем нужна именно цельнозерновая мука">
          <p>
            В цельнозерновой муке сохранены оболочка и зародыш зерна — именно
            там живут ферменты (амилазы), которые расщепляют крахмал в еду для
            бактерий. В белой муке высшего сорта эти части удалены, поэтому
            ферментация стартует медленнее и менее стабильно.
          </p>
        </Details>
      </Section>

    </>
  );
}

/* ========== Контент Дня 2 ========== */

function Day2() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 2</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Наблюдаем
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Прошло 24ч. Сегодня главное — не паниковать.
        </p>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Закваски ведут себя по-разному: одни уже бурлят через 24 часа, другие
          ещё молчат. Оба варианта — ок. Важно добавлять в кормления
          цельнозерновую муку, ведь в ней содержится больше ферментов (амилаз),
          расщепляющих крахмал на мальтозу — то, чем питаются дрожжи и
          большинство молочнокислых (некоторые МКБ сами вырабатывают ферменты для
          расщепления крахмала — амилопуллуланазы).
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что ты можешь увидеть */}
      <Section>
        <H2>Что ты можешь увидеть</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Есть пузырьки и подъём</H3>
            <p className="text-brown text-sm leading-relaxed">
              Отлично! Это значит, что микроорганизмы уже начали работать. Масса
              могла немного подняться, на поверхности или по стенкам видны мелкие
              пузырьки.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Ничего не происходит</H3>
            <p className="text-brown text-sm leading-relaxed">
              Тоже нормально. Некоторым закваскам нужно больше времени — до 48
              часов. Причины: чуть прохладнее на кухне, другая мука. Не трогай
              банку — просто подожди ещё сутки.
            </p>
          </div>
        </div>

        <Tip>
          Если через 48 часов всё ещё тишина — переставь банку в место потеплее
          (25-28°C), добавь немного цельнозерновой муки и подожди ещё день.
          Активность обязательно появится. Если нет — пиши, разберёмся!
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Про запах */}
      <Section>
        <H2>Про запах</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Открой банку и понюхай. Скорее всего, запах будет{" "}
          <strong>странным</strong> — непривычным, может быть неприятным. Это
          абсолютно нормально.
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Сейчас внутри банки идёт <strong>фаза хаоса</strong>: размножается всё
          подряд. Среда ещё нейтральная, и хорошие бактерии пока не набрали силу.
        </p>
        <p className="text-brown text-sm leading-relaxed">
          Через пару дней молочнокислые бактерии начнут вырабатывать кислоту,
          среда станет кислой — и все плохие соседи погибнут. Это естественный
          процесс.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что делать */}
      <Section>
        <H2>Что делать сегодня</H2>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Если есть активность (пузырьки, подъём)</H3>

          <div className="bg-cream/50 rounded-lg p-3 mb-3">
            <p className="text-xs font-bold text-terracotta mb-2">БЕЗ ВЕСОВ (ИНТУИТИВНЫЙ)</p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>Убери из банки примерно половину массы (НУЖНО выбросить)</li>
              <li>Добавь столовую ложку муки (ржаная + пшеничная, как вчера)</li>
              <li>Добавь воды до прежней консистенции — густое тесто на оладьи</li>
              <li>Перемешай и накрой</li>
            </ol>
          </div>

          <div className="bg-cream/50 rounded-lg p-3">
            <p className="text-xs font-bold text-brown-light mb-2">С ВЕСАМИ</p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>Оставь в банке 20-25 г закваски, остальное убери</li>
              <li>Добавь 50 г воды комнатной температуры</li>
              <li>Добавь 50 г муки (можно 5 г ржаной цельнозерновой + 45 г пшеничной)</li>
              <li>Перемешай и накрой</li>
            </ol>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Температура */}
      <Section>
        <H2>Напоминание: температура</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>24-26°C</strong> — мезофильные бактерии активно размножаются
            и дают мягкую молочную кислоту.
          </li>
          <li>
            <strong>При 20°C</strong> — процесс замедляется, фаза хаоса
            затягивается до 4-5 дней вместо двух.
          </li>
          <li>
            <strong>Выше 30°C</strong> — начинают доминировать другие бактерии,
            вырабатывающие больше уксусной кислоты. Закваска будет резче.
          </li>
        </ul>
        <Tip>
          Не ставь банку у батареи или на подоконнике. Нужна стабильная
          температура без скачков. Кухонный стол, полка шкафа — отличные варианты.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Открыть банку, посмотреть и понюхать</CheckItem>
          <CheckItem>Есть пузырьки — покормить (убрать половину + мука + вода)</CheckItem>
          <CheckItem>Нет активности — оставить ещё на сутки</CheckItem>
          <CheckItem>Проверить температуру в месте, где стоит банка</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хочу знать больше */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Для любопытных — что на самом деле происходит внутри банки
        </p>

        <Details title="Три фазы жизни закваски">
          <p className="mb-2">
            <strong>Фаза 1 (день 1-2): хаос.</strong> Размножается всё подряд.
            Среда ещё нейтральная (pH около 6). Именно поэтому запах может быть
            неприятным.
          </p>
          <p className="mb-2">
            <strong>Фаза 2 (день 3-5): набор кислотности.</strong> Молочнокислые
            бактерии начинают доминировать. Они выделяют кислоту, pH падает до
            4.5 — плохие бактерии не выживают.
          </p>
          <p>
            <strong>Фаза 3 (день 5-7): стабильное сообщество.</strong> Дрожжи и
            МКБ находят баланс.
          </p>
        </Details>

        <Details title="Почему дрожжи и бактерии не конкурируют">
          <p>
            Закваска — это сложная экосистема из множества видов дрожжей и
            молочнокислых бактерий, которые не конкурируют, так как бактерии
            предпочитают мальтозу, а дрожжи — глюкозу, часто выделяемую самими
            бактериями. Этот симбиоз укрепляется тем, что бактерии питаются
            аминокислотами дрожжей, а вырабатываемая ими кислота защищает всю
            микрофлору от опасных микробов.
          </p>
        </Details>

        <Details title="Почему температура так важна">
          <p className="mb-2">
            <strong>21-25°C:</strong> мягкая молочная кислота, деликатная кислинка.
          </p>
          <p className="mb-2">
            <strong>30-35°C:</strong> больше уксусной кислоты, хлеб будет резче и
            кислее.
          </p>
          <p>
            <strong>38-42°C:</strong> термофильные бактерии берут верх, дрожжи
            угнетены. Так делают КМКЗ — ржаную закваску с ярким ароматом алычи,
            но она не может поднять тесто. Если интересно про КМКЗ — пишите,
            расскажу подробнее.
          </p>
        </Details>
      </Section>
    </>
  );
}

/* ========== Контент Дня 3 ========== */

function Day3() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 3</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Закваска оживает
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Прошли ещё 24ч. Сегодня закваска уже должна показывать активность —
          больше пузырьков, заметный подъём и более резкий запах.
        </p>
        <PhotoGallery priority images={[
          { src: "/course/day-3-1.webp", alt: "Активная закваска на 3 день — пузырьки и подъём" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что ты можешь увидеть */}
      <Section>
        <H2>Что ты можешь увидеть</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Активность хорошая (так и должно быть)</H3>
            <p className="text-brown text-sm leading-relaxed">
              Видны пузырьки — мелкие по всему объёму и покрупнее на поверхности.
              За последние 24 часа закваска поднялась примерно в{" "}
              <strong>1,5–2 раза</strong>. Это отличный знак: дрожжи и
              молочнокислые бактерии активно работают, питаются мальтозой из муки
              и выделяют газ.
            </p>
            <p className="text-brown text-sm leading-relaxed mt-2">
              Закваска могла опасть к моменту, когда ты смотришь, — тоже
              нормально. Она успела съесть всю еду и осесть, проголодавшись.
              Сейчас отмечать подъёмы резинкой нет необходимости.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Активность есть, но слабая</H3>
            <p className="text-brown text-sm leading-relaxed">
              Пузырьков немного, подъём небольшой. Тоже нормально — закваски
              развиваются с разной скоростью, многое зависит от муки и
              температуры. Просто продолжаем кормить, активность нарастёт за
              следующие дни.
            </p>
          </div>

          <div className="bg-cream/60 rounded-xl p-4 border border-warm-beige">
            <H3>Признаков нет вообще</H3>
            <p className="text-brown text-sm leading-relaxed mb-2">
              Если совсем нет ни пузырьков, ни запаха, ни малейшего движения —
              почти всегда дело в температуре, ей прохладно. Действуем так же,
              как в уроке 2:
            </p>
            <ol className="space-y-1.5 text-sm text-brown list-decimal pl-5">
              <li>
                Переставь банку в место <strong>потеплее, 25–28°C</strong>
              </li>
              <li>
                Добавь немного <strong>цельнозерновой (ржаной) муки</strong> — в
                ней больше ферментов и «диких» микроорганизмов, она разгоняет
                процесс
              </li>
              <li>
                Можно сделать закваску <strong>чуть жиже</strong> — в более
                жидкой среде дрожжи развиваются быстрее
              </li>
              <li>Подожди ещё сутки</li>
            </ol>
            <p className="text-brown text-sm leading-relaxed mt-2">
              Активность обязательно появится. Если и через день полная тишина —
              пиши, разберёмся вместе.
            </p>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Про запах */}
      <Section>
        <H2>Про запах</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Открой банку и понюхай. Сегодня запах стал{" "}
          <strong>сильнее и резче</strong>. Это абсолютно нормально.
        </p>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Почему так происходит: молочнокислые бактерии{" "}
          <strong>активно вырабатывают кислоту</strong> — но среда ещё не
          закислилась до конца. Кислотность пока не дошла до уровня (примерно{" "}
          <strong>pH 4.5 и ниже</strong>), при котором погибают «плохие»
          бактерии. Поэтому они ещё здесь — и дают тот самый неприятный запах.
        </p>
        <p className="text-brown text-sm leading-relaxed">
          В ближайшие 1–2 дня кислоты станет больше, pH опустится ниже ~4.5 в
          сторону 3.5–4.0 — лишние микробы погибнут, а дрожжи и молочнокислые
          бактерии, наоборот, чувствуют себя в кислоте прекрасно. Тогда запах и
          сменится на приятный, кисломолочный, иногда с фруктовыми нотками.
          Сегодняшняя резкость — нормальный этап на этом пути.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что делать */}
      <Section>
        <H2>Что делать сегодня: второе кормление</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Кормим так же, как вчера.
        </p>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Без весов (интуитивный)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Убери из банки примерно половину массы (выбросить)</li>
            <li>Добавь столовую ложку муки (ржаная + пшеничная, как раньше)</li>
            <li>Добавь воды до прежней консистенции — густое тесто на оладьи</li>
            <li>Перемешай и накрой (не закручивай!)</li>
          </ol>
        </div>

        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>С весами</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Оставь в банке 20–25 г закваски, остальное убери</li>
            <li>Добавь 50 г воды комнатной температуры</li>
            <li>
              Добавь 50 г муки (можно 5 г ржаной цельнозерновой + 45 г пшеничной)
            </li>
            <li>Перемешай и накрой</li>
          </ol>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Температура */}
      <Section>
        <H2>Напоминание: температура</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>24–26°C</strong> — мезофильные бактерии активно размножаются
            и дают мягкую молочную кислоту.
          </li>
          <li>
            <strong>При 20°C</strong> — процесс замедляется, всё растягивается на
            лишние дни.
          </li>
          <li>
            <strong>Выше 30°C</strong> — начинают доминировать другие бактерии,
            вырабатывающие больше уксусной кислоты, закваска будет резче и кислее.
          </li>
        </ul>
        <Tip>
          Не ставь банку у батареи или на подоконнике. Нужна стабильная
          температура без скачков. Кухонный стол, полка шкафа — отличные варианты.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Открыть банку, посмотреть и понюхать</CheckItem>
          <CheckItem>Оценить подъём за сутки (в идеале 1,5–2 раза) и пузырьки</CheckItem>
          <CheckItem>Покормить: убрать половину + мука + вода</CheckItem>
          <CheckItem>Нет признаков — потеплее (25–28°C) + цельнозерновая мука + чуть жиже, ждём сутки</CheckItem>
          <CheckItem>Проверить температуру в месте, где стоит банка</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хочу знать больше */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Для любопытных — что на самом деле происходит внутри банки
        </p>

        <Details title="Чем измеряют кислотность">
          <p>
            Кислотность закваски и теста описывают двумя независимыми
            параметрами: активной кислотностью (pH) и титруемой кислотностью (TTA
            / градусы). Они отображают принципиально разные вещи: pH показывает
            «силу» (концентрацию свободных ионов водорода прямо сейчас), а TTA —
            «количество» (общий запас накопленных кислот). Подробнее про
            активность ферментов, липкость теста и измерение кислотности — в
            канале{" "}
            <a
              href="https://t.me/levainlab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta font-bold hover:underline"
            >
              @levainlab
            </a>
            .
          </p>
        </Details>

        <Details title="Почему запах сейчас резкий">
          <p>
            В первые дни среда была почти нейтральной, и запах давали случайные
            «временные жители». Сейчас идёт фаза нарастания кислотности:
            молочнокислые бактерии (особенно гетероферментативные) вырабатывают
            не только молочную, но и уксусную кислоту, спирт и углекислый газ.
            Отсюда кисло-уксусные и спиртовые ноты. Но кислоты пока недостаточно,
            чтобы убрать «лишних» соседей, — поэтому запах ещё смешанный и
            неприятный. Когда кислотность дорастёт до нужного уровня (см. ниже) и
            лишние микробы погибнут, запах станет приятным.
          </p>
        </Details>

        <Details title="Почему «плохие» бактерии погибают именно при такой кислотности">
          <p className="mb-3">
            Молочнокислые бактерии вырабатывают молочную и уксусную кислоты, и pH
            среды падает с почти нейтрального (~6) до 3.8–4.0. Для большинства
            болезнетворных и гнилостных бактерий это смертельно: расти они могут
            примерно до pH 4.0–5.0, а ниже — нет. Условная граница безопасности в
            пищевой науке — <strong>pH 4.6</strong>: ниже неё не растёт даже
            ботулотоксиновая палочка <em>Clostridium botulinum</em>, самый
            опасный пищевой микроб. Поэтому продукты с pH ниже 4.6 считаются
            «высококислотными» и безопасными.
          </p>
          <p className="mb-3">
            Но дело не только в самом числе pH. Главное оружие —{" "}
            <strong>сами кислоты в неионизированной (целой) форме</strong>. Такая
            молекула жирорастворима и легко проходит сквозь оболочку бактерии
            внутрь. А внутри клетки среда нейтральная — там кислота распадается и
            выбрасывает ион водорода (H⁺), закисляя нутро бактерии. Клетка
            вынуждена тратить всю энергию на откачку этих ионов, её ферменты
            глохнут — и она перестаёт расти и гибнет. Чем ниже pH вокруг, тем
            больше кислоты именно в этой «проникающей» форме — вот почему
            закисление работает как нарастающий пресс.
          </p>
          <p>
            А дрожжи и молочнокислые бактерии к кислоте приспособлены (они сами её
            и создают) — поэтому в этой среде они процветают, а конкуренты
            вымирают. Так закваска сама себя «обеззараживает».
          </p>
        </Details>

        <Details title="Зачем убирать половину перед каждым кормлением">
          <p>
            Чтобы не копить кучу закваски, ведь чем больше её объём, тем больше
            нужно еды. Для выведения достаточно поддерживать объём закваски
            70–100 г.
          </p>
        </Details>
      </Section>

      <Section>
        <p className="text-brown-light text-xs italic text-center">
          Завтра — третье кормление и наблюдаем, как закваска набирает силу.
          Позже подключим приложение-трекер, чтобы вести историю кормлений и не
          забывать про них.
        </p>
      </Section>
    </>
  );
}

/* ========== Контент Дня 4 ========== */

function Day4() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 4</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          На что смотреть
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Прошли ещё 24ч. Закваска потихоньку набирает силу, а запах из резкого
          начинает превращаться в приятный (но может и нет).
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что ты можешь увидеть */}
      <Section>
        <H2>Что ты можешь увидеть</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Активность уверенная</H3>
            <p className="text-brown text-sm leading-relaxed">
              Пузырьки по всему объёму, закваска заметно поднимается после
              кормления. Значит, сообщество дрожжей и бактерий становится крепче.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Активность стала меньше, как так?</H3>
            <p className="text-brown text-sm leading-relaxed">
              Вот вчера так активничала, а сегодня — подъём небольшой, пузырьков
              немного. Два варианта: долго стояла «голодной» и кислоты накопилось
              много — бактерии могли замедлиться, или в помещении упала
              температура. Выходы: кормить чаще / убрать в тепло.
            </p>
          </div>

          <div className="bg-cream/60 rounded-xl p-4 border border-warm-beige">
            <H3>Тихо</H3>
            <p className="text-brown text-sm leading-relaxed">
              Если за сутки никакого движения — почти всегда дело в холоде.
              Действуем как раньше: переставить в место потеплее (25–28°C),
              добавить чуть больше ржаной цельнозерновой, можно сделать пожиже.
              Ждём ещё сутки.
            </p>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Про запах */}
      <Section>
        <H2>Про запах</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Сегодня запах уже может качнуться в приятную сторону — кисломолочную,
          иногда с фруктовыми или яблочными нотками. Это знак, что кислоты
          накопилось достаточно: среда закислилась, и «лишние» микробы из первых
          дней уступили место дрожжам и молочнокислым бактериям.
        </p>
        <p className="text-brown text-sm leading-relaxed">
          Если запах ещё резковатый — не страшно. У некоторых заквасок этот
          переход занимает на день-два больше. Кормление и тепло всё сделают.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что делать */}
      <Section>
        <H2>Что делать сегодня</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Кормим так же, как вчера — менять схему не нужно.
        </p>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Без весов (интуитивный)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Убери из банки примерно половину массы (выбросить)</li>
            <li>Добавь столовую ложку муки (ржаная + пшеничная, как раньше)</li>
            <li>Добавь воды до прежней консистенции — густое тесто на оладьи</li>
            <li>Перемешай и накрой (не закручивай!)</li>
          </ol>
        </div>

        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>С весами</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Оставь в банке 20–25 г закваски, остальное убери</li>
            <li>Добавь 50 г воды комнатной температуры</li>
            <li>
              Добавь 50 г муки (можно 5 г ржаной цельнозерновой + 45 г пшеничной)
            </li>
            <li>Перемешай и накрой</li>
          </ol>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* На что обращать внимание */}
      <Section>
        <H2>На что обращать внимание в ближайшие дни</H2>
        <ul className="space-y-2 text-sm text-brown">
          <li>
            <strong>Насколько поднимается.</strong> Сильная закваска
            удваивается. Пока может подниматься в 1,5 раза — это нормальный этап.
          </li>
          <li>
            <strong>За сколько часов.</strong> Засекай примерное время до
            максимума. С каждым днём оно будет сокращаться — это и есть «набор
            силы».
          </li>
          <li>
            <strong>Стабильность.</strong> Хорошо, когда изо дня в день картина
            повторяется и улучшается, а не скачет туда-сюда.
          </li>
        </ul>
        <Tip>
          Не страшно, если закваска уже опала к моменту, когда ты смотришь, —
          просто в следующий раз корми пораньше.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Открыть банку, посмотреть и понюхать</CheckItem>
          <CheckItem>Покормить: убрать половину + мука + вода</CheckItem>
          <CheckItem>Заметить, насколько и за сколько часов поднимается</CheckItem>
          <CheckItem>Проверить, что температура ровная, без скачков</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хочу знать больше */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Для любопытных — что на самом деле происходит внутри банки
        </p>

        <Details title="Почему важно «поймать пик»">
          <p>
            Пик — это момент, когда закваска поднялась максимально, но ещё не
            начала опадать. В этой точке дрожжей больше всего, и они полны сил —
            именно на пике закваску потом добавляют в тесто. Если упустить и дать
            осесть, закваска проголодается и ослабнет: газа меньше, кислоты
            больше.
          </p>
        </Details>

        <Details title="Как кислотность влияет на силу подъёма">
          <p>
            Кислота — друг закваски, но в меру. Лёгкое закисление защищает от
            плесени и помогает дрожжам. Но если закваску долго не кормить, кислоты
            копится слишком много, и она начинает угнетать сами дрожжи и МКБ —
            подъём слабеет. Поэтому регулярное кормление (с выбросом половины) —
            это не только «еда», но и способ держать кислотность под контролем.
            Интересно про действие кислоты на бактерии? Ещё больше в канале{" "}
            <a
              href="https://t.me/levainlab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta font-bold hover:underline"
            >
              @levainlab
            </a>
            .
          </p>
        </Details>
      </Section>

      <Section>
        <p className="text-brown-light text-xs italic text-center">
          Завтра — переход закваски на новый уровень, начало правления МКБ и
          дрожжей. Скоро подключим приложение-трекер, чтобы фиксировать подъёмы и
          не держать всё в голове.
        </p>
      </Section>
    </>
  );
}

/* ========== Контент Дня 5 ========== */

function Day5() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 5</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Набирает силу
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Пятый день. Если всё идёт по плану, закваска бодро поднимается после
          кормления, вся в пузырьках, а запах из резкого превратился в приятный
          кисломолочный. Если ещё не совсем — не переживай, дай ей пару дней,
          всё придёт.
        </p>
        <PhotoGallery priority images={[
          { src: "/course/day-5-1.webp", alt: "Плетёная хала на закваске с кунжутом" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что ты можешь увидеть */}
      <Section>
        <H2>Что ты можешь увидеть</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>Уверенный подъём — почти у цели</H3>
            <p className="text-brown text-sm leading-relaxed">
              Закваска поднимается в <strong>1,5–2 раза</strong> за несколько
              часов после кормления, по всему объёму равномерные пузырьки,
              структура воздушная. Это значит, что сообщество дрожжей и бактерий
              устоялось.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>Активность есть, но до удвоения не дотягивает</H3>
            <p className="text-brown text-sm leading-relaxed">
              Поднимается, но скромно, пузырьки есть, но негусто. Тоже рабочий
              вариант — просто твоей закваске нужно чуть больше времени. У кого-то
              всё созревает за 5 дней, у кого-то за 7–10. Продолжай кормить в том
              же режиме, можно добавлять чуть больше цельнозерновой (ржаной) муки
              — она разгоняет процесс.
            </p>
          </div>

          <div className="bg-cream/60 rounded-xl p-4 border border-warm-beige">
            <H3>Совсем слабо или тихо</H3>
            <p className="text-brown text-sm leading-relaxed">
              Если к пятому дню активность так и не появилась — почти всегда это
              холод или слишком редкие кормления. Поставь в место потеплее
              (25–28°C), корми вовремя (осела — снова корми), добавляй ржаную
              цельнозерновую. Закваска оживёт, ей просто нужны комфортные условия.
            </p>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Про запах */}
      <Section>
        <H2>Про запах</H2>
        <p className="text-brown text-sm leading-relaxed">
          К этому дню запах обычно уже приятный — кисломолочный, как у йогурта
          или кефира, иногда с фруктовыми, яблочными или даже чуть пивными
          нотками. Это знак зрелости: среда закислилась, лишние микробы первых
          дней ушли, остались только дрожжи и молочнокислые.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что делать */}
      <Section>
        <H2>Что делать сегодня</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Кормим всё так же — стабильность сейчас важнее всего.
        </p>

        <div className="bg-terracotta/5 rounded-xl p-4 mb-4">
          <H3>Без весов (интуитивный)</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Убери из банки примерно половину массы (выбросить)</li>
            <li>Добавь столовую ложку муки (ржаная + пшеничная, как раньше)</li>
            <li>Добавь воды до прежней консистенции — густое тесто на оладьи</li>
            <li>Перемешай и накрой (не закручивай!)</li>
          </ol>
        </div>

        <div className="bg-warm-beige/30 rounded-xl p-4">
          <H3>С весами</H3>
          <ol className="space-y-2 text-sm text-brown list-decimal pl-5">
            <li>Оставь в банке 20–25 г закваски, остальное убери</li>
            <li>Добавь 50 г воды комнатной температуры</li>
            <li>
              Добавь 50 г муки (можно 5 г ржаной цельнозерновой + 45 г пшеничной)
            </li>
            <li>Перемешай и накрой</li>
          </ol>
        </div>

        <Tip>
          Можешь начать вести закваску в{" "}
          <a href="https://levainlab.ru/" className="text-terracotta font-bold hover:underline">приложении-трекере</a>
          : дай ей имя, отмечай кормления — так проще не забывать и видеть, как
          она крепнет день ото дня.
        </Tip>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Открыть банку, посмотреть и понюхать</CheckItem>
          <CheckItem>Оценить подъём: в идеале 1,5–2 раза за несколько часов</CheckItem>
          <CheckItem>Покормить: убрать половину + мука + вода</CheckItem>
          <CheckItem>Запах приятный кисломолочный? — отличный знак зрелости</CheckItem>
          <CheckItem>По желанию — завести закваску в <a href="https://levainlab.ru/" className="text-terracotta font-bold hover:underline">приложении</a> и отметить кормление</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хочу знать больше */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Для любопытных — что на самом деле происходит внутри банки
        </p>

        <Details title="Фаза 3: стабильное сообщество">
          <p>
            Первые дни были хаосом, потом — нарастание кислотности. Теперь
            закваска вошла в третью фазу: дрожжи и молочнокислые бактерии нашли
            баланс и живут в устойчивом симбиозе. Состав этого сообщества зависит
            от муки, воды, температуры и даже твоей кухни — поэтому двух
            одинаковых заквасок не бывает, у каждой свой характер и вкус.
          </p>
        </Details>

        <Details title="Почему закваска может жить годами">
          <p>
            Зрелая закваска — это самоподдерживающаяся экосистема. Пока её кормят,
            она живёт: ей не страшны ни переезды, ни передача другу, ни долгий
            отпуск (об этом — в дне 7). Известны закваски, которым десятки и даже
            сотни лет. Твоя только начинает свою историю.
          </p>
        </Details>

        <Details title="Сколько ещё ждать готовности">
          <p>
            Готовность — это не «по календарю», а «по поведению». Закваска готова
            печь хлеб, когда стабильно удваивается за 4–8 часов после кормления
            (соотношение 1:1:1). У большинства это происходит к 6–7 дню. Завтра
            как раз проверим по чётким признакам.
          </p>
        </Details>
      </Section>

      <Section>
        <p className="text-brown-light text-xs italic text-center">
          Завтра — проверяем, готова ли закваска печь хлеб: четыре признака.
        </p>
      </Section>
    </>
  );
}

/* ========== Контент Дня 6 ========== */

function Day6() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 6</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Проверяем готовность
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Шестой день. Самое время проверить, готова ли закваска поднимать
          тесто. Сегодня покорми её утром и зафиксируй кормление в{" "}
          <a href="https://levainlab.ru/" className="text-terracotta font-bold hover:underline">трекере</a>{" "}
          — через несколько часов вернёмся и оценим.
        </p>
        <PhotoGallery priority images={[
          { src: "/course/day-6-1.webp", alt: "Ржаной хлеб на закваске в разрезе с семечками" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Четыре признака */}
      <Section>
        <H2>Четыре признака готовности</H2>
        <p className="text-brown text-sm leading-relaxed mb-4">
          Закваска готова к выпечке, когда выполняются все четыре пункта (или
          хотя бы первые три).
        </p>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>1. Удваивается за 4–8 часов</H3>
            <p className="text-brown text-sm leading-relaxed">
              После кормления отметь уровень — резинкой на банке или маркером.
              Если за 4–8 часов закваска поднялась <strong>в 2 раза</strong> —
              дрожжей достаточно, чтобы поднять тесто. Это главный признак.
            </p>
          </div>

          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>2. Пузыри по всему объёму</H3>
            <p className="text-brown text-sm leading-relaxed">
              Посмотри на банку сбоку через стекло: внутри должна быть
              пузырчатая, губчатая структура — не только сверху, а по всей массе.
              Значит, газ образуется активно и равномерно.
            </p>
          </div>

          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>3. Приятный запах</H3>
            <p className="text-brown text-sm leading-relaxed">
              Кисломолочный, йогуртовый, иногда с фруктовыми нотками. Никакой
              тухлости и резкого ацетона. Запах — показатель здоровой микрофлоры.
            </p>
          </div>

          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>4. Float-тест (для пшеничной)</H3>
            <p className="text-brown text-sm leading-relaxed">
              Зачерпни чайную ложку закваски на пике и опусти в стакан с водой.
              Всплыла и держится на поверхности — внутри много газа, закваска
              готова. Утонула — ещё рано (или ты зачерпнул уже после пика, когда
              газ вышел).
            </p>
          </div>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Лови пик */}
      <Section>
        <H2>Лови пик</H2>
        <p className="text-brown text-sm leading-relaxed">
          Все проверки делаем на пике — в момент, когда закваска поднялась
          максимально, но ещё не начала опадать. На пике дрожжей больше всего и
          они полны сил. Если закваска уже осела — газ вышел, float-тест
          провалится, хотя сама закваска в порядке. Просто покорми снова и поймай
          пик в следующий раз.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Что делать */}
      <Section>
        <H2>Что делать сегодня</H2>
        <p className="text-brown text-sm leading-relaxed">
          Покорми утром (как обычно) и засеки время. Через 4–8 часов вернись и
          пройди по четырём признакам.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Если не готова */}
      <Section>
        <H2>Если не готова — это нормально</H2>
        <div className="bg-terracotta/8 rounded-xl p-4 text-sm text-brown leading-relaxed">
          Не удвоилась? Пузырей маловато? Float-тест утонул? Ничего страшного.
          Некоторым закваскам нужно больше времени — зависит от муки,
          температуры, твоей кухни. Просто продолжай кормить ещё 1–2 дня (можно
          дважды в день, если тепло), и сила придёт. Готовность определяется
          поведением, а не номером дня.
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Покормить утром и зафиксировать в трекере, отметить уровень на банке</CheckItem>
          <CheckItem>Через 4–8 часов проверить подъём (в идеале ×2)</CheckItem>
          <CheckItem>Посмотреть на пузыри через стекло</CheckItem>
          <CheckItem>Понюхать — приятный кисломолочный?</CheckItem>
          <CheckItem>Не готова — кормим ещё день-два, без паники</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      <Section>
        <p className="text-brown-light text-xs italic text-center">
          Завтра — финал: закваска готова! Разберёмся, как её хранить, чтобы не
          кормить каждый день, и что испечь первым.
        </p>
      </Section>
    </>
  );
}

/* ========== Контент Дня 7 ========== */

function Day7() {
  return (
    <>
      {/* Заголовок */}
      <div className="mb-6">
        <div className="text-xs font-bold text-terracotta mb-1">ДЕНЬ 7</div>
        <h2 className="text-2xl font-extrabold text-brown-dark leading-tight">
          Закваска готова! Что дальше
        </h2>
      </div>

      {/* Вступление */}
      <Section>
        <p className="text-brown text-sm leading-relaxed">
          Поздравляю — у тебя получилось! Теперь на твоей кухне живёт настоящая
          закваска: живой организм, который при минимальном уходе может жить
          годами и кормить тебя хлебом. Осталось решить главное — как её хранить,
          чтобы это было удобно именно тебе.
        </p>
        <PhotoGallery priority images={[
          { src: "/course/day-7-1.webp", alt: "Многозлаковый хлеб на закваске в разрезе" },
          { src: "/course/day-7-2.webp", alt: "Подовый хлеб на закваске с семечками" },
          { src: "/course/day-7-3.webp", alt: "Хлеб на закваске в разрезе" },
        ]} />
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хранение */}
      <Section>
        <H2>Два режима хранения</H2>

        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl p-4">
            <H3>На столе (комнатная температура)</H3>
            <p className="text-brown text-sm leading-relaxed">
              Закваска стоит на кухне, ты кормишь её каждые 12–24 часа. Всегда
              наготове — захотел испечь, взял и испёк. Подходит тем, кто печёт{" "}
              <strong>2+ раза в неделю</strong>. Минус — кормить нужно регулярно.
            </p>
          </div>

          <div className="bg-warm-beige/30 rounded-xl p-4">
            <H3>В холодильнике</H3>
            <p className="text-brown text-sm leading-relaxed">
              Покормил, дал немного подняться — и в холодильник. На холоде
              закваска «засыпает», её достаточно кормить{" "}
              <strong>раз в неделю</strong>. Перед выпечкой достаёшь, кормишь, и
              за 6–12 часов в тепле она просыпается и набирает силу. Идеально для
              тех, кто печёт по выходным. Это самый частый домашний режим.
            </p>
          </div>

        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Остатки */}
      <Section>
        <H2>Что делать с остатками</H2>
        <p className="text-brown text-sm leading-relaxed mb-3">
          Каждое кормление <strong>при выведении</strong> мы обязательно
          выбрасываем половину, но когда закваска уже <strong>готова</strong> —
          это не обязательно. Из «лишней» закваски получаются:
        </p>
        <ul className="space-y-1 text-sm text-brown list-disc pl-5">
          <li><strong>панкейки и оладьи</strong> — просто добавь в тесто;</li>
          <li><strong>лепёшки и тонкий лаваш</strong> на сковороде;</li>
          <li><strong>крекеры</strong> — раскатать тонко, посолить, запечь;</li>
          <li><strong>ржаной хлеб</strong> — ржаному тесту нужна высокая кислотность, так что остатки закваски можно смело добавлять в него.</li>
        </ul>
        <p className="text-brown text-sm leading-relaxed mt-3">
          Подробные рецепты будут позже — а пока просто знай, что ничего не
          пропадает.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Имя */}
      <Section>
        <H2>Дай закваске имя</H2>
        <p className="text-brown text-sm leading-relaxed">
          Звучит несерьёзно, но это работает: с именем за закваской ухаживают
          охотнее и реже забывают покормить. Заведи её в{" "}
          <a href="https://levainlab.ru/" className="text-terracotta font-bold hover:underline">приложении-трекере</a>{" "}
          — дай имя, отмечай кормления, следи за настроением и подъёмом.
          Приложение сохранит всю историю, а рецептами ты сможешь поделиться.
        </p>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Чек-лист */}
      <Section>
        <H2>Чек-лист дня</H2>
        <div className="space-y-1">
          <CheckItem>Выбрать режим хранения (стол или холодильник)</CheckItem>
          <CheckItem>Покормить по выбранному режиму</CheckItem>
          <CheckItem>По желанию — попробовать остатки: панкейки или лепёшки</CheckItem>
          <CheckItem>Завести закваску в приложении и дать ей имя</CheckItem>
        </div>
      </Section>

      <hr className="border-warm-beige my-6" />

      {/* Хочу знать больше */}
      <Section>
        <H2>Хочу знать больше</H2>
        <p className="text-brown-light text-xs mb-3">
          Для любопытных — что на самом деле происходит внутри банки
        </p>

        <Details title="Почему на холоде можно кормить раз в неделю">
          <p>
            Холод замедляет всё: дрожжи и бактерии переходят в «спящий» режим,
            медленнее едят и медленнее производят кислоту. Поэтому в холодильнике
            закваска неделю обходится без еды и не перекисает. При комнатной
            температуре те же процессы идут в разы быстрее — отсюда и
            необходимость кормить каждый день.
          </p>
        </Details>

        <Details title="Можно ли уехать в отпуск">
          <p>
            Да. Я оставляла свою закваску в холоде больше месяца — и всё с ней
            прекрасно. Закваску можно оживить даже из остатков, так что этот
            организм достаточно живуч.
          </p>
        </Details>

        <Details title="Что испечь первым">
          <p>
            Первый хлеб лучше делать из пшеничной муки с небольшим процентом
            цельнозерновой — он прощает ошибки. Не гонись за идеальными «ушами» и
            крупными дырками: первая буханка почти всегда скромная, и это
            нормально. Главное — ты сам вырастил то, что её подняло. Рецепт первого
            хлеба разберём в следующих материалах.
          </p>
        </Details>
      </Section>

      <Section>
        <p className="text-brown-light text-xs italic text-center">
          Это финал мини-курса — но начало твоей истории с закваской. Веди её в
          приложении, заглядывай в канал{" "}
          <a
            href="https://t.me/levainlab"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta font-bold hover:underline"
          >
            @levainlab
          </a>{" "}
          за рецептами и наукой и обязательно испеки свой первый хлеб!
        </p>
      </Section>
    </>
  );
}
