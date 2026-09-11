import React, { useEffect, useState } from "react";
import { Plane, Radio, ShieldCheck, Activity } from "lucide-react";

interface LoadingScreenProps {
  progress?: number;
  statusText?: string;
  onFinished?: () => void;
}

const INITIALIZATION_STEPS = [
  "Connecting to Indian Civil Aviation Telemetry Grid...",
  "Calibrating DGCA Laspeyres basket weights across 10 domestic corridors...",
  "Ingesting verified flight quotes with IQR outlier filtering...",
  "Synthesizing national airfare price matrix & fair-fare thresholds...",
  "Finalizing dashboard telemetry streams...",
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress: externalProgress,
  statusText: externalStatus,
}) => {
  const [internalProgress, setInternalProgress] = useState(12);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (externalProgress !== undefined) return;

    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        const increment = Math.floor(Math.random() * 14) + 8;
        const nextVal = Math.min(prev + increment, 95);
        const nextStep = Math.min(
          Math.floor((nextVal / 100) * INITIALIZATION_STEPS.length),
          INITIALIZATION_STEPS.length - 1
        );
        setStepIndex(nextStep);
        return nextVal;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [externalProgress]);

  const activeProgress = externalProgress !== undefined ? externalProgress : internalProgress;
  const activeStatus =
    externalStatus || INITIALIZATION_STEPS[stepIndex] || "Synchronizing Civil Aviation Index...";

  return (
    <div className="loading-screen-container" role="status" aria-live="polite">
      {/* Background HUD Grid */}
      <div className="loading-grid-overlay" />

      {/* Center Command Terminal */}
      <div className="loading-card">
        {/* Radar Circular Sweep */}
        <div className="radar-circle-wrapper">
          <div className="radar-circle">
            <div className="radar-sweep-beam" />
            <div className="radar-ring radar-ring-1" />
            <div className="radar-ring radar-ring-2" />
            <div className="radar-ring radar-ring-3" />
            <div className="radar-crosshair-h" />
            <div className="radar-crosshair-v" />
            <div className="radar-ping-dot ping-1" />
            <div className="radar-ping-dot ping-2" />
            <div className="radar-ping-dot ping-3" />
            <div className="radar-center-plane">
              <Plane size={24} className="radar-plane-icon" />
            </div>
          </div>
        </div>

        {/* Title & Brand */}
        <div className="loading-brand-group">
          <div className="loading-badge">
            <Radio size={12} className="radar-blink" />
            <span>SIH26056 / DGCA TELEMETRY</span>
          </div>
          <h2 className="loading-title">Airfare Price Index for India</h2>
          <p className="loading-subtitle">
            Statistical Laspeyres & Jevons Civil Aviation Price Intelligence
          </p>
        </div>

        {/* Progress Bar & Telemetry Status */}
        <div className="loading-progress-box">
          <div className="loading-status-row">
            <span className="loading-step-text">
              <Activity size={13} className="spin-slow" />
              {activeStatus}
            </span>
            <span className="loading-percent-text">{Math.round(activeProgress)}%</span>
          </div>

          <div className="loading-bar-track">
            <div
              className="loading-bar-fill"
              style={{ width: `${Math.min(activeProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* System Diagnostics Metrics */}
        <div className="loading-diagnostics">
          <div className="diag-item">
            <span className="diag-label">SYSTEM STATUS</span>
            <span className="diag-val online">
              <ShieldCheck size={12} /> ETL ACTIVE
            </span>
          </div>
          <div className="diag-item">
            <span className="diag-label">BASKET BASE</span>
            <span className="diag-val">JAN 2025 = 100</span>
          </div>
          <div className="diag-item">
            <span className="diag-label">DATA CORRIDORS</span>
            <span className="diag-val">10 METRO HIGHWAYS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
