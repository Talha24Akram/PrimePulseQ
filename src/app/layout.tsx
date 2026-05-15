import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseSurvey — Employee Feedback Without Enterprise Complexity",
  description: "Weekly pulse surveys that give employees a safe, anonymous voice. Know what your team actually thinks in 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
