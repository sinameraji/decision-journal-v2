/**
 * Stub for better-sqlite3 in browser mode
 * The actual database will only work in ToDesktop/Electron
 */

export default class DatabaseStub {
  constructor() {
    console.warn('⚠️ SQLite stub loaded - database features disabled in browser mode');
  }

  pragma() {
    return null;
  }

  exec() {
    return null;
  }

  prepare() {
    return {
      run: () => ({}),
      get: () => null,
      all: () => [],
    };
  }

  close() {
    return null;
  }
}
