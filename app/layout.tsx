import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { ReferralCapture } from '@/components/referral-capture'
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
        <ReferralCapture />
        {children}
        <Analytics />
        <Script id="reddit-pixel" strategy="afterInteractive">{`
          !function(w,d){
            if(!w.rdt){
              var p=w.rdt=function(){
                p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)
              };
              p.callQueue=[];
              var t=d.createElement("script");
              t.src="https://www.redditstatic.com/ads/pixel.js";
              t.async=!0;
              var s=d.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(t,s);
              p("init","a2_iwn6ml02rytp");
              p("track","PageVisit");
            }
          }(window,document);
        `}</Script>
      </body>
    </html>
  )
}
