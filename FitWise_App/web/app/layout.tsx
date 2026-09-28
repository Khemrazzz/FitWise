import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitWise",
  description: "FitWise — personalised fitness recommendation and progress tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
