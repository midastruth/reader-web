import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThStoreProvider } from "@/lib/ThStoreProvider";
import { ThGlobalPreferencesProvider } from "@/preferences/ThGlobalPreferencesProvider";

import "./reset.css";
import "@assistant-ui/react-ui/styles/index.css";
import "@assistant-ui/react-ui/styles/markdown.css";

// Do not enable Edge runtime globally: reader pages exceed Vercel's 1 MB Edge Function limit.
// Keep Edge runtime only on lightweight API routes that explicitly opt in.
// export const runtime = "edge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Thorium Web",
  description: "Play with the capabilities of the Readium Web Toolkit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ inter.className }>
        <ThStoreProvider>
          <ThGlobalPreferencesProvider>
            { children }
          </ThGlobalPreferencesProvider>
        </ThStoreProvider>
      </body>
    </html>
  );
}
