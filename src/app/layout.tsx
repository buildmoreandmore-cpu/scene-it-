import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

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
  title: "Scene.it - Visual Research for Creatives",
  description:
    "Reference search for art directors, creative directors, and filmmakers. Find the visual inspiration you need.",
  keywords: [
    "visual research",
    "creative reference",
    "mood board",
    "art direction",
    "film reference",
    "visual inspiration",
  ],
  authors: [{ name: "Scene.it" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Scene.it - Visual Research for Creatives",
    description: "Reference search for art directors, creative directors, and filmmakers.",
    type: "website",
    url: "https://sceneit.dev",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
