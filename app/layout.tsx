import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { SettingsProvider } from "@/context/SettingsContext";
import PageTransition from "@/components/layout/PageTransition";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PulseTrade - Trade the Pulse",
  description: "Feel the market pulse, trade with energy. Tap. Predict. Win.",
  keywords: ["trading", "crypto", "betting", "prediction", "solana"],
  authors: [{ name: "PulseTrade" }],
  openGraph: {
    title: "PulseTrade - Trade the Pulse",
    description: "Feel the market pulse, trade with energy. Tap. Predict. Win.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a0a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} bg-pulse-bg text-pulse-text antialiased`}>
        <WalletProvider>
          <SettingsProvider>
            <AuthProvider>
              <ChatProvider>
                <PageTransition>
                  {children}
                </PageTransition>
              </ChatProvider>
            </AuthProvider>
          </SettingsProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
