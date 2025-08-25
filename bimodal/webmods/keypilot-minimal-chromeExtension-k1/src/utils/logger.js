/**
 * Centralized logging utility
 */
export class Logger {
  constructor(prefix = 'KeyPilot', enabled = false) {
    this.prefix = prefix;
    this.enabled = enabled;
  }

  log(...args) {
    if (this.enabled) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }

  warn(...args) {
    if (this.enabled) {
      console.warn(`[${this.prefix}]`, ...args);
    }
  }

  error(...args) {
    if (this.enabled) {
      console.error(`[${this.prefix}]`, ...args);
    }
  }

  debug(...args) {
    if (this.enabled) {
      console.debug(`[${this.prefix}]`, ...args);
    }
  }

  group(label) {
    if (this.enabled) {
      console.group(`[${this.prefix}] ${label}`);
    }
  }

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger('KeyPilot', process.env.NODE_ENV === 'development');