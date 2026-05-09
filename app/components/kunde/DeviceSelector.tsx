import { Laptop, ChevronRight } from 'lucide-react'
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
  
      <div className="max-w-5x1 mx-auto px-6 ">
        <div className='bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden'>
            <div className='px-8 py-8 border-b border-gray-100'>
               <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-8"
            >
              ← Tilbake
            </Link>

          
            {category && (
              <span className="inline-block text-sm font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full mb-4">
                {category}
              </span>
            )}

          
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-800 text-sm mb-8">{subtitle}</p>
            )}
          
          
            <div className="grid grid-cols-2 gap-4">
              {devices.map((device) => {
                const Icon = device.image ?? Laptop
                return (
                  <button
                    key={device.id}
                    onClick={() => onSelect(device.id)}
                    className="group cursor-pointer flex items-center gap-4 p-5 border border-gray-200 bg-white hover:border-blue-300 rounded-xl text-left hover:shadow-sm transition-all duration-200"
                  >
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-50 transition">
                      <Icon className="w-12 h-12 text-gray-500 group-hover:text-blue-600 transition" />
                    </div>

                    <div className='text-left'>  
                      
                      <p className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition">
                        {device.name}
                      </p>
                      <div className='flex item-start gap-4 w-full'>
                    
                        <p className="text-gray-500 text-sm mt-1 leading-snug">
                        {device.description}
                      </p>
                     
                      </div>
                     
                    </div> 
                    <ChevronRight className=" w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                )
              })}
            </div>

          <div className='mt-10 rounded-2xl bg-blue-50 border border-blue-100 p-5'>
             <h4>
              
             </h4>
             <p className="text-sm text-blue-900 p-5">
                <span className='font-semibold'>
                  Usikker på hvilken ruter du har?
                </span>{" "}
              Se etter modellnavnet på undersiden
              eller baksiden av enheten.
            </p>
          </div>
           
          </div>
            </div>
             
        </div>
       

  )
}