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

// New decision route
import { NewPage } from '@/pages/new'

const newRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new',
  component: NewPage,
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
