'use client'

interface AgentAvatarProps {
  name: string
  onSignOut: () => void
}

export default function AgentAvatar({ name, onSignOut }: AgentAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 1)

  return (
    <button
      onClick={onSignOut}
      className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center text-black text-xs font-semibold hover:bg-[#1F74BF] transition-colors"
      aria-label="Logg ut"
      title="Logg ut"
    >
      {initials}
    </button>
  )
}