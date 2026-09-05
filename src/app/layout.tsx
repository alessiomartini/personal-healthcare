import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Log",
  description: "Personal, private health tracker",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
