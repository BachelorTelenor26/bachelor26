'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import DashboardGreeting from "../../components/agent/DashboardGreeting"
import DashboardActions from "../../components/agent/DashboardActions"
import RecentSessions from '@/app/components/agent/RecentSessions'
import MostUsedGuides from '@/app/components/agent/MostUsedGuides'

export default function DashboardPage() {
  const { data: session } = authClient.useSession()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => setSessions(data))
      .catch(() => {})
  }, [])

 return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <DashboardGreeting name={session?.user?.name ?? ''} />
        <DashboardActions />
      </div>

      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <RecentSessions sessions={sessions} />
          <MostUsedGuides />
        </div>
        <div>
          {/* Sist endret innhold — kommer senere */}
        </div>
      </div>
    </div>
  )
}