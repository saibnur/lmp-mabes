import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { UserProfileProvider } from "@/store/UserProfileProvider";
import Providers from "@/app/components/Providers";
import MainLayoutClient from "@/components/layout/MainLayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laskar Merah Putih - Satu Komando",
  description:
    "Organisasi kemasyarakatan yang menjunjung tinggi nilai Pancasila dan persatuan Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <UserProfileProvider>
            <MainLayoutClient>{children}</MainLayoutClient>
          </UserProfileProvider>
        </Providers>
      </body>
    </html>
  );
}
