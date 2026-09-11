import React from "react";
import {
  X,
  GitFork,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  Filter,
  ArrowRight,
  Calculator,
} from "lucide-react";

interface LineageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineageModal: React.FC<LineageModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const lineageSteps = [
    {
      level: "Level 1",
      title: "Multi-Source Intake & Ingestion",
      badge: "INGESTION",
      badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
      icon: Database,
      desc: "Scrapes & streams raw commercial airfare quote payloads from airline booking systems, GDS feeds, and public tariff aggregators across 10 trunk domestic corridors.",
      telemetry: "18,900+ Raw Observations • 100% DGCA Monitored Corridors",
      outputs: ["Raw total fare", "Base fare breakdown", "Taxes / UDAN fees", "Cabin class", "Departure epoch"],
    },
    {
      level: "Level 2",
      title: "Schema Normalization & Standardization",
      badge: "TRANSFORMATION",
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      icon: Cpu,
      desc: "Validates schema integrity, strips currency symbols (₹, INR), standardizes to Indian Rupee (INR), aligns UTC timestamps to Indian Standard Time (IST), and uppercases IATA airport codes.",
      telemetry: "100% ISO Standardized • Zero Missing Value Tolerance",
      outputs: ["Canonical IATA (DEL, BOM)", "Normalized float total_fare", "Advance booking days (D - n)"],
    },
    {
      level: "Level 3",
      title: "Deterministic SHA-256 Deduplication",
      badge: "DEDUPLICATION",
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      icon: Filter,
      desc: "Computes a unique 24-character SHA-256 hash fingerprint on (origin, destination, airline_code, flight_number, travel_date, departure_time, collection_date). Identical multi-scraper quotes are instantly bypassed.",
      telemetry: "272 Redundant Quotes Dropped • 0% Double Counting",
      outputs: ["Unique quote_hash", "Idempotent database write", "Storage efficiency"],
    },
    {
      level: "Level 4",
      title: "Corridor-Specific Dynamic IQR Outlier Filter",
      badge: "QUALITY AUDIT",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      icon: ShieldCheck,
      desc: "Applies two-tier statistical safety: first, fixed corridor domain bounds (e.g. DEL-BOM ₹2,500–₹18,000); second, dynamic rolling Interquartile Range [Q1 - 1.5 IQR, Q3 + 1.5 IQR]. Outliers are quarantined with full audit reasoning.",
      telemetry: "318 Outliers Quarantined • 98.8% Statistical Confidence",
      outputs: ["is_outlier = 0 (Eligible for Index)", "is_outlier = 1 (Quarantined Log)"],
    },
    {
      level: "Level 5",
      title: "Laspeyres & Jevons Index Compilation",
      badge: "MoSPI POLICY CORE",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      icon: Calculator,
      desc: "Feeds clean observations into the weighted Laspeyres Price Index formula calibrated with official DGCA city-pair passenger volume weights (DEL-BOM 16%, DEL-BLR 13%, etc.) and complementary Jevons geometric mean.",
      telemetry: "Daily & Monthly Aggregations • Base Period Jan 2025 = 100.00",
      outputs: ["National Airfare Price Index (APIx)", "MoM & YoY Rates of Change", "DGCA Passenger Yield Backtesting"],
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-lineage" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-badge">
              <GitFork size={14} className="text-sky-400" />
              <span>5-STAGE STATISTICAL DATA LINEAGE</span>
            </div>
            <h2 className="modal-title">End-to-End Civil Aviation Data Lineage</h2>
            <p className="modal-subtitle">
              Auditable transformation pipeline from raw web/GDS collection to official MoSPI CPI inflation augmentation.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="lineage-timeline">
            {lineageSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.level} className="lineage-step-card">
                  <div className="lineage-step-left">
                    <div className="lineage-icon-wrapper">
                      <Icon size={18} />
                    </div>
                    {idx < lineageSteps.length - 1 && <div className="lineage-connector" />}
                  </div>

                  <div className="lineage-step-content">
                    <div className="lineage-step-header">
                      <span className="lineage-step-number">{step.level}</span>
                      <h4 className="lineage-step-title">{step.title}</h4>
                      <span className={`lineage-step-badge ${step.badgeColor}`}>
                        {step.badge}
                      </span>
                    </div>

                    <p className="lineage-step-desc">{step.desc}</p>

                    <div className="lineage-step-telemetry">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>{step.telemetry}</span>
                    </div>

                    <div className="lineage-step-outputs">
                      {step.outputs.map((out) => (
                        <span key={out} className="lineage-output-tag">
                          {out}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-info">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Deterministic, reproducible, and verifiable under MoSPI National Statistical Commission standards.</span>
          </div>
          <button className="primary-button" onClick={onClose}>
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
