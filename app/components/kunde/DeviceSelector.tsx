import { Laptop, ChevronRight, Info } from 'lucide-react'
import Link from 'next/link'

interface Device {
  id: string
  name: string
  description: string
  image?: string
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
      <div className="w-full flex justify-center pt-24 mt-2 px-6">
        <div className='w-full max-w-5xl'>
            <div className='bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden'>
            <div className='px-8 py-8 border-b border-gray-100'>
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-8"
              >
                ← Tilbake
              </Link>

              {category && (
                <span className="inline-block text-sm font-medium text-blue-600  py-1 rounded-full mb-4">
                  {category}
                </span>
              )}

              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 text-sm mb-8">{subtitle}</p>
              )}
            
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {devices.map((device) => {
                  const isImagePath = typeof device.image === "string"
                  return (
                    <button
                      key={device.id}
                      onClick={() => onSelect(device.id)}
                      className="group cursor-pointer flex items-center gap-4 p-5 border border-gray-200 bg-white hover:border-blue-300 rounded-xl text-left hover:shadow-sm transition-all duration-200"
                    >
                      <div className="w-18 h-18 flex items-center justify-center rounded-xl bg-blue-200 group-hover:bg-blue-300 transition">
                        {device.image ? (
                          <img 
                            src={device.image as string}
                            alt={device.name} 
                            className='w-15 h-15 object-contain'
                          />
                        ) : (
                            <Laptop className="w-15 h-12 text-gray-500 group-hover:text-blue-600 transition" />
                        )}
                      </div>
                        
                        

                      <div className='flex-1'>  
                        <p className="font-semibold text-gray-900 text-base group-hover:text-blue-600 transition">
                          {device.name}
                        </p>
                        <p className="text-gray-500 text-sm mt-0.5 leading-snug">
                          {device.description}
                        </p>
                      </div> 
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    </button>
                  )
                })}
              </div>

              <div className='mt-6 rounded-lg px-4 py-3.5 flex gap-3'>
                <Info className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className='font-semibold text-gray-800'>
                    Usikker på hvilken ruter du har?
                  </span>{" "}
                  Se etter modellnavnet på undersiden eller baksiden av enheten.
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
  )
}