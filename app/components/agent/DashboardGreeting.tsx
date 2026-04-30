interface DashboardGreetingProps {
  name: string
}

export default function DashboardGreeting({ name }: DashboardGreetingProps) {
  const firstName = name.split(' ')[0]
  const currentDate = new Date()
  
  const getGreeting = () => {
    const hour = currentDate.getHours() 
    if (hour < 12) return 'God morgen'
    if (hour < 18) return 'God ettermiddag'
    return 'God kveld'
  }

  const formatDate = (date: Date) => {
    const formatted = date.toLocaleDateString('nb-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return formatted.replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const date = formatDate(currentDate)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {getGreeting()}, {firstName}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{date}</p>
    </div>
  )
}