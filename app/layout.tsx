import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "FinEasy",
  description: "Easy Financial App",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
    >
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
