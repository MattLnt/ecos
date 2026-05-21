import type { Metadata } from "next";
import { Outfit, Oswald, Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: '--font-oswald',
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-barlow',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: '--font-barlow-condensed',
});

export const metadata: Metadata = {
  title: "ECOS Shoots",
  description: "Application de suivi de performances basketball",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${outfit.variable} ${oswald.variable} ${barlow.variable} ${barlowCondensed.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}