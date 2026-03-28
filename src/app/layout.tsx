import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
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
  title: {
    default: "Portal da Comunidade",
    template: "%s | Portal da Comunidade",
  },
  description:
    "Comunidade de contadores que compartilham experiências práticas com IA — sem jargões, sem gurus.",
  openGraph: {
    title: "Portal da Comunidade",
    description:
      "Comunidade de contadores que compartilham experiências práticas com IA — sem jargões, sem gurus.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal da Comunidade",
    description:
      "Comunidade de contadores que compartilham experiências práticas com IA — sem jargões, sem gurus.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">{children}</body>
      </html>
    </AuthProvider>
  );
}
