import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sell iPhone in Sydney — Cash For Phones Today (Penrith Pickup & Drop-off)',
  description: 'Instant quotes for iPhones in Sydney. Friendly pickup or easy drop-off in Penrith. Cash on pickup or bank transfer/PayID. Quote valid for 7 days. Subject to inspection.',
  keywords: 'sell iPhone Sydney, cash for phones, iPhone buyback Sydney, sell phone Penrith',
  openGraph: {
    title: 'Sell iPhone in Sydney — Cash For Phones Today',
    description: 'Instant quotes for iPhones in Sydney. Friendly pickup or easy drop-off in Penrith.',
    url: 'https://sellphones.sydney',
    siteName: 'SellPhones.sydney',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body className={`${inter.className} bg-surface text-body antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}