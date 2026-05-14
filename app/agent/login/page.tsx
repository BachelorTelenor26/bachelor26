'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import Image from "next/image";

export default function AgentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await authClient.signIn.email({ email, password })

    if (error) {
      setError('Feil epost eller passord. Prøv igjen.')
      setLoading(false)
      return
    }

    router.push('/agent/dashboard')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* Venstre side — markedsføring */}
      <aside className="relative h-screen overflow-hidden text-white flex flex-col justify-between ">
      
                <Image
                  src="/happyCustomerService.png"
                  alt='Hero banner'
                  width={1200}
                  height={1200}
                  quality={75}
                  className='w-full h-full object-cover absolute -z-10 brightness-25 scale-105'
                  priority
                />
        
        {/* top - logo  */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-white text-sm">Kunnskapsbase</p>
            <p className="text-xs text-white/90">Agentportal</p>
          </div>
        </div>

        {/* content */}
        <div className='flex flex-col justify-end pb-10 max-w-md p-5'>
          <h1 className="text-4xl md:text-5xl font-semibold text-white whitespace-pre-wrap leading-tight mb-6 ">
            Feilsøkingsverktøyet som holder deg ett steg foran.
          </h1>
          <p className="text-white/90 text-base leading-relaxed">
            Søkbar, oppdatert feilsøkingsinformasjon tilgjengelig
            der du trenger det — midt i samtalen.
          </p>
        </div>

        <p className="text-xs text-white/80 p-2">
          Intern tjeneste · krever ansatt-konto
        </p>
      </aside>

      {/* Høyre side — innloggingsskjema */}
      <main className="flex items-center justify-center bg-[#f5f7fa] p-10 ">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Logg inn</h2>
          <p className="text-sm text-gray-500 mb-8">Bruk din ansatt-epost</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-post
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siri.hvamstad@kundeservice.no"
                autoComplete="email"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Passord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10 transition-all"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-500 p-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#1F74BF] cursor-pointer text-white rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#0055D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logger inn...
                </>
              ) : (
                <>
                  Logg inn
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>
      </main>

    </div>
  )
}