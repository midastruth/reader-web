import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { RSPrefs } from "@/preferences";
import { LayoutDirection } from "@/models/layout";

import StoreProvider from "./StoreProvider";

export const runtime = "edge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Thorium Web",
  description: "Play with the capabilities of the Readium Web Toolkit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" { ...(RSPrefs.direction && RSPrefs.direction === LayoutDirection.rtl ? { dir: RSPrefs.direction } : {}) }>
      <body className={ inter.className }>
        <StoreProvider>
          { children  }
        </StoreProvider>
      </body>
    </html>
  );
}
