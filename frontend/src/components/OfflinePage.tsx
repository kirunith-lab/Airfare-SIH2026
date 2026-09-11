import React, { useState } from "react";
import {
  WifiOff,
  RefreshCw,
  Database,
  ArrowRight,
  HelpCircle,
  Radio,
  Server,
  X,
} from "lucide-react";

interface OfflinePageProps {
  onRetry: () => Promise<boolean>;
  onLaunchOfflineMode: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const OfflinePage: React.FC<OfflinePageProps> = ({
  onRetry,
  onLaunchOfflineMode,
  onClose,
  isModal = false,
}) => {
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{
    tested: boolean;
    online: boolean;
    apiReachable: boolean;
    time: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setTestingPing(true);
    const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : false;
    const success = await onRetry();
    setPingResult({
      tested: true,
      online: browserOnline,
      apiReachable: success,
      time: new Date().toLocaleTimeString(),
    });
    setTestingPing(false);
  };

  return (
    <div className={isModal ? "offline-modal-overlay" : "offline-page-container"}>
      <div className="offline-page-card">
        {isModal && onClose && (
          <button className="modal-close-btn" onClick={onClose} title="Close Diagnostics">
            <X size={18} />
          </button>
        )}

        {/* Aviation Radar Disconnect Visual */}
        <div className="offline-radar-wrapper">
          <div className="offline-radar-ring ring-out" />
          <div className="offline-radar-ring ring-mid" />
          <div className="offline-radar-ring ring-inner" />
          <div className="offline-radar-center">
            <WifiOff size={38} className="offline-icon-pulse" />
          </div>
        </div>

        {/* Header */}
        <div className="offline-header">
          <div className="status-badge-offline">
            <span className="status-dot-offline" />
            TELEMETRY SIGNAL LOST
          </div>
          <h1 className="offline-title">Civil Aviation Telemetry Offline</h1>
          <p className="offline-subtitle">
            The platform cannot reach the live price index server. You may be disconnected from the internet, or the local FastAPI gateway process is paused.
          </p>
        </div>

        {/* Real-time Diagnostics Matrix */}
        <div className="offline-diagnostics-card">
          <div className="diag-header-row">
            <span className="diag-title">CONNECTION DIAGNOSTICS</span>
            {pingResult && (
              <span className="diag-timestamp">Last tested: {pingResult.time}</span>
            )}
          </div>

          <div className="diag-items-list">
            <div className="diag-row">
              <div className="diag-row-left">
                <Radio size={16} className="diag-icon" />
                <div>
                  <div className="diag-name">Browser Network Adapter</div>
                  <div className="diag-desc">Local LAN / Wi-Fi physical status</div>
                </div>
              </div>
              <span
                className={`diag-status-pill ${
                  typeof navigator !== "undefined" && navigator.onLine ? "ok" : "fail"
                }`}
              >
                {typeof navigator !== "undefined" && navigator.onLine ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            <div className="diag-row">
              <div className="diag-row-left">
                <Server size={16} className="diag-icon" />
                <div>
                  <div className="diag-name">FastAPI API Gateway</div>
                  <div className="diag-desc">Host endpoint: /api/health</div>
                </div>
              </div>
              <span
                className={`diag-status-pill ${
                  pingResult?.apiReachable ? "ok" : "fail"
                }`}
              >
                {pingResult?.apiReachable ? "OPERATIONAL (200 OK)" : "UNREACHABLE"}
              </span>
            </div>

            <div className="diag-row">
              <div className="diag-row-left">
                <Database size={16} className="diag-icon" />
                <div>
                  <div className="diag-name">Verified DGCA Prototype Dataset</div>
                  <div className="diag-desc">Local memory cache for offline exploration</div>
                </div>
              </div>
              <span className="diag-status-pill ok">READY (15,208 QUOTES)</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="offline-actions-group">
          <button
            className="btn-primary-glow"
            onClick={handleTestConnection}
            disabled={testingPing}
          >
            <RefreshCw size={15} className={testingPing ? "spin" : ""} />
            {testingPing ? "Pinging Telemetry Gateway..." : "Ping & Reconnect Telemetry"}
          </button>

          <button
            className="btn-offline-mode"
            onClick={() => {
              onLaunchOfflineMode();
              if (onClose) onClose();
            }}
          >
            <Database size={15} />
            Launch Offline Simulation Mode
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Troubleshooting Hints */}
        <div className="offline-hints">
          <div className="hint-title">
            <HelpCircle size={14} />
            Quick Recovery Steps:
          </div>
          <ul>
            <li>Check if your device is connected to Wi-Fi or mobile hotspot.</li>
            <li>If running locally, ensure backend server is active: <code>python -m uvicorn app.main:app --port 8000</code>.</li>
            <li>Click <strong>Launch Offline Simulation Mode</strong> to browse the complete index, 3D radar, and backtesting suite with zero internet required.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
