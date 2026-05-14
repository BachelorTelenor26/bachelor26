'use client'
import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  defaultValue?: string  
  autoFocus?: boolean    
  popularSearches?: string[]

}

export default function SearchBar({
  onSearch,
  placeholder = 'Søk, f.eks. «internett virker ikke», «fiberboks lyser rødt»',
  defaultValue = '',
  autoFocus = false,
  popularSearches,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
    // Optional trigger search with empty query
    // onSearch?.('')`?
  }

  return (
      <div className="w-full">
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="flex items-center gap-3 border sm:px-4  rounded-xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
        <Search className="w-5 h-5 text-gray-400 shrink-0" aria-hidden="true" />
        
        <input

          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none text-gray-900 placeholder:text-gray-400 bg-transparent text-base"
          aria-label="Søk hjelp"
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Tøm søkefelt"
          >
            <X className="w-4 h-4 aria-hidden='true' " />
          </button>
        )}
      </div>
    </form>

    {/* må gjøres funksjonelt også  */}
      {popularSearches && popularSearches.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-end">
          <span className="text-xs font-medium text-gray-200 bg-gray-800/60 py-2 px-3 rounded-full mr-1">Populære søk:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => onSearch?.(term)}
              className="inline-flex cursor-pointer items-center text-xs border border-gray-200 rounded-full bg-white px-3 py-1 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              {term}
            </button>
          ))}
        </div>
              )}
    </div>
  )
}