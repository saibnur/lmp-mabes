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
  title: "Laskar Merah Putih - Satu Komando",
  description:
    "Organisasi kemasyarakatan yang menjunjung tinggi nilai Pancasila dan persatuan Indonesia.",
};

import { UserProfileProvider } from "@/components/dashboard/UserProfileProvider";
import Providers from "@/components/Providers";

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
            {children}
          </UserProfileProvider>
        </Providers>
      </body>
    </html>
  );
}
