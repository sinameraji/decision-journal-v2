import { isTauri } from '@/utils/platform';

/**
 * Save a ZIP file using platform-specific methods
 * Desktop: Uses Tauri dialog plugin
 * Browser: Uses browser download API
 */
export async function saveZipFile(zipBlob: Blob, defaultFileName: string): Promise<boolean> {
  if (isTauri()) {
    return await saveFileDesktop(zipBlob, defaultFileName, 'ZIP Files', ['zip']);
  } else {
    return saveFileBrowser(zipBlob, defaultFileName);
  }
}

/**
 * Save a PDF file using platform-specific methods
 * Desktop: Uses Tauri dialog plugin
 * Browser: Uses browser download API
 */
export async function savePDFFile(pdfBlob: Blob, defaultFileName: string): Promise<boolean> {
  if (isTauri()) {
    return await saveFileDesktop(pdfBlob, defaultFileName, 'PDF Files', ['pdf']);
  } else {
    return saveFileBrowser(pdfBlob, defaultFileName);
  }
}

/**
 * Save file in desktop mode using Tauri
 */
async function saveFileDesktop(
  blob: Blob,
  defaultFileName: string,
  filterName: string,
  extensions: string[]
): Promise<boolean> {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');

    // Show save dialog
    const filePath = await save({
      defaultPath: defaultFileName,
      filters: [
        {
          name: filterName,
          extensions: extensions,
        },
      ],
    });

    // User cancelled dialog
    if (!filePath) {
      return false;
    }

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write file
    await writeFile(filePath, uint8Array);

    return true;
  } catch (error) {
    console.error('Failed to save file in desktop mode:', error);
    throw error;
  }
}

/**
 * Save file in browser mode using download API
 */
function saveFileBrowser(blob: Blob, defaultFileName: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to save file in browser mode:', error);
    throw error;
  }
}
