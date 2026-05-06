import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Info } from "lucide-react";

const guides = [
  { title: 'Internettet virker ikke hjemme', category: 'Ikke på nett', slug: 'ikke-pa-nett', uses: 42 },
  { title: 'Tregt eller ustabilt nett', category: 'Tregt nett', slug: 'tregt-nett', uses: 28 },
  { title: 'Ustabilt nett', category: 'Ustabilt nett', slug: 'ustabilt-nett', uses: 17 },
]

export default function MostUsedGuides() {
  return (
    <section className="mt-6">
      <h2 className="font-semibold text-gray-900 mb-3">Mest brukte guider</h2>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/feilsoking/${guide.slug}`}
            className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <div className='flex item-start gap-4 w-full'>

              <div className='w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-black-500 text-sm font-semibold'>
                  <Info/>
              </div>

              <div className="flex-1 min-w-0">
                
                <div className='mb-1'>
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {guide.category}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{guide.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{guide.uses} sesjoner siste 30 dager</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  )
}
