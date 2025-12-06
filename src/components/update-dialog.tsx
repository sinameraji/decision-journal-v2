import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, Sparkles, AlertCircle } from 'lucide-react'
import {
  useShowUpdateDialog,
  useAvailableUpdate,
  useIsDownloadingUpdate,
  useDownloadProgress,
  useDismissUpdateDialog,
  useDownloadAndInstall,
  useUpdateError,
} from '@/store'

export function UpdateDialog() {
  const showDialog = useShowUpdateDialog()
  const availableUpdate = useAvailableUpdate()
  const isDownloading = useIsDownloadingUpdate()
  const downloadProgress = useDownloadProgress()
  const dismissDialog = useDismissUpdateDialog()
  const downloadAndInstall = useDownloadAndInstall()
  const updateError = useUpdateError()

  const handleInstall = async () => {
    await downloadAndInstall()
  }

  const handleRetry = async () => {
    await downloadAndInstall()
  }

  if (!availableUpdate) return null

  return (
    <Dialog
      open={showDialog}
      onOpenChange={(open) => !open && !isDownloading && dismissDialog()}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Update Available</DialogTitle>
          </div>
          <DialogDescription>
            A new version of Decision Journal is available
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {updateError && updateError !== 'NO_UPDATE_AVAILABLE' && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Update Failed</p>
                <p className="text-sm text-destructive/90 mt-1">{updateError}</p>
              </div>
            </div>
          )}

          {/* Version Info */}
          {!updateError || updateError === 'NO_UPDATE_AVAILABLE' ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current version:</span>
                <span className="font-mono font-medium">{availableUpdate.currentVersion}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New version:</span>
                <span className="font-mono font-medium text-primary">{availableUpdate.version}</span>
              </div>

              {/* Release Notes */}
              {availableUpdate.body && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">What's new:</h4>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-sans">{availableUpdate.body}</pre>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Download Progress */}
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloading update...</span>
                <span className="font-medium">{Math.round(downloadProgress)}%</span>
              </div>
              <Progress value={downloadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          {updateError && updateError !== 'NO_UPDATE_AVAILABLE' ? (
            <>
              <Button variant="outline" onClick={dismissDialog}>
                Dismiss
              </Button>
              <Button onClick={handleRetry} className="gap-2">
                <Download className="h-4 w-4" />
                Retry
              </Button>
            </>
          ) : !isDownloading ? (
            <>
              <Button variant="outline" onClick={dismissDialog}>
                Install Later
              </Button>
              <Button onClick={handleInstall} className="gap-2">
                <Download className="h-4 w-4" />
                Install Now
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              The app will restart automatically after installation...
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
