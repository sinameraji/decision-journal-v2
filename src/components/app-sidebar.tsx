"use client"

import { Link, useLocation } from "@tanstack/react-router"
import {
  FileText,
  PlusCircle,
  Clock,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useStore } from "@/store"

const navItems = [
  { icon: FileText, label: "Decisions", href: "/" },
  { icon: PlusCircle, label: "New Decision", href: "/new" },
  { icon: Clock, label: "Reviews", href: "/reviews" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function AppSidebar() {
  const location = useLocation()
  const sidebarOpen = useStore((state) => state.sidebarOpen)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const collapsed = !sidebarOpen

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <h2 className="font-serif font-semibold text-sidebar-foreground tracking-tight">Decision Journal</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-sans transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-sidebar-foreground/50">Theme</span>
              <ThemeToggle />
            </div>
            <p className="text-xs text-sidebar-foreground/50 leading-relaxed">All data stored locally</p>
          </>
        ) : (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  )
}
