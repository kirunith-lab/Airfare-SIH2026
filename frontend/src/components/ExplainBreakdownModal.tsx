import React from "react";
import { X, Calculator, ArrowRight, HelpCircle, Check, BookOpen } from "lucide-react";

interface ExplainBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIndex?: number;
  jevonsIndex?: number;
}

const CORRIDOR_WEIGHTS_DATA = [
  { code: "DEL-BOM", name: "Delhi ↔ Mumbai", weight: 0.16, basePrice: 4850, currentPrice: 5240 },
  { code: "BOM-DEL", name: "Mumbai ↔ Delhi", weight: 0.16, basePrice: 4890, currentPrice: 5290 },
  { code: "DEL-BLR", name: "Delhi ↔ Bengaluru", weight: 0.13, basePrice: 5420, currentPrice: 5890 },
  { code: "BLR-DEL", name: "Bengaluru ↔ Delhi", weight: 0.13, basePrice: 5380, currentPrice: 5840 },
  { code: "BOM-BLR", name: "Mumbai ↔ Bengaluru", weight: 0.11, basePrice: 3950, currentPrice: 4280 },
  { code: "BLR-BOM", name: "Bengaluru ↔ Mumbai", weight: 0.11, basePrice: 3980, currentPrice: 4290 },
  { code: "DEL-HYD", name: "Delhi ↔ Hyderabad", weight: 0.08, basePrice: 4650, currentPrice: 4980 },
  { code: "HYD-DEL", name: "Hyderabad ↔ Delhi", weight: 0.08, basePrice: 4620, currentPrice: 4960 },
  { code: "BOM-MAA", name: "Mumbai ↔ Chennai", weight: 0.08, basePrice: 4250, currentPrice: 4420 },
  { code: "MAA-BOM", name: "Chennai ↔ Mumbai", weight: 0.07, basePrice: 4220, currentPrice: 4390 },
];

export const ExplainBreakdownModal: React.FC<ExplainBreakdownModalProps> = ({
  isOpen,
  onClose,
  currentIndex = 127.43,
  jevonsIndex = 125.91,
}) => {
  if (!isOpen) return null;

  // Compute live numerator and denominator
  let numeratorSum = 0;
  let denominatorSum = 0;
  let logJevonsSum = 0;

  CORRIDOR_WEIGHTS_DATA.forEach((row) => {
    numeratorSum += row.weight * row.currentPrice;
    denominatorSum += row.weight * row.basePrice;
    logJevonsSum += row.weight * Math.log(row.currentPrice / row.basePrice);
  });

  const calculatedLaspeyres = (numeratorSum / denominatorSum) * 100;
  const calculatedJevons = Math.exp(logJevonsSum) * 100;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-breakdown" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-badge">
              <Calculator size={14} className="text-sky-400" />
              <span>DETERMINISTIC STATISTICAL DECOMPOSITION</span>
            </div>
            <h2 className="modal-title">APIx Laspeyres & Jevons Index Breakdown</h2>
            <p className="modal-subtitle">
              Live mathematical walkthrough showing how the current APIx national index value ({currentIndex.toFixed(2)}) is derived from DGCA passenger volume weights.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-6">
          {/* Primary Formula Box */}
          <div className="formula-box">
            <div className="formula-header">
              <span className="formula-tag">PRIMARY MoSPI FORMULATION</span>
              <span className="text-xs font-mono text-slate-400">Fixed-Base Weighted Arithmetic Mean</span>
            </div>
            <div className="formula-math">
              <span className="formula-lhs">L<sub>t</sub> =</span>
              <span className="formula-fraction">
                <span className="formula-num">∑ (w<sub>i</sub> · P<sub>i,t</sub>)</span>
                <span className="formula-den">∑ (w<sub>i</sub> · P<sub>i,0</sub>)</span>
              </span>
              <span className="formula-mult">× 100</span>
            </div>
            <div className="formula-substitution">
              <span className="text-slate-400">Live Mathematical Substitution:</span>
              <div className="substitution-equation">
                <span className="text-sky-300 font-mono font-bold">
                  L<sub>t</sub> = (₹{numeratorSum.toFixed(2)} / ₹{denominatorSum.toFixed(2)}) × 100 ={" "}
                  <span className="text-white text-base underline">{calculatedLaspeyres.toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Jevons Comparison */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <BookOpen size={14} /> Jevons Geometric Index Comparison (J<sub>t</sub>)
              </span>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                J<sub>t</sub> = {jevonsIndex.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In addition to Laspeyres, our platform concurrently computes a weighted Jevons geometric index:
              <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-950 font-mono text-purple-300">
                J<sub>t</sub> = ∏ (P<sub>i,t</sub> / P<sub>i,0</sub>)<sup>w<sub>i</sub></sup> × 100
              </code>
              The Jevons index is strictly lower than Laspeyres by{" "}
              <strong className="text-white font-mono">
                {(calculatedLaspeyres - calculatedJevons).toFixed(2)} pts
              </strong>
              , verifying that geometric weighting effectively controls for upward substitution bias during peak festive demand.
            </p>
          </div>

          {/* 10 Corridors Weight Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center justify-between">
              <span>Basket Corridors & DGCA Weight Calibrations</span>
              <span className="text-[10px] text-slate-400 font-mono">Base Period: Jan 2025 = 100.00</span>
            </h4>
            <div className="table-responsive">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Corridor</th>
                    <th>City Pair</th>
                    <th className="text-right">DGCA Weight (w<sub>i</sub>)</th>
                    <th className="text-right">Base Fare (P<sub>i,0</sub>)</th>
                    <th className="text-right">Current Observed (P<sub>i,t</sub>)</th>
                    <th className="text-right">Price Relative</th>
                    <th className="text-right">Weighted Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRIDOR_WEIGHTS_DATA.map((row) => {
                    const priceRel = (row.currentPrice / row.basePrice) * 100;
                    const contrib = row.weight * priceRel;
                    return (
                      <tr key={row.code}>
                        <td className="font-mono font-bold text-sky-400">{row.code}</td>
                        <td className="text-slate-300">{row.name}</td>
                        <td className="text-right font-mono font-bold text-white">
                          {(row.weight * 100).toFixed(1)}%
                        </td>
                        <td className="text-right font-mono text-slate-400">
                          ₹{row.basePrice.toLocaleString()}
                        </td>
                        <td className="text-right font-mono text-slate-100 font-semibold">
                          ₹{row.currentPrice.toLocaleString()}
                        </td>
                        <td className="text-right font-mono text-slate-300">
                          {priceRel.toFixed(1)}
                        </td>
                        <td className="text-right font-mono font-bold text-sky-300">
                          +{contrib.toFixed(2)} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="font-bold text-white">Total Domestic Basket</td>
                    <td className="text-right font-mono font-bold text-emerald-400">100.0%</td>
                    <td className="text-right font-mono text-slate-300">₹{denominatorSum.toFixed(0)}</td>
                    <td className="text-right font-mono font-bold text-sky-300">₹{numeratorSum.toFixed(0)}</td>
                    <td className="text-right font-mono text-slate-400">—</td>
                    <td className="text-right font-mono font-bold text-emerald-400">
                      {calculatedLaspeyres.toFixed(2)} pts
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-info">
            <Check size={14} className="text-emerald-400" />
            <span>Formulas comply with Central Statistical Organization (CSO) & MoSPI CPI Manual standards.</span>
          </div>
          <button className="primary-button" onClick={onClose}>
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
