import type { MetadataRoute } from "next";

// Файл отдаётся по адресу https://levainlab.ru/robots.txt
// Он говорит поисковым роботам, какие страницы можно обходить, а какие — нет,
// и где лежит карта сайта (sitemap).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Закрываем от индексации служебные и личные страницы — поисковику там
      // нечего показывать, пусть тратит силы на контент (главная, курс, рецепты).
      disallow: [
        "/api/",
        "/admin",
        "/profile",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: "https://levainlab.ru/sitemap.xml",
    host: "https://levainlab.ru",
  };
}
