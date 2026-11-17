import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "FinEasy",
  description: "Easy Financial App",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR" className={cn("font-sans", geist.variable)}
    >
      <body><Providers>{children}<Toaster richColors position="top-right" /></Providers></body>
    </html>
  );
}
