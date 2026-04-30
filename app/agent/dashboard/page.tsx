'use client'

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push('/agent/login')
      }
    })
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleSignOut}>Logg ut</button>
    </div>
  )
}