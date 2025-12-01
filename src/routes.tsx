import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/components/layouts/RootLayout'

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
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight mb-2">
            Decision Journal v2
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to your decision journal. Powered by Tauri + React + TanStack Router.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-serif font-semibold text-card-foreground mb-3">
              Color System Test
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm font-mono">
                  Primary
                </div>
                <div className="h-12 bg-secondary rounded flex items-center justify-center text-secondary-foreground text-sm font-mono">
                  Secondary
                </div>
                <div className="h-12 bg-accent rounded flex items-center justify-center text-accent-foreground text-sm font-mono">
                  Accent
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm font-mono">
                  Muted
                </div>
                <div className="h-12 bg-destructive rounded flex items-center justify-center text-destructive-foreground text-sm font-mono">
                  Destructive
                </div>
                <div className="h-12 border-2 border-border rounded flex items-center justify-center text-foreground text-sm font-mono">
                  Border
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-serif font-semibold text-card-foreground mb-3">
              Typography Test
            </h2>
            <div className="space-y-3">
              <p className="font-serif text-base">
                Serif (Libre Baskerville): The quick brown fox jumps over the lazy dog
              </p>
              <p className="font-lora text-base">
                Lora: The quick brown fox jumps over the lazy dog
              </p>
              <p className="font-mono text-sm">
                Mono (IBM Plex Mono): The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-mono font-medium">Phase 2:</span> Styling & Theme system is working!
              Next step: Download font files to enable custom fonts.
            </p>
          </div>
        </div>
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
