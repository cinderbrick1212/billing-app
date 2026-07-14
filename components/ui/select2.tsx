"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Search, ChevronDown, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Select2Option {
  value: string
  label: string
  [key: string]: any
}

interface Select2Props {
  options: Select2Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function Select2({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
}: Select2Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [mounted, setMounted] = React.useState(false)
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(query))
  }, [options, search])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Update position coordinates when dropdown opens or when window scrolls/resizes
  const updatePosition = React.useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      updatePosition()
      // Position update on scroll and resize
      window.addEventListener("scroll", updatePosition, true)
      window.addEventListener("resize", updatePosition)
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [isOpen, updatePosition])

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if the click target is inside the portal dropdown menu container
        const portalMenu = document.getElementById("select2-portal-menu")
        if (portalMenu && portalMenu.contains(event.target as Node)) {
          return
        }
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const dropdownMenu = isOpen && mounted && typeof window !== "undefined" && createPortal(
    <div
      id="select2-portal-menu"
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
      }}
      className="z-50 mt-1 max-h-60 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col"
    >
      <div className="flex items-center border-b px-3 py-2 gap-2 bg-muted/30">
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-7 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          autoFocus
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
            <X className="h-3 w-3 opacity-50 hover:opacity-100" />
          </button>
        )}
      </div>
      <div className="overflow-y-auto max-h-48 p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-2 text-center text-xs text-muted-foreground">No options found.</div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                  setSearch("")
                }}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                  isSelected && "bg-accent font-medium text-accent-foreground"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {isSelected && <Check className="h-4 w-4" />}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })
        )}
      </div>
    </div>,
    document.body
  )

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {dropdownMenu}
    </div>
  )
}

