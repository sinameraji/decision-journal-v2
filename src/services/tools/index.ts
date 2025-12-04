/**
 * Tool Registration
 *
 * Imports and registers all coaching tools with the registry.
 */

import { toolRegistry } from './tool-registry';

// Pattern tools
import { patternDetectiveTool } from './pattern/pattern-detective';
import { calibrationCoachTool } from './pattern/calibration-coach';

// Risk tools
import { preMortemTool } from './risk/pre-mortem';

// Framework tools
import { biasDetectorTool } from './framework/bias-detector';

// Flag to prevent duplicate registration
let registered = false;

/**
 * Register all available tools.
 *
 * Call this function once at app startup to make tools available.
 */
export function registerAllTools(): void {
  // Prevent duplicate registration
  if (registered) return;
  registered = true;

  // Pattern Recognition Tools
  toolRegistry.register(patternDetectiveTool);
  toolRegistry.register(calibrationCoachTool);

  // Risk Analysis Tools
  toolRegistry.register(preMortemTool);

  // Mental Model Tools
  toolRegistry.register(biasDetectorTool);

  console.log(`✓ Registered ${toolRegistry.count()} coaching tools`);
}

// Export registry for access elsewhere
export { toolRegistry } from './tool-registry';
export * from './tool-types';
