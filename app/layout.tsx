import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Agbejo - Decentralized Escrow",
  description: "A secure, decentralized escrow service powered by Hedera",
};

// Dynamically import WalletProvider with SSR turned off
const WalletProvider = dynamic(
  () => import('@/components/WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
