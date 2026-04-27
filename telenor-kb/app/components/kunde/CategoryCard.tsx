import Link from 'next/link'

interface CategoryCardProps {
  icon: React.FC<{ className?: string }>
  title: string
  description: string
  href: string
}

export default function CategoryCard({
  icon: Icon,
  title,
  description,
  href,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block p-6 rounded-2xl bg-white border border-gray-300  hover:shadow-md transition-all duration-200"
    >
      {/* Icon with gradient background */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 text-base mb-1.5">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-sm leading-relaxed">
        {description}
      </p>
    </Link>
  )
}