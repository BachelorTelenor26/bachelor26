import Link from 'next/link'
import AgentAvatar from './AgentAvatar'

interface AgentNavbarProps {
  userName: string
  onSignOut: () => void
}

export default function AgentNavbar({ userName, onSignOut }: AgentNavbarProps) {
  const firstName = userName.split(' ')[0]
  const lastName = userName.split(' ')[1]

  return (
    <header className="bg-white border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/agent/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F74BF] flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-gray-900 text-sm">Kunnskapsbase</p>
            <p className="text-xs text-gray-400">Agentportal</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">


          <span className="text-sm text-gray-500">
            Innlogget som{' '}
            <span className="font-medium text-gray-900">{firstName} {lastName}</span>
          </span>

          <AgentAvatar name={userName} onSignOut={onSignOut} />
        </div>
      </nav>
    </header>
  )
}