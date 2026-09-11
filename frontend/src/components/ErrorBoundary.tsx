import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught flight telemetry failure:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    window.location.reload();
  };

  private handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage", e);
    }
    window.location.href = "/";
  };

  private handleCopyLog = () => {
    const log = `[AIRFARE-INDEX-INCIDENT-LOG]\nTime: ${new Date().toISOString()}\nError: ${
      this.state.error?.message
    }\nStack: ${this.state.error?.stack || ""}\nComponentStack: ${
      this.state.errorInfo?.componentStack || ""
    }`;
    navigator.clipboard.writeText(log).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-screen" role="alert">
          <div className="error-boundary-card">
            <div className="error-icon-box">
              <AlertTriangle size={36} className="error-pulse-icon" />
            </div>

            <div className="error-header-group">
              <div className="error-code-badge">
                <span>INCIDENT CODE: ERR_AIRFARE_RUNTIME_FAULT</span>
              </div>
              <h1 className="error-main-title">Telemetry Stream Anomaly Detected</h1>
              <p className="error-description">
                The command center encountered an unhandled exception while processing civil aviation telemetry. The fault has been isolated to prevent corruption.
              </p>
            </div>

            {/* Error Black Box Log */}
            <div className="error-blackbox">
              <div className="blackbox-header">
                <span className="blackbox-title">BLACK BOX INCIDENT TRACE</span>
                <button
                  className="btn-copy-log"
                  onClick={this.handleCopyLog}
                  title="Copy incident report to clipboard"
                >
                  {this.state.copied ? <Check size={12} /> : <Copy size={12} />}
                  {this.state.copied ? "Copied" : "Copy Trace"}
                </button>
              </div>
              <div className="blackbox-content">
                <p className="blackbox-error-msg">
                  {this.state.error?.toString() || "Unknown telemetry render failure"}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="blackbox-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="error-actions-row">
              <button className="btn-error-primary" onClick={this.handleReset}>
                <RefreshCw size={15} />
                Relaunch Telemetry Dashboard
              </button>

              <button className="btn-error-secondary" onClick={this.handleClearCache}>
                <Trash2 size={15} />
                Clear Local Cache & Relaunch
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
