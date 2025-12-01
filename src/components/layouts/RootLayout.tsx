import { Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'

export function RootLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
