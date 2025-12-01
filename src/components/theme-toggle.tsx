"use client"

import { Sun, Moon, Monitor } from "lucide-react"
import { useStore } from "@/store"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "p-1.5 rounded-full transition-all",
          theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        title="Light mode"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "p-1.5 rounded-full transition-all",
          theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        title="Dark mode"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "p-1.5 rounded-full transition-all",
          theme === "system" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
        title="System preference"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
