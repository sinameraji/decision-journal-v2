import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'

// Root layout component
function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// Root route
const rootRoute = createRootRoute({
  component: RootLayout,
})

// Index route (home page)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexPage() {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Decision Journal v2
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Welcome to your decision journal. Powered by Tauri + React + TanStack Router.
        </p>
      </div>
    )
  },
})

// Route tree
const routeTree = rootRoute.addChildren([indexRoute])

// Create and export router
export const router = createRouter({ routeTree })

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
