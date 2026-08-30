import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Düzce Üniversitesi Bilgisayar Mühendisliği Sanal Transkript",
  description: "Düzce Üniversitesi Bilgisayar Mühendisliği öğrencileri için not ortalaması (GANO/YANO) simülasyonu yapan, tamamen tarayıcıda çalışan sanal transkript hesaplama uygulaması.",
};

// Runs before React hydrates so the page never flashes the wrong theme: reads the saved
// preference (defaulting to dark, matching this app's design) and applies it immediately.
const themeInitScript = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
