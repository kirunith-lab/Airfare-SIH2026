import React, { useState } from "react";

export interface BarItem {
  label: string;
  value: number;
  secondaryValue?: number;
  highlight?: boolean;
  tooltipExtra?: string;
}

interface BarChartProps {
  items: BarItem[];
  unit?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  items,
  unit = "₹",
  height = 240,
}) => {
  const [activeItem, setActiveItem] = useState<BarItem | null>(null);

  if (!items || items.length === 0) {
    return <div className="chart-empty">No bar data available</div>;
  }

  const values = items.map((d) => d.value);
  const maxVal = Math.max(...values) * 1.15;

  return (
    <div className="barchart-wrapper">
      <div className="barchart-container" style={{ height: `${height}px` }}>
        {items.map((item, idx) => {
          const heightPct = Math.max(12, (item.value / maxVal) * 100);
          return (
            <div
              key={idx}
              className={`barchart-col ${item.highlight ? "highlight" : ""}`}
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <div className="bar-val-top">
                {unit}
                {item.value.toLocaleString()}
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    height: `${heightPct}%`,
                    background: item.highlight
                      ? "linear-gradient(180deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)",
                  }}
                />
              </div>
              <div className="bar-label">{item.label}</div>
              {item.highlight && <div className="sweet-spot-tag">Sweet Spot</div>}
            </div>
          );
        })}
      </div>

      {activeItem && (
        <div className="barchart-hover-card">
          <strong>{activeItem.label}</strong>: {unit}
          {activeItem.value.toLocaleString()} median fare
          {activeItem.tooltipExtra && <span> — {activeItem.tooltipExtra}</span>}
        </div>
      )}
    </div>
  );
};
