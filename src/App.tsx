import { useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import './styles/globals.css'
import { UpdateDialog } from './components/update-dialog'
import { useCheckForUpdates, useScheduleNextCheck } from './store'
import { registerAllTools } from './services/tools'
import { autoEmbeddingService } from './services/rag/auto-embedding-service'
import { isDesktop } from './utils/platform'

function App() {
  const checkForUpdates = useCheckForUpdates()
  const scheduleNextCheck = useScheduleNextCheck()

  useEffect(() => {
    // Register all coaching tools on app launch
    registerAllTools()

    // Check for updates on app launch (automatic, respects 24-hour interval)
    checkForUpdates(false)

    // Schedule recurring daily checks
    scheduleNextCheck()

    // Initialize auto-embedding service on desktop only
    if (isDesktop()) {
      // Start background worker for retry queue
      autoEmbeddingService.startBackgroundWorker()

      // Scan for missing embeddings and queue them
      autoEmbeddingService.checkForMissingEmbeddings().catch((error) => {
        console.error('[App] Failed to scan for missing embeddings:', error)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <UpdateDialog />
      <RouterProvider router={router} />
    </>
  )
}

export default App
