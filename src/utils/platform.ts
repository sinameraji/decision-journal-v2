/**
 * Platform detection utilities
 */

// Try to detect Tauri by checking for the API
let tauriDetected: boolean | null = null;

/**
 * Check if running in Tauri desktop app
 */
export function isTauri(): boolean {
  if (tauriDetected !== null) {
    return tauriDetected;
  }

  if (typeof window === 'undefined') {
    tauriDetected = false;
    return false;
  }

  // Check multiple Tauri indicators
  const indicators = [
    '__TAURI__' in window,
    '__TAURI_INTERNALS__' in window,
    '__TAURI_INVOKE__' in window,
    'isTauri' in window,
  ];

  tauriDetected = indicators.some(indicator => indicator);
  return tauriDetected;
}

/**
 * Check if running in any desktop environment (Tauri)
 */
export function isDesktop(): boolean {
  return isTauri();
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && !isDesktop();
}

/**
 * Log platform information for debugging
 */
export function logPlatformInfo(): void {
  console.log('Platform Detection:', {
    isTauri: isTauri(),
    isDesktop: isDesktop(),
    isBrowser: isBrowser(),
    hasTauriGlobal: typeof window !== 'undefined' && '__TAURI__' in window,
    windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('TAURI')).join(', ') : 'N/A'
  });
}
