import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Providers from "@/providers";

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
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased`}>
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
