import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import { BUSINESS_INFO } from "@/lib/seo";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: BUSINESS_INFO.name,
    template: '%s | ' + BUSINESS_INFO.name
  },
  description: BUSINESS_INFO.description,
  applicationName: BUSINESS_INFO.name,
  authors: [{ name: BUSINESS_INFO.name }],
  keywords: [
    'sell iPhone Sydney',
    'cash for phones',
    'iPhone buyer Sydney',
    'phone pickup Sydney',
    'instant iPhone quote',
    'Penrith phone buyer',
    'Sydney device buyer'
  ],
  creator: BUSINESS_INFO.name,
  publisher: BUSINESS_INFO.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': 200,
      'max-image-preview': 'large',
      'max-video-preview': 30
    }
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: BUSINESS_INFO.url,
    siteName: BUSINESS_INFO.name,
    title: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    images: [
      {
        url: BUSINESS_INFO.logo,
        width: 1200,
        height: 630,
        alt: BUSINESS_INFO.name + ' - Sydney iPhone Buyer'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    images: [BUSINESS_INFO.logo]
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
    other: {
      'msvalidate.01': process.env.BING_VERIFICATION_CODE || ''
    }
  },
  category: 'Business',
  classification: 'Electronics Buying Service'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip to main content link for screen readers */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        <ClientWrapper>
          {children}
        </ClientWrapper>
        <SpeedInsights />
      </body>
    </html>
  );
}
