/**
 * Simple structured logger for CastService. Respects debug flag from config.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface CastLoggerOptions {
  prefix: string;
  debug?: boolean;
}

export class CastLogger {
  private _prefix: string;
  private _debug: boolean;

  constructor(options: CastLoggerOptions) {
    this._prefix = options.prefix;
    this._debug = options.debug ?? false;
  }

  setDebug(enabled: boolean): void {
    this._debug = enabled;
  }

  private _formatMessage(level: LogLevel, ...args: unknown[]): unknown[] {
    return [`${this._prefix}:`, `[${level}]`, ...args];
  }

  debug(...args: unknown[]): void {
    if (this._debug) {
      console.debug(...this._formatMessage('debug', ...args));
    }
  }

  info(...args: unknown[]): void {
    console.log(...this._formatMessage('info', ...args));
  }

  warn(...args: unknown[]): void {
    console.warn(...this._formatMessage('warn', ...args));
  }

  error(...args: unknown[]): void {
    console.error(...this._formatMessage('error', ...args));
  }
}
