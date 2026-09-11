import React from "react";
import { Compass, RefreshCw, ArrowLeft, Radio, ServerCrash } from "lucide-react";

interface ErrorPageProps {
  type?: "404" | "500" | "network";
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBackToOverview?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  type = "404",
  title,
  message,
  onRetry,
  onBackToOverview,
}) => {
  const is404 = type === "404";
  const isNetwork = type === "network";

  const defaultTitle = is404
    ? "Waypoint Not Found (FL-404)"
    : isNetwork
    ? "Flight Telemetry Server Unreachable"
    : "500 Internal Calculation Fault";

  const defaultMsg = is404
    ? "The flight corridor, dataset slice, or route waypoint you requested does not exist in the civil aviation registry."
    : isNetwork
    ? "The frontend could not connect to the civil aviation price index backend at port 8000. Ensure the uvicorn process is running."
    : "An unexpected calculation error occurred while processing Laspeyres basket aggregation.";

  return (
    <div className="error-page-container">
      <div className="error-page-card">
        <div className="error-page-badge">
          <Radio size={12} className="radar-blink" />
          <span>CIVIL AVIATION TRAFFIC CONTROLLER</span>
        </div>

        <div className="error-code-huge">
          {is404 ? "404" : isNetwork ? "503" : "500"}
        </div>

        <h1 className="error-page-title">{title || defaultTitle}</h1>
        <p className="error-page-desc">{message || defaultMsg}</p>

        <div className="error-page-actions">
          {onRetry && (
            <button className="btn-primary-glow" onClick={onRetry}>
              <RefreshCw size={15} />
              Retry Telemetry Request
            </button>
          )}

          {onBackToOverview && (
            <button className="btn-error-secondary" onClick={onBackToOverview}>
              <ArrowLeft size={15} />
              Return to National Overview
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const InlineApiError: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = "Failed to synchronize data from the telemetry stream.",
  onRetry,
}) => {
  return (
    <div className="inline-api-error-card">
      <div className="inline-error-left">
        <ServerCrash size={18} className="inline-error-icon" />
        <div>
          <div className="inline-error-title">Stream Synchronization Failure</div>
          <div className="inline-error-msg">{message}</div>
        </div>
      </div>

      {onRetry && (
        <button className="btn-inline-retry" onClick={onRetry}>
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  );
};
