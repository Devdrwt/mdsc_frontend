import type { Metadata } from "next";
import { Playfair_Display, Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/context/ThemeContext";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maison de la Société Civile - Plateforme MOOC",
  description: "Plateforme d'apprentissage en ligne pour renforcer les capacités des organisations de la société civile. Cours, certifications et accompagnement pour la crédibilité et l'innovation.",
  keywords: ["formation", "OSC", "société civile", "apprentissage", "certification", "Côte d'Ivoire"],
  authors: [{ name: "Maison de la Société Civile" }],
  creator: "Équipe Dev Drwintech inc",
  publisher: "Maison de la Société Civile",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "Maison de la Société Civile - Plateforme MOOC",
    description: "Renforcez les capacités de votre organisation avec nos formations spécialisées pour la société civile.",
    url: 'http://localhost:3000',
    siteName: 'Maison de la Société Civile',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Maison de la Société Civile - Plateforme MOOC',
      },
    ],
    locale: 'fr_CI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Maison de la Société Civile - Plateforme MOOC",
    description: "Renforcez les capacités de votre organisation avec nos formations spécialisées.",
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        className={`${playfairDisplay.variable} ${openSans.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
