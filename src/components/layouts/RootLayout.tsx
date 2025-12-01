import { Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'

export function RootLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Titlebar Drag Region */}
      <div
        data-tauri-drag-region
        className="fixed top-0 left-0 right-0 h-10 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pt-10">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
