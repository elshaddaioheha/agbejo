import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletLoader } from '@/components/WalletLoader';
import { ErrorBoundary } from './error-boundary';
import { ChunkErrorHandler } from '@/components/ChunkErrorHandler';

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
        <ErrorBoundary>
          <ChunkErrorHandler>
            <WalletLoader>
              {children}
            </WalletLoader>
          </ChunkErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  );
}
