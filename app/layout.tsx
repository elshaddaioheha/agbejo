import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Import 'dynamic' from Next.js
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Agbejo",
  description: "Decentralized Escrow on Hedera",
};

// 2. Dynamically import the WalletProvider with SSR turned off
const WalletProvider = dynamic(() => 
  import('@/context/WalletContext').then((mod) => mod.WalletProvider), 
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* 3. The WalletProvider component is now used here as before */}
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
