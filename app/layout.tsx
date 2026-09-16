import type { Metadata, Viewport } from "next";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ECOS Shoots',
  },
};

// Le double-tap zoom parasite la saisie rapide des scores pendant une session :
// on fige l'échelle et on passe en viewport-fit=cover pour gérer les encoches.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0A1628',
  colorScheme: 'dark',
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
