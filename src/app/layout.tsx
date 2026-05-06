import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Providers from "@/providers";
import { loadMessages } from "@/i18n/loadMessages";
import { routing } from "@/i18n/routing";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "TechTaurant - 기술 블로그 모음",
  description: "다양한 기술 블로그의 최신 포스트를 한곳에서 확인하세요",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await loadMessages(routing.defaultLocale);

  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased`}>
        <Providers>
          <NextIntlClientProvider
            locale={routing.defaultLocale}
            messages={messages}
          >
            <ThemeProvider>{children}</ThemeProvider>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
