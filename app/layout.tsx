import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kunnskapsbase',
  description: 'Selvhjelpsverktøy for Telenor-kunder',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}