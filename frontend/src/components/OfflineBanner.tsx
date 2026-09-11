import React from "react";
import { WifiOff, Wifi, RefreshCw, Database, Eye } from "lucide-react";

interface OfflineBannerProps {
  isOffline: boolean;
  isReconnecting: boolean;
  retryCountdown: number;
  onRetry: () => void;
  isOfflineModeActive: boolean;
  onToggleOfflineMode: () => void;
  onOpenDiagnostics: () => void;
  justReconnected?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  isReconnecting,
  retryCountdown,
  onRetry,
  isOfflineModeActive,
  onToggleOfflineMode,
  onOpenDiagnostics,
  justReconnected = false,
}) => {
  if (!isOffline && !justReconnected && !isOfflineModeActive) {
    return null;
  }

  if (justReconnected) {
    return (
      <aside aria-label="System status notice" className="offline-banner reconnected-banner">
        <div className="banner-content">
          <span className="banner-icon-badge success">
            <Wifi size={14} />
          </span>
          <span className="banner-text">
            <strong>Signal Restored:</strong> Online civil aviation telemetry link active. Syncing live quotes...
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="System offline warning" className={`offline-banner ${isOfflineModeActive ? "sim-mode-banner" : "warning-banner"}`}>
      <div className="banner-content">
        <span className={`banner-icon-badge ${isOfflineModeActive ? "info" : "alert"}`}>
          {isOfflineModeActive ? <Database size={14} /> : <WifiOff size={14} />}
        </span>

        <div className="banner-text-block">
          <div className="banner-primary-line">
            {isOfflineModeActive ? (
              <>
                <strong>Offline Simulation Mode:</strong> Browsing preloaded DGCA baseline dataset (15,208 quotes).
              </>
            ) : (
              <>
                <strong>Telemetry Disconnected:</strong> No internet or backend telemetry link detected.
              </>
            )}
          </div>
          {!isOfflineModeActive && (
            <div className="banner-secondary-line">
              {isReconnecting ? (
                <span>Checking gateway connection...</span>
              ) : (
                <span>Auto-reconnecting in {retryCountdown}s</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="banner-actions">
        <button
          className="banner-action-btn retry"
          onClick={onRetry}
          disabled={isReconnecting}
          title="Attempt manual reconnect to gateway"
        >
          <RefreshCw size={13} className={isReconnecting ? "spin" : ""} />
          {isReconnecting ? "Pinging..." : "Retry Now"}
        </button>

        <button
          className="banner-action-btn mode-toggle"
          onClick={onToggleOfflineMode}
          title={isOfflineModeActive ? "Switch back to Live API Telemetry" : "Load verified offline DGCA mock data"}
        >
          <Database size={13} />
          {isOfflineModeActive ? "Exit Demo" : "Offline Demo"}
        </button>

        <button
          className="banner-action-btn inspect"
          onClick={onOpenDiagnostics}
          title="Open connection diagnostics terminal"
        >
          <Eye size={13} />
          Diagnostics
        </button>
      </div>
    </aside>
  );
};
