import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PrimePulseQ — Employee Feedback Without Enterprise Complexity",
  description: "Weekly pulse surveys that give employees a safe, anonymous voice. Know what your team actually thinks in 60 seconds.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading a request header opts every route into dynamic rendering, which is
  // required for the per-request CSP nonce (set in proxy.ts) to be applied to
  // Next's scripts. Without this, statically-prerendered pages ship without a
  // nonce and their inline scripts would be blocked by the CSP.
  await headers();

  return (
    <html lang="en" data-theme="dark" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
