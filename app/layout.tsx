import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClientWalletProvider } from "@/components/ClientWalletProvider"; // ✅ new import

const outfit = Outfit({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={outfit.className}>
        {/* ✅ Wrap children with the client-side provider */}
        <ClientWalletProvider>
          {children}
        </ClientWalletProvider>
      </body>
    </html>
  );
}
