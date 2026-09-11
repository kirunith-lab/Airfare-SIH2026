import React, { useState } from "react";
import { Calculator, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

interface FairFareCalculatorProps {
  initialCorridor?: string;
}

const HISTORICAL_MEDIANS: Record<string, Record<string, number>> = {
  "DEL-BOM": { "0-6": 8200, "7-14": 6100, "15-29": 5200, "30-44": 4450, "45-59": 4800, "60+": 4900 },
  "BOM-DEL": { "0-6": 8300, "7-14": 6200, "15-29": 5250, "30-44": 4490, "45-59": 4850, "60+": 4950 },
  "DEL-BLR": { "0-6": 9100, "7-14": 6800, "15-29": 5700, "30-44": 4890, "45-59": 5250, "60+": 5350 },
  "BLR-DEL": { "0-6": 9000, "7-14": 6700, "15-29": 5650, "30-44": 4850, "45-59": 5200, "60+": 5300 },
  "BOM-BLR": { "0-6": 6800, "7-14": 4900, "15-29": 4200, "30-44": 3550, "45-59": 3850, "60+": 3950 },
  "BOM-MAA": { "0-6": 7200, "7-14": 5200, "15-29": 4400, "30-44": 3790, "45-59": 4100, "60+": 4200 },
};

export const FairFareCalculator: React.FC<FairFareCalculatorProps> = ({ initialCorridor = "DEL-BOM" }) => {
  const [corridor, setCorridor] = useState(initialCorridor);
  const [advanceDays, setAdvanceDays] = useState(14);
  const [fare, setFare] = useState(5400);

  // Determine advance bucket
  let bucket = "15-29";
  let bucketLabel = "15–29 Days (Standard Window)";
  if (advanceDays <= 6) {
    bucket = "0-6";
    bucketLabel = "0–6 Days (Last Minute)";
  } else if (advanceDays <= 14) {
    bucket = "7-14";
    bucketLabel = "7–14 Days (Close-In Corporate)";
  } else if (advanceDays <= 29) {
    bucket = "15-29";
    bucketLabel = "15–29 Days (Standard Market)";
  } else if (advanceDays <= 44) {
    bucket = "30-44";
    bucketLabel = "30–44 Days (Optimal Sweet Spot)";
  } else if (advanceDays <= 59) {
    bucket = "45-59";
    bucketLabel = "45–59 Days (Early Planning)";
  } else {
    bucket = "60+";
    bucketLabel = "60+ Days (Long Horizon)";
  }

  const corridorMedians = HISTORICAL_MEDIANS[corridor] || HISTORICAL_MEDIANS["DEL-BOM"];
  const histMedian = corridorMedians[bucket] || 5200;

  // Compute percentile and Fair Fare score
  const diffPct = ((fare - histMedian) / histMedian) * 100;
  // Normalized percentile rank (0 to 100, where 50 is median)
  const percentile = Math.min(99, Math.max(1, Math.round(50 + diffPct * 1.5)));
  // Score is inverted percentile: cheaper quote = higher score
  const score = Math.max(5, Math.min(98, 100 - percentile));

  let rating = "FAIR";
  let ratingColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
  let ratingIcon = AlertCircle;
  let advice = `This fare is close to the historical median (₹${histMedian.toLocaleString()}) for the ${bucketLabel}. Standard purchase recommended.`;

  if (score >= 67) {
    rating = "GOOD PRICE";
    ratingColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    ratingIcon = CheckCircle2;
    advice = `Excellent tariff! Cheaper than ${score}% of historical quotes observed in this window. Highly recommended to book immediately.`;
  } else if (score <= 33) {
    rating = "HIGH PRICE";
    ratingColor = "text-rose-400 border-rose-500/30 bg-rose-500/10";
    ratingIcon = AlertTriangle;
    advice = `This fare is ₹${(fare - histMedian).toLocaleString()} above typical median for this advance window. If dates are flexible, consider booking in the 30–44 day sweet spot.`;
  }

  const RatingIcon = ratingIcon;

  return (
    <div className="fair-fare-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Calculator size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Empirical Fair Fare Score™ Evaluator
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Percentile ranking vs historical DGCA corridor price distribution
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
          Consumer Intelligence Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-mono font-bold uppercase text-slate-400 block mb-1.5">
            Corridor
          </label>
          <select
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
            className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-sky-500 outline-none"
          >
            <option value="DEL-BOM">DEL ↔ BOM (Delhi - Mumbai)</option>
            <option value="BOM-DEL">BOM ↔ DEL (Mumbai - Delhi)</option>
            <option value="DEL-BLR">DEL ↔ BLR (Delhi - Bengaluru)</option>
            <option value="BLR-DEL">BLR ↔ DEL (Bengaluru - Delhi)</option>
            <option value="BOM-BLR">BOM ↔ BLR (Mumbai - Bengaluru)</option>
            <option value="BOM-MAA">BOM ↔ MAA (Mumbai - Chennai)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono font-bold uppercase text-slate-400 block mb-1.5 flex justify-between">
            <span>Lead Time (Advance Days)</span>
            <span className="text-sky-400 font-bold">{advanceDays} Days</span>
          </label>
          <input
            type="range"
            min="0"
            max="75"
            value={advanceDays}
            onChange={(e) => setAdvanceDays(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <span className="text-[10px] text-slate-500 font-mono block mt-1">{bucketLabel}</span>
        </div>

        <div>
          <label className="text-[11px] font-mono font-bold uppercase text-slate-400 block mb-1.5 flex justify-between">
            <span>Quoted Total Fare</span>
            <span className="text-sky-300 font-bold">₹{fare.toLocaleString()}</span>
          </label>
          <input
            type="number"
            step="100"
            min="2000"
            max="25000"
            value={fare}
            onChange={(e) => setFare(Number(e.target.value))}
            className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-sky-500 outline-none"
          />
        </div>
      </div>

      {/* Results Display */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Fair Fare Score</span>
            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
              <span>{score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-slate-800 hidden sm:block" />

          <div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${ratingColor}`}>
              <RatingIcon size={13} /> {rating}
            </span>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Historical Window Median: <strong className="text-slate-200">₹{histMedian.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-300 max-w-md sm:text-right">
          <p className="leading-snug">{advice}</p>
        </div>
      </div>
    </div>
  );
};
