import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kunnskapsbase',
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