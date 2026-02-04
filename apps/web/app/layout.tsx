import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aschedual",
  description: "Personal productivity capture and scheduling"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
