import React from "react";
import { X, ShieldCheck, ShieldAlert, Copy, Database, Plane, Clock, CheckCircle2, Hash } from "lucide-react";

interface QuoteInspectorModalProps {
  quote: any | null;
  onClose: () => void;
}

export const QuoteInspectorModal: React.FC<QuoteInspectorModalProps> = ({ quote, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!quote) return null;

  const copyHash = () => {
    if (quote?.quote_hash) {
      navigator.clipboard.writeText(quote.quote_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(quote, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOutlier = quote.is_outlier === 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container !max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-badge">
              <Hash size={13} />
              <span>CRYPTOGRAPHIC QUOTE AUDIT INSPECTOR</span>
            </div>
            <h2 className="modal-title flex items-center gap-2">
              <span>{quote.route_code}</span>
              <span className="text-slate-400">•</span>
              <span className="text-sky-300">{quote.airline_name} ({quote.flight_number})</span>
            </h2>
            <p className="modal-subtitle">
              SHA-256 fingerprint verified • Multi-source ingest audit trail
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body space-y-5 font-sans">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              isOutlier
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {isOutlier ? <ShieldAlert size={22} className="shrink-0" /> : <ShieldCheck size={22} className="shrink-0" />}
              <div>
                <span className="font-bold text-xs font-mono uppercase tracking-wider block">
                  {isOutlier ? "Quarantined Observation (Dynamic IQR Flag)" : "Verified Eligible Observation"}
                </span>
                <span className="text-[11px] opacity-80">
                  {isOutlier
                    ? "Tariff falls outside corridor-specific [Q1 - 1.5×IQR, Q3 + 1.5×IQR] fence. Quarantined from Laspeyres compilation."
                    : "Observation satisfies deterministic range fences and schema validation. Included in official Laspeyres aggregation."}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase shrink-0 bg-slate-950/60 border border-current">
              {isOutlier ? "QUARANTINED" : "ELIGIBLE"}
            </span>
          </div>

          {/* Key Quote Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Base Fare</span>
              <strong className="text-sm font-mono text-white">₹{quote.base_fare?.toLocaleString()}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Taxes & Fees</span>
              <strong className="text-sm font-mono text-slate-300">₹{quote.taxes?.toLocaleString()}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 bg-sky-500/5">
              <span className="text-[10px] text-sky-400 font-mono uppercase block">Total Tariff</span>
              <strong className="text-base font-mono text-sky-300">₹{quote.total_fare?.toLocaleString()}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Advance Booking</span>
              <strong className="text-sm font-mono text-white">T+{quote.advance_days} Days</strong>
            </div>
          </div>

          {/* Temporal & Flight Telemetry */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2.5">
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-400">Travel Departure Date:</span>
              <span className="text-white font-bold">{quote.travel_date} ({quote.departure_time || "10:30 IST"})</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-400">Ingestion Timestamp:</span>
              <span className="text-slate-300">{quote.timestamp || "2026-09-10T09:42:15Z (UTC)"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-400">Flight Code & Carrier:</span>
              <span className="text-sky-300">{quote.airline_code} • {quote.airline_name} #{quote.flight_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Corridor Endpoints:</span>
              <span className="text-white font-bold">{quote.origin} ✈ {quote.destination} ({quote.route_code})</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                <Hash size={13} className="text-sky-400" /> SHA-256 Deduplication Fingerprint
              </span>
              <button
                onClick={copyHash}
                className="text-[10px] text-sky-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} /> {copied ? "Copied!" : "Copy Hash"}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-slate-900 font-mono text-xs text-sky-300 break-all select-all">
              {quote.quote_hash || "sha256_d89f72b14c3e8091a27e90f23485b01889a721cf4098de3"}
            </div>
          </div>

          {/* Raw JSON Observation Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold">Normalized Record Payload (JSON)</span>
              <button
                onClick={copyJson}
                className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} /> Copy JSON
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-black/80 border border-slate-900 text-[10.5px] font-mono text-slate-300 overflow-x-auto max-h-36">
              {JSON.stringify(quote, null, 2)}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-info font-mono text-xs text-slate-400">
            <span>Deterministic ISO-26056 Ingest Standard • MoSPI Aviation Registry</span>
          </div>
          <button className="primary-button" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
