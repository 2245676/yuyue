/**
 * 后端日志工具
 * 提供统一的日志记录接口，包含详细的上下文信息
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    const formatted = this.formatMessage("info", message, context);
    console.log(formatted);
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage("warn", message, context);
    console.warn(formatted);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const formatted = this.formatMessage("error", message, {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
    console.error(formatted);
  }

  debug(message: string, context?: LogContext) {
    const formatted = this.formatMessage("debug", message, context);
    console.debug(formatted);
  }

  /**
   * 记录数据库操作
   */
  logDbOperation(operation: string, table: string, details?: any) {
    this.debug(`DB Operation: ${operation} on ${table}`, {
      operation,
      table,
      ...details,
    });
  }

  /**
   * 记录API请求
   */
  logApiRequest(method: string, path: string, userId?: string) {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      userId,
    });
  }

  /**
   * 记录API错误
   */
  logApiError(method: string, path: string, error: Error, userId?: string) {
    this.error(`API Error: ${method} ${path}`, error, {
      method,
      path,
      userId,
    });
  }
}

export const logger = new Logger();
