import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy: разрешаем только то, что нужно приложению.
// 'unsafe-inline' нужен для встроенных скриптов/стилей Next.js и шрифтов.
// В режиме разработки добавляем 'unsafe-eval' и ws: — иначе ломается hot-reload.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // upgrade-insecure-requests заставляет грузить ресурсы по https — ломает
  // локальную разработку по http, поэтому включаем только в проде
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  // Всегда ходить только по HTTPS (2 года), включая поддомены — только в проде
  // (по http этот заголовок браузер всё равно игнорирует, а в dev мешает)
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  // Какие источники контента разрешены (защита от внедрения чужих скриптов)
  { key: "Content-Security-Policy", value: csp },
  // Запрет встраивать сайт в чужие <iframe> (защита от кликджекинга)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Браузер не должен «угадывать» тип файла (защита от MIME-подмены)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Не передавать полный адрес страницы на чужие сайты
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Отключаем неиспользуемые возможности браузера (камера, микрофон, геолокация)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.24", "192.168.0.76", "192.168.139.3", "192.168.1.180", "192.168.139.224"],
  // Убираем заголовок X-Powered-By: Next.js (не светим, на чём сделан сайт)
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
