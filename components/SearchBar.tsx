"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  searchInput: string
  onSearchChange: (value: string) => void
  onSearch: (value: string) => void
  isSticky?: boolean
}

export default function SearchBar({ searchInput, onSearchChange, onSearch, isSticky = false }: SearchBarProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSticky) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isSticky])

  const handleSearch = useCallback(
    (value: string) => {
      onSearchChange(value)
      onSearch(value)
    },
    [onSearchChange, onSearch],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch(searchInput)
    } else if (e.key === "Escape") {
      inputRef.current?.blur()
    }
  }, [searchInput, handleSearch])

  return (
    <div className="flex flex-col mx-auto w-[80%] md:max-w-[800px] relative">
      <div
        className={`flex shadow overflow-hidden items-center h-[57px] w-full bg-[#F8F7F7] rounded-[22px] p-3 transition-all duration-300 ${
          isSticky ? "sticky top-4 z-50 shadow-2xl border border-gray-200 backdrop-blur-sm bg-[#F8F7F7]/95" : ""
        } ${isAnimating ? "scale-[1.02]" : ""}`}
      >
        <input
          ref={inputRef}
          value={searchInput}
          type="text"
          placeholder="Search a name, category, or a module"
          className="flex-1 bg-transparent outline-none px-4 text-sm placeholder-gray-500 transition-all duration-200"
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {searchInput && (
          <button
            onClick={() => handleSearch("")}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200 mr-2"
            type="button"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        <div
          onClick={() => handleSearch(searchInput)}
          className="flex items-center mr-2 gap-2 text-[#9B1616] cursor-pointer hover:text-[#7A1212] transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-[#9B1616]/10"
        >
          <Search className="w-5 h-5" />
          <span className="text-[16px] hidden md:block font-medium">Search</span>
        </div>
      </div>
    </div>
  )
}
