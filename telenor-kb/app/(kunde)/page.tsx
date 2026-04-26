import Link from 'next/link'

export default function KundeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-gray-900">
              Kunnskapsbase
            </span>
            <span className="text-xs text-gray-500">Selvhjelp</span>
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}