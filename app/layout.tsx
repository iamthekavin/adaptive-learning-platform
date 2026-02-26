import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "ALP — Adaptive Learning Platform",
  description:
    "A comprehensive academic management and adaptive learning platform for universities, colleges, teachers, and students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="bg-subtle-mesh" />
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
