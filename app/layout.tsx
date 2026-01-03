import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PulseTrade - Trade the Pulse",
  description: "Feel the market pulse, trade with energy. Tap. Predict. Win.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-pulse-bg text-pulse-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
