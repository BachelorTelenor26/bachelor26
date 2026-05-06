"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  popularSearches?: string[];
}

export default function SearchBar({
  onSearch,
  placeholder = "Søk...",
  defaultValue = "",
  autoFocus = false,
  popularSearches = [],
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
 
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();

    if (q) {
      onSearch?.(q);
    
    }
  };

 
  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-3 border border-gray-400 rounded-xl px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="w-5 h-5 text-gray-400" />

          <input
            ref={inputRef}
            value={query}
           onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
          
            onSearch?.(val); 
          }}
                      
            placeholder={placeholder}
            className="flex-1 outline-none bg-transparent"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onSearch?.("");
        
              }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}