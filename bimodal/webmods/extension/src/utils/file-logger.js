/**
 * File Logger - Writes extension loading logs to logs/ directory
 */
class FileLogger {
  constructor() {
    this.logDir = 'logs';
    this.logFile = 'keypilot-extension.log';
  }

  /**
   * Write log entry to file system
   */
  async writeLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...data
    };

    try {
      // For Chrome extensions, we'll use the background script to write files
      // Send message to background script to handle file writing
      if (chrome && chrome.runtime) {
        await chrome.runtime.sendMessage({
          type: 'KP_WRITE_LOG',
          logEntry: logEntry
        });
      } else {
        // Fallback: log to console with special prefix for external tools to capture
        console.log(`[KEYPILOT_LOG] ${JSON.stringify(logEntry)}`);
      }
    } catch (error) {
      console.error('[FileLogger] Failed to write log:', error);
      // Always fallback to console logging
      console.log(`[KEYPILOT_LOG] ${JSON.stringify(logEntry)}`);
    }
  }

  /**
   * Log extension initialization
   */
  async logInit(component, success = true, error = null) {
    await this.writeLog('INFO', `Extension component initialized: ${component}`, {
      component,
      success,
      error: error ? error.message : null
    });
  }

  /**
   * Log extension loading status
   */
  async logLoaded() {
    await this.writeLog('INFO', 'KeyPilot extension fully loaded', {
      components: {
        keyPilotApp: !!window.__KeyPilotApp,
        toggleHandler: !!window.__KeyPilotToggleHandler,
        debugHooks: !!window.__KeyPilotDebugHooks,
        extensionAPI: !!window.KeyPilotExtension
      },
      svgCursorInDOM: !!document.querySelector('svg[data-keypilot-cursor]')
    });
  }

  /**
   * Log errors
   */
  async logError(message, error) {
    await this.writeLog('ERROR', message, {
      error: error.message,
      stack: error.stack
    });
  }
}

// Export for use in other modules
window.FileLogger = FileLogger;
