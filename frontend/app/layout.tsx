import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import QueryProvider from '@/providers/query-provider'
import { Montserrat } from "next/font/google";
import './globals.css'

export const metadata: Metadata = {
  title: 'OPSIDE',
  description: '',
}

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${montserrat.variable} font-sans`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}