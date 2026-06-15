import type { MetadataRoute } from "next";

// Файл отдаётся по адресу https://levainlab.ru/sitemap.xml
// Это карта сайта: список главных страниц, которые мы хотим видеть в поиске.
// Яндекс и Google берут его, чтобы быстрее находить и индексировать страницы.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://levainlab.ru";
  const lastModified = new Date();

  return [
    // Главная — приложение-трекер
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    // Бесплатный курс «Первая закваска за 7 дней» (русский)
    { url: `${base}/course`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    // Тот же курс на английском
    { url: `${base}/course/en`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
