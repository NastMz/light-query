// src/utils/logger.ts
export enum LogLevel {
  Silent = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4
}

export class Logger {
  constructor (private readonly level: LogLevel = LogLevel.Warn) {}

  error (message: string, meta?: any): void {
    if (this.level >= LogLevel.Error) {
      console.error('[light-query] ERROR:', message, meta)
    }
  }

  warn (message: string, meta?: any): void {
    if (this.level >= LogLevel.Warn) {
      console.warn('[light-query] WARN:', message, meta)
    }
  }

  info (message: string, meta?: any): void {
    if (this.level >= LogLevel.Info) {
      console.info('[light-query] INFO:', message, meta)
    }
  }

  debug (message: string, meta?: any): void {
    if (this.level >= LogLevel.Debug) {
      console.debug('[light-query] DEBUG:', message, meta)
    }
  }
}
