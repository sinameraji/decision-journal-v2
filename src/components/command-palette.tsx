"use client"

import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  FileText,
  PlusCircle,
  Clock,
  BarChart3,
  MessageSquare,
  Settings,
  Search,
  ArrowRight,
  Command,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getModifierKeySymbol } from "@/utils/keyboard"

const navigationItems = [
  { icon: FileText, label: "Decisions", href: "/", shortcut: 1 },
  { icon: PlusCircle, label: "New Decision", href: "/new", shortcut: 2 },
  { icon: Clock, label: "Reviews", href: "/reviews", shortcut: 3 },
  { icon: BarChart3, label: "Analytics", href: "/analytics", shortcut: 4 },
  { icon: MessageSquare, label: "Chat", href: "/chat", shortcut: 5 },
  { icon: Settings, label: "Settings", href: "/settings", shortcut: 6 },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const modifierKey = getModifierKeySymbol()

  const filteredItems = navigationItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setSearch("")
      navigate({ to: href })
    },
    [navigate],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].href)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, filteredItems, selectedIndex, handleSelect])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => {
          setOpen(false)
          setSearch("")
        }}
      />

      {/* Dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-sans text-base"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border bg-muted px-2 font-mono text-xs text-muted-foreground">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div className="py-2 max-h-80 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p className="text-sm">No results found</p>
              </div>
            ) : (
              <div className="px-2">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Navigation
                </p>
                {filteredItems.map((item, index) => {
                  const Icon = item.icon
                  const isSelected = index === selectedIndex

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors group",
                        isSelected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-md border transition-colors",
                          isSelected ? "bg-primary/10 border-primary/20" : "bg-muted border-border",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 font-sans text-sm">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <kbd
                            className={cn(
                              "h-6 min-w-6 inline-flex items-center justify-center rounded border px-1.5 font-mono text-xs transition-colors",
                              isSelected
                                ? "bg-primary/10 border-primary/20 text-foreground"
                                : "bg-muted border-border text-muted-foreground",
                            )}
                          >
                            {modifierKey}
                          </kbd>
                          <kbd
                            className={cn(
                              "h-6 min-w-6 inline-flex items-center justify-center rounded border px-1.5 font-mono text-xs transition-colors",
                              isSelected
                                ? "bg-primary/10 border-primary/20 text-foreground"
                                : "bg-muted border-border text-muted-foreground",
                            )}
                          >
                            {item.shortcut}
                          </kbd>
                        </div>
                        <ArrowRight
                          className={cn("h-4 w-4 transition-opacity", isSelected ? "opacity-100" : "opacity-0")}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="h-5 min-w-5 inline-flex items-center justify-center rounded border border-border bg-card px-1 font-mono text-[10px]">
                  ↑
                </kbd>
                <kbd className="h-5 min-w-5 inline-flex items-center justify-center rounded border border-border bg-card px-1 font-mono text-[10px]">
                  ↓
                </kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="h-5 min-w-5 inline-flex items-center justify-center rounded border border-border bg-card px-1 font-mono text-[10px]">
                  ↵
                </kbd>
                <span>select</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>K to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
