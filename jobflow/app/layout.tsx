import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobFlow",
  description: "Track your job search with a clean, focused workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
