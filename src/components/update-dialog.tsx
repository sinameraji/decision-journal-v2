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
import { Download, Sparkles } from 'lucide-react'
import {
  useShowUpdateDialog,
  useAvailableUpdate,
  useIsDownloadingUpdate,
  useDownloadProgress,
  useDismissUpdateDialog,
  useDownloadAndInstall,
} from '@/store'

export function UpdateDialog() {
  const showDialog = useShowUpdateDialog()
  const availableUpdate = useAvailableUpdate()
  const isDownloading = useIsDownloadingUpdate()
  const downloadProgress = useDownloadProgress()
  const dismissDialog = useDismissUpdateDialog()
  const downloadAndInstall = useDownloadAndInstall()

  const handleInstall = async () => {
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
          {/* Version Info */}
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
          {!isDownloading ? (
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
