import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到控制台（详细信息）
    console.error("=== 错误边界捕获到错误 ===");
    console.error("错误名称:", error.name);
    console.error("错误信息:", error.message);
    console.error("错误堆栈:", error.stack);
    console.error("组件堆栈:", errorInfo.componentStack);
    console.error("时间戳:", new Date().toISOString());
    console.error("========================");

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4 font-bold">出现了一个错误</h2>
            <p className="text-muted-foreground mb-4">应用程序遇到了意外错误</p>

            {this.state.error && (
              <div className="p-4 w-full rounded bg-red-50 border border-red-200 overflow-auto mb-4">
                <h3 className="font-semibold text-red-900 mb-2">错误详情：</h3>
                <p className="text-red-800 font-mono text-sm mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-red-700 font-medium hover:text-red-900">
                      查看完整堆栈信息
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {this.state.errorInfo && (
              <details className="p-4 w-full rounded bg-gray-50 border border-gray-200 overflow-auto mb-4">
                <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900">
                  查看组件堆栈信息
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="p-4 w-full rounded bg-blue-50 border border-blue-200 mb-4">
              <p className="text-sm text-blue-900">
                <strong>提示：</strong>请将上述错误信息截图或复制，以便技术人员快速定位问题。
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
