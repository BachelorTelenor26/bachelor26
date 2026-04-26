import { Laptop } from 'lucide-react'
import Link from 'next/link'

interface Device {
  id: string
  name: string
  description: string
  image?: React.FC<{ className?: string }>
}

interface DeviceSelectorProps {
  title: string
  subtitle?: string
  category?: string
  devices: Device[]
  onSelect: (deviceId: string) => void
}

export default function DeviceSelector({
  title,
  subtitle,
  category,
  devices,
  onSelect,
}: DeviceSelectorProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">


      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-8"
      >
        ← Tilbake
      </Link>

    
      {category && (
        <span className="inline-block text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full mb-4">
          {category}
        </span>
      )}

     
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      {subtitle && (
        <p className="text-gray-500 text-sm mb-8">{subtitle}</p>
      )}

     
      <div className="grid grid-cols-2 gap-4">
        {devices.map((device) => {
          const Icon = device.image ?? Laptop
          return (
            <button
              key={device.id}
              onClick={() => onSelect(device.id)}
              className="flex items-center gap-4 p-5 border border-gray-200 rounded-xl text-left hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <Icon className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {device.name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {device.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      
      <p className="text-xs text-gray-400 text-center mt-8">
        Usikker på hvilken ruter du har? Se etter modellnavnet på undersiden
        eller baksiden av enheten.
      </p>
    </div>
  )
}