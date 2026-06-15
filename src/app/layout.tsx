import type { Metadata, Viewport } from "next";
import { Nunito, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://levainlab.ru"),
  title: "Sourdough — трекер закваски",
  description: "Живая закваска — умный трекер. Первое русскоязычное приложение для домашних пекарей.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sourdough",
  },
  openGraph: {
    title: "Sourdough — трекер закваски",
    description: "Живая закваска — умный трекер. Рецепты и калькулятор для домашних пекарей.",
    url: "https://levainlab.ru",
    siteName: "Sourdough",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sourdough — трекер закваски для домашних пекарей",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sourdough — трекер закваски",
    description: "Живая закваска — умный трекер. Рецепты и калькулятор для домашних пекарей.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FDF8F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script id="yandex-metrika" strategy="lazyOnload">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109856355','ym');
            ym(109856355,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
          `}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/109856355" style={{position:'absolute',left:'-9999px'}} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  );
}
