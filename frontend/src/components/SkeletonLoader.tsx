import React from "react";

export const SkeletonBox: React.FC<{
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = "100%", height = "1rem", borderRadius = "6px", className = "", style = {} }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const MetricSkeleton: React.FC = () => {
  return (
    <div className="metric-card skeleton-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <SkeletonBox width="55%" height="0.8rem" />
        <SkeletonBox width="18px" height="18px" borderRadius="50%" />
      </div>
      <SkeletonBox width="70%" height="2rem" style={{ margin: "0.5rem 0" }} />
      <SkeletonBox width="45%" height="1.1rem" borderRadius="20px" style={{ marginBottom: "0.5rem" }} />
      <SkeletonBox width="80%" height="0.75rem" />
    </div>
  );
};

export const MetricsGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <MetricSkeleton key={i} />
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: string; title?: string }> = ({
  height = "320px",
  title = "Synchronizing Chart Telemetry...",
}) => {
  return (
    <div className="chart-card skeleton-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ width: "40%" }}>
          <SkeletonBox width="60%" height="1.2rem" style={{ marginBottom: "6px" }} />
          <SkeletonBox width="90%" height="0.75rem" />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <SkeletonBox width="70px" height="28px" borderRadius="6px" />
          <SkeletonBox width="70px" height="28px" borderRadius="6px" />
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: "14px",
          padding: "1rem",
          background: "rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
          border: "1px dashed rgba(255, 255, 255, 0.07)",
        }}
      >
        <div className="skeleton-chart-center-msg">
          <div className="spinner-sm" />
          <span>{title}</span>
        </div>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              flex: 1,
              height: `${25 + ((i * 17) % 65)}%`,
              borderRadius: "4px 4px 0 0",
              opacity: 0.35,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="table-card skeleton-card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <SkeletonBox width="30%" height="1.1rem" />
        <SkeletonBox width="15%" height="1.1rem" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} width={`${100 / cols}%`} height="0.8rem" />
          ))}
        </div>

        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "8px 0" }}>
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBox key={c} width={`${100 / cols}%`} height="1rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
