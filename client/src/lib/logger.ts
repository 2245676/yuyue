/**
 * 前端日志工具
 * 提供统一的日志记录接口，包含详细的上下文信息
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context, null, 2) : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr ? `\n${contextStr}` : ""}`;
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
    
    // 在生产环境中，可以发送到日志服务
    if (!this.isDevelopment) {
      this.sendToLoggingService(message, error, context);
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage("debug", message, context);
      console.debug(formatted);
    }
  }

  /**
   * 记录 API 请求
   */
  logApiRequest(method: string, url: string, data?: any) {
    this.debug(`API Request: ${method} ${url}`, {
      method,
      url,
      data,
    });
  }

  /**
   * 记录 API 响应
   */
  logApiResponse(method: string, url: string, status: number, data?: any) {
    this.debug(`API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      data,
    });
  }

  /**
   * 记录 API 错误
   */
  logApiError(method: string, url: string, error: Error) {
    this.error(`API Error: ${method} ${url}`, error, {
      method,
      url,
    });
  }

  /**
   * 记录用户操作
   */
  logUserAction(action: string, details?: any) {
    this.info(`User Action: ${action}`, {
      action,
      ...details,
    });
  }

  /**
   * 发送到日志服务（生产环境）
   */
  private sendToLoggingService(message: string, error?: Error, context?: LogContext) {
    // 这里可以集成第三方日志服务，如 Sentry、LogRocket 等
    // 示例：
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message,
    //     error: error ? {
    //       name: error.name,
    //       message: error.message,
    //       stack: error.stack,
    //     } : null,
    //     context,
    //     timestamp: new Date().toISOString(),
    //     userAgent: navigator.userAgent,
    //     url: window.location.href,
    //   }),
    // });
  }
}

export const logger = new Logger();
