import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import QueryProvider from '@/providers/query-provider'
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import './globals.css'

export const metadata: Metadata = {
  title: 'OPSIDE',
  description: 'Plateforme de gestion des agents',
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