import { useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import './styles/globals.css'
import { UpdateDialog } from './components/update-dialog'
import { useCheckForUpdates, useScheduleNextCheck } from './store'

function App() {
  const checkForUpdates = useCheckForUpdates()
  const scheduleNextCheck = useScheduleNextCheck()

  useEffect(() => {
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
