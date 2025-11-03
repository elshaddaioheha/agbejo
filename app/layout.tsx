<<<<<<< HEAD
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '@/components/WalletProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Agbejo - Decentralized Escrow",
  description: "A secure, decentralized escrow service powered by Hedera",
};

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
=======
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '@/components/WalletProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Agbejo - Decentralized Escrow",
  description: "A secure, decentralized escrow service powered by Hedera",
};

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
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec
