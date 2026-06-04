import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'PrintMarketHub - 3D Printing Marketplace', template: '%s | PrintMarketHub' },
  description:
    'Connect with skilled local 3D printer owners. Post jobs, get quotes, and bring your designs to life.',
  keywords: ['3D printing', 'marketplace', 'custom parts', 'prototyping'],
  openGraph: {
    title: 'PrintMarketHub - 3D Printing Marketplace',
    description: 'Post a job and receive quotes from local 3D printer owners in minutes.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
