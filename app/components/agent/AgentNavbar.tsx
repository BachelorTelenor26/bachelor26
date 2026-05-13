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
    <header className="bg-[#033671] border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 h-16 sm:px-16 flex items-center justify-between">
        
        <Link href="/agent/dashboard" className="flex items-center gap-2 min-w-0">

          <div className="w-8 h-8 rounded-lg bg-[#1F74BF] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">K</span>
          </div>

          <div className="leading-tight min-w-0">
            <p className="font-semibold text-white text-sm">Kunnskapsbase</p>
            <p className="text-xs text-white">Agentportal</p>
          </div>

        </Link>

        <div className="flex items-center gap-2 flex-col sm:gap-4 min-w-0">


          <span className="text-sm text-[#e6e3e3] items-center flex flex-col">
            <AgentAvatar name={userName} onSignOut={onSignOut} />
            <span className="font-medium text-white">{firstName} {lastName}</span>
          </span>

          
        </div>
      </nav>
    </header>
  )
}