import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Import the WalletProvider
import { WalletProvider } from "@/context/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Agbejo",
  description: "Decentralized Escrow on Hedera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* 2. Wrap the children with the WalletProvider */}
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
