import { useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import './styles/globals.css'
import { UpdateDialog } from './components/update-dialog'
import { useCheckForUpdates, useScheduleNextCheck } from './store'
import { registerAllTools } from './services/tools'

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
  }, [checkForUpdates, scheduleNextCheck])

  return (
    <>
      <UpdateDialog />
      <RouterProvider router={router} />
    </>
  )
}

export default App
