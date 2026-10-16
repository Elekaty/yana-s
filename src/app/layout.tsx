import type { Metadata, Viewport } from "next";
import { Fredoka, Geist } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka-face" });

export const metadata: Metadata = {
  title: "Mochi & Friends",
  description: "School messages, homework, and a cat named Mochi.",
  applicationName: "Mochi & Friends",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mochi", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${fredoka.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          {children}
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
