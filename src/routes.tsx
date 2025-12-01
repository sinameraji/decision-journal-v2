import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/components/layouts/RootLayout'

// Root route
const rootRoute = createRootRoute({
  component: RootLayout,
})

// Index route (home page)
import { IndexPage } from '@/pages/index'

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

// New decision route (placeholder for now)
const newRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new',
  component: function NewPage() {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-serif font-bold">New Decision</h1>
        <p className="text-muted-foreground mt-2">Coming soon...</p>
      </div>
    )
  },
})

// Route tree
const routeTree = rootRoute.addChildren([indexRoute, newRoute])

// Create and export router
export const router = createRouter({ routeTree })

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
