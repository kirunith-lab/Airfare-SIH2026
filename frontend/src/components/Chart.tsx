import React, { useState } from "react";

export interface DataPoint {
  date: string;
  value1: number;
  value2?: number;
  annotation?: string | null;
}

interface ChartProps {
  data: DataPoint[];
  label1: string;
  label2?: string;
  color1?: string;
  color2?: string;
  unit?: string;
  height?: number;
  showAnnotations?: boolean;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  label1,
  label2,
  color1 = "#38bdf8", // Sky blue
  color2 = "#a855f7", // Violet / purple
  unit = "",
  height = 260,
  showAnnotations = true,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">No series data available</div>;
  }

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const width = 720; // Internal coordinate width

  const allVals = data.flatMap((d) => [d.value1, ...(d.value2 !== undefined ? [d.value2] : [])]);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);

  // Pad domain
  const yMin = Math.floor(rawMin * 0.95);
  const yMax = Math.ceil(rawMax * 1.05);
  const yRange = yMax - yMin || 1;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft;
    return paddingLeft + (index / (data.length - 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (val: number) => {
    const norm = (val - yMin) / yRange;
    return height - paddingBottom - norm * (height - paddingTop - paddingBottom);
  };

  // Generate SVG path for line 1
  const path1 = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.value1).toFixed(1)}`)
    .join(" ");

  // Gradient area path for line 1
  const area1 = `${path1} L ${getX(data.length - 1).toFixed(1)} ${height - paddingBottom} L ${getX(0).toFixed(1)} ${height - paddingBottom} Z`;

  // Path for line 2
  const hasLine2 = label2 && data.some((d) => d.value2 !== undefined);
  const path2 = hasLine2
    ? data
        .filter((d) => d.value2 !== undefined)
        .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(d.value2!).toFixed(1)}`)
        .join(" ")
    : "";

  // Y-axis ticks (4 ticks)
  const yTicks = [yMin, yMin + yRange * 0.33, yMin + yRange * 0.66, yMax];

  // X-axis label sampling (up to 6 labels)
  const step = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const hovered = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <div className="svg-chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: color1 }} />
          <span className="legend-label">{label1}</span>
        </div>
        {hasLine2 && (
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color2 }} />
            <span className="legend-label">{label2}</span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="interactive-svg"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`grad-${label1}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color1} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const yPos = getY(tick);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={yPos + 4}
                fill="rgba(255, 255, 255, 0.45)"
                fontSize="11"
                textAnchor="end"
                fontFamily="'JetBrains Mono', monospace"
              >
                {tick.toFixed(0)}
                {unit}
              </text>
            </g>
          );
        })}

        {/* Area fill for series 1 */}
        <path d={area1} fill={`url(#grad-${label1})`} />

        {/* Line 1 */}
        <path d={path1} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Line 2 */}
        {hasLine2 && (
          <path
            d={path2}
            fill="none"
            stroke={color2}
            strokeWidth="2.2"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Annotations pins on baseline */}
        {showAnnotations &&
          data.map((d, i) => {
            if (!d.annotation) return null;
            const x = getX(i);
            const y = getY(d.value1);
            return (
              <g key={`annot-${i}`} className="chart-annotation-pin">
                <line x1={x} y1={y} x2={x} y2={height - paddingBottom} stroke="rgba(251, 191, 36, 0.4)" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={x} cy={y} r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
              </g>
            );
          })}

        {/* X axis labels */}
        {xTicks.map((d, idx) => {
          const originalIdx = data.indexOf(d);
          const x = getX(originalIdx);
          const displayDate = d.date.length > 7 ? d.date.slice(5) : d.date;
          return (
            <text
              key={idx}
              x={x}
              y={height - 12}
              fill="rgba(255, 255, 255, 0.45)"
              fontSize="10.5"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
            >
              {displayDate}
            </text>
          );
        })}

        {/* Interactive Hover Vertical Line & Points */}
        {hoverIndex !== null && (
          <g className="hover-elements">
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={height - paddingBottom}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            <circle
              cx={getX(hoverIndex)}
              cy={getY(data[hoverIndex].value1)}
              r="5.5"
              fill={color1}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {hasLine2 && data[hoverIndex].value2 !== undefined && (
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].value2!)}
                r="5.5"
                fill={color2}
                stroke="#0f172a"
                strokeWidth="2"
              />
            )}
          </g>
        )}

        {/* Transparent catch areas for hover */}
        {data.map((_, i) => {
          const x = getX(i);
          const w = (width - paddingLeft - paddingRight) / data.length;
          return (
            <rect
              key={i}
              x={x - w / 2}
              y={0}
              width={w}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hovered && (
        <div className="chart-tooltip-badge">
          <div className="tooltip-date">{hovered.date}</div>
          <div className="tooltip-row">
            <span style={{ color: color1 }}>{label1}:</span>
            <strong>
              {hovered.value1.toFixed(2)}
              {unit}
            </strong>
          </div>
          {hasLine2 && hovered.value2 !== undefined && (
            <div className="tooltip-row">
              <span style={{ color: color2 }}>{label2}:</span>
              <strong>
                {hovered.value2.toFixed(2)}
                {unit}
              </strong>
            </div>
          )}
          {hovered.annotation && (
            <div className="tooltip-annotation">
              <span>📍 {hovered.annotation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
