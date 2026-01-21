import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scene.it - AI Visual Discovery",
  description:
    "See what you imagine. Find what you feel. The professional's visual intelligence tool for designers and creatives.",
  keywords: [
    "visual search",
    "AI image search",
    "creative discovery",
    "design inspiration",
    "mood board",
  ],
  authors: [{ name: "Scene.it" }],
  openGraph: {
    title: "Scene.it - AI Visual Discovery",
    description: "See what you imagine. Find what you feel.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
