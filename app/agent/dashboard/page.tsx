'use client'

import { authClient } from '@/lib/auth-client'
import DashboardGreeting from "../../components/agent/DashboardGreeting"
import DashboardActions from "../../components/agent/DashboardActions"

export default function DashboardPage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="flex items-center justify-between mb-8">
      <DashboardGreeting name={session?.user?.name ?? ''} />
      <DashboardActions />
    </div>
  )
}