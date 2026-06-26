import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PosPago — Cobra en dólares desde tu celular',
  description: 'Cobra en USDC y retira a tu cuenta bancaria en pesos. Sin wallet, sin complicaciones.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PosPago',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F0F23',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0F0F23] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
