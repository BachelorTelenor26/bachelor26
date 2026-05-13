import Link from "next/link";
import Footer from "../components/shared/Footer";
import Image from "next/image";

export default function KundeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#eef6fb] flex flex-col">
      <header className="bg-[#0f3d56] w-full">
        <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/favicon.svg" alt="Logo" width={40} height={40} />

            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-amber-50">
                Kunnskapsbase
              </span>
              <span className="text-xs text-[#e6e7e7]">Selvhjelp</span>
            </div>
          </Link>
        </nav>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
