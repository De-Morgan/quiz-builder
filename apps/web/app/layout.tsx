import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { Nav } from "@/components/Nav";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Quiz Builder",
  description: "Build and share quizzes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <Nav />
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
