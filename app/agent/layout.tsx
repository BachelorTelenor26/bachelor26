'use client'

import {usePathname,  useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import AgentNavbar from '../components/agent/AgentNavbar'


export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/agent/login'

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push('/agent/login')
      }
    })
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#EEF6FB]">
      <AgentNavbar
        userName={session?.user?.name ?? ''}
        onSignOut={handleSignOut}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}