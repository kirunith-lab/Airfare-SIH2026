import React, { useState } from "react";
import { Plane, Radio, Shield, Users, Activity, Sparkles } from "lucide-react";

interface AirportHub {
  code: string;
  name: string;
  city: string;
  x: number; // SVG coordinate x (0 - 800)
  y: number; // SVG coordinate y (0 - 680)
  fare: number;
  trafficShare: string;
  isMonitored: boolean;
  status: "active" | "high_traffic";
}

interface CorridorRoute {
  id: string;
  from: string;
  to: string;
  weight: number;
  currentFare: number;
  basePrice: number;
  momChange: number;
}

const AIRPORT_HUBS: Record<string, AirportHub> = {
  DEL: {
    code: "DEL",
    name: "Indira Gandhi International",
    city: "Delhi (NCR)",
    x: 345,
    y: 195,
    fare: 5420,
    trafficShare: "18.4%",
    isMonitored: true,
    status: "high_traffic",
  },
  BOM: {
    code: "BOM",
    name: "Chhatrapati Shivaji Maharaj",
    city: "Mumbai",
    x: 235,
    y: 395,
    fare: 4890,
    trafficShare: "14.2%",
    isMonitored: true,
    status: "high_traffic",
  },
  BLR: {
    code: "BLR",
    name: "Kempegowda International",
    city: "Bengaluru",
    x: 345,
    y: 535,
    fare: 5380,
    trafficShare: "10.8%",
    isMonitored: true,
    status: "high_traffic",
  },
  HYD: {
    code: "HYD",
    name: "Rajiv Gandhi International",
    city: "Hyderabad",
    x: 365,
    y: 440,
    fare: 4620,
    trafficShare: "7.9%",
    isMonitored: true,
    status: "active",
  },
  MAA: {
    code: "MAA",
    name: "Chennai International",
    city: "Chennai",
    x: 395,
    y: 545,
    fare: 4220,
    trafficShare: "6.5%",
    isMonitored: true,
    status: "active",
  },
  CCU: {
    code: "CCU",
    name: "Netaji Subhash Chandra Bose",
    city: "Kolkata",
    x: 580,
    y: 310,
    fare: 5100,
    trafficShare: "5.8%",
    isMonitored: true,
    status: "active",
  },
  GOI: {
    code: "GOI",
    name: "Dabolim / Manohar Int'l",
    city: "Goa",
    x: 240,
    y: 475,
    fare: 4750,
    trafficShare: "3.2%",
    isMonitored: true,
    status: "active",
  },
  PNQ: {
    code: "PNQ",
    name: "Pune Airport",
    city: "Pune",
    x: 265,
    y: 410,
    fare: 4320,
    trafficShare: "3.1%",
    isMonitored: true,
    status: "active",
  },
  AMD: {
    code: "AMD",
    name: "Sardar Vallabhbhai Patel",
    city: "Ahmedabad",
    x: 225,
    y: 300,
    fare: 4410,
    trafficShare: "3.5%",
    isMonitored: true,
    status: "active",
  },
  COK: {
    code: "COK",
    name: "Cochin International",
    city: "Kochi",
    x: 320,
    y: 605,
    fare: 4950,
    trafficShare: "3.4%",
    isMonitored: true,
    status: "active",
  },
};

const CORRIDOR_ROUTES: CorridorRoute[] = [
  { id: "DEL-BOM", from: "DEL", to: "BOM", weight: 0.16, currentFare: 5240, basePrice: 4850, momChange: 2.4 },
  { id: "BOM-DEL", from: "BOM", to: "DEL", weight: 0.16, currentFare: 5290, basePrice: 4890, momChange: 2.1 },
  { id: "DEL-BLR", from: "DEL", to: "BLR", weight: 0.13, currentFare: 5890, basePrice: 5420, momChange: 4.8 },
  { id: "BLR-DEL", from: "BLR", to: "DEL", weight: 0.13, currentFare: 5840, basePrice: 5380, momChange: 4.2 },
  { id: "BOM-BLR", from: "BOM", to: "BLR", weight: 0.11, currentFare: 4280, basePrice: 3950, momChange: 1.8 },
  { id: "BLR-BOM", from: "BLR", to: "BOM", weight: 0.11, currentFare: 4290, basePrice: 3980, momChange: 1.6 },
  { id: "DEL-HYD", from: "DEL", to: "HYD", weight: 0.08, currentFare: 4980, basePrice: 4650, momChange: 3.5 },
  { id: "HYD-DEL", from: "HYD", to: "DEL", weight: 0.08, currentFare: 4960, basePrice: 4620, momChange: 3.1 },
  { id: "BOM-MAA", from: "BOM", to: "MAA", weight: 0.08, currentFare: 4420, basePrice: 4250, momChange: 0.9 },
  { id: "MAA-BOM", from: "MAA", to: "BOM", weight: 0.07, currentFare: 4390, basePrice: 4220, momChange: 0.7 },
  { id: "DEL-CCU", from: "DEL", to: "CCU", weight: 0.05, currentFare: 5210, basePrice: 4950, momChange: 2.0 },
  { id: "DEL-GOI", from: "DEL", to: "GOI", weight: 0.04, currentFare: 5450, basePrice: 5120, momChange: 1.5 },
];

export const NetworkMap: React.FC<{
  onSelectCorridor?: (routeCode: string) => void;
}> = ({ onSelectCorridor }) => {
  const [selectedHub, setSelectedHub] = useState<AirportHub>(AIRPORT_HUBS["DEL"]);
  const [hoveredRoute, setHoveredRoute] = useState<CorridorRoute | null>(null);
  const [activeTab, setActiveTab] = useState<"network" | "hubs">("network");

  // Generate curved SVG quadratic path between two airports
  const getCurvePath = (from: AirportHub, to: AirportHub) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // Calculate perpendicular offset for natural curvature
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const curvature = 0.18;
    const ctrlX = midX - dy * curvature;
    const ctrlY = midY + dx * curvature;

    return `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
  };

  const selectedConnectedRoutes = CORRIDOR_ROUTES.filter(
    (r) => r.from === selectedHub.code || r.to === selectedHub.code
  );

  return (
    <div className="network-map-card">
      <div className="network-map-header">
        <div>
          <div className="network-map-badge">
            <Radio size={13} className="text-sky-400 animate-pulse" />
            <span>3D GEODETIC AVIATION TELEMETRY</span>
            <span className="network-live-pill">LIVE MESH</span>
          </div>
          <h3 className="network-map-title">Interactive Indian Domestic Aviation Network</h3>
          <p className="network-map-subtitle">
            Geodetic representation of 10 DGCA-monitored trunk corridors with real-time rate-of-change telemetry & passenger volume weights.
          </p>
        </div>

        <div className="network-controls">
          <button
            className={`network-toggle-btn ${activeTab === "network" ? "active" : ""}`}
            onClick={() => setActiveTab("network")}
          >
            Corridor Arcs
          </button>
          <button
            className={`network-toggle-btn ${activeTab === "hubs" ? "active" : ""}`}
            onClick={() => setActiveTab("hubs")}
          >
            Hub Telemetry
          </button>
        </div>
      </div>

      <div className="network-canvas-container">
        {/* SVG Mesh Canvas */}
        <svg
          viewBox="0 0 800 680"
          className="network-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
            </linearGradient>

            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>

            {/* Filter for glow */}
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Stylized background geography wireframe outlines */}
          <g className="india-outline" opacity="0.18">
            <path
              d="M 330 90 L 370 120 L 410 140 L 430 190 L 490 205 L 530 220 L 610 240 L 640 280 L 600 320 L 560 340 L 510 370 L 460 410 L 430 480 L 410 560 L 370 630 L 340 650 L 310 610 L 260 510 L 210 430 L 190 350 L 180 270 L 240 210 L 280 150 Z"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Latitude / Longitude subtle grid */}
            <line x1="120" y1="200" x2="680" y2="200" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="120" y1="360" x2="680" y2="360" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="120" y1="520" x2="680" y2="520" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="280" y1="80" x2="280" y2="640" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="440" y1="80" x2="440" y2="640" stroke="#1e293b" strokeWidth="0.8" />
          </g>

          {/* Render Route Arcs */}
          <g className="routes-group">
            {CORRIDOR_ROUTES.map((route) => {
              const fromHub = AIRPORT_HUBS[route.from];
              const toHub = AIRPORT_HUBS[route.to];
              if (!fromHub || !toHub) return null;

              const isConnectedToSelected =
                fromHub.code === selectedHub.code || toHub.code === selectedHub.code;
              const isHovered = hoveredRoute?.id === route.id;
              const pathD = getCurvePath(fromHub, toHub);

              // Calculate stroke width proportional to passenger volume weight
              const strokeWidth = isHovered
                ? 4.5
                : isConnectedToSelected
                ? 2.8
                : Math.max(1.2, route.weight * 16);

              return (
                <g key={route.id} className="route-path-wrapper">
                  {/* Invisible wide path for easy hover */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredRoute(route)}
                    onMouseLeave={() => setHoveredRoute(null)}
                    onClick={() => onSelectCorridor && onSelectCorridor(route.id)}
                  />

                  {/* Visual path line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isHovered
                        ? "#f43f5e"
                        : isConnectedToSelected
                        ? "url(#activeRouteGrad)"
                        : "url(#routeGrad)"
                    }
                    strokeWidth={strokeWidth}
                    strokeOpacity={isHovered ? 1 : isConnectedToSelected ? 0.95 : 0.45}
                    filter={isHovered || isConnectedToSelected ? "url(#glowFilter)" : undefined}
                    strokeDasharray={isConnectedToSelected ? "8 4" : "none"}
                    className={isConnectedToSelected ? "animate-dash" : ""}
                  />

                  {/* Animated dot running along route */}
                  {isConnectedToSelected && (
                    <circle r="3.5" fill="#38bdf8" filter="url(#glowFilter)">
                      <animateMotion path={pathD} dur="3.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Render Airport Hub Nodes */}
          <g className="nodes-group">
            {Object.values(AIRPORT_HUBS).map((hub) => {
              const isSelected = selectedHub.code === hub.code;
              const isHighTraffic = hub.status === "high_traffic";

              return (
                <g
                  key={hub.code}
                  transform={`translate(${hub.x}, ${hub.y})`}
                  className="airport-node"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedHub(hub)}
                >
                  {/* Outer pulsing ring for selected/high traffic */}
                  {isSelected && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Glow aura */}
                  <circle
                    r={isSelected ? "16" : isHighTraffic ? "12" : "9"}
                    fill="url(#nodeGlow)"
                  />

                  {/* Core circle */}
                  <circle
                    r={isSelected ? "7" : isHighTraffic ? "5.5" : "4.5"}
                    fill={isSelected ? "#38bdf8" : isHighTraffic ? "#0ea5e9" : "#64748b"}
                    stroke="#080c14"
                    strokeWidth="2"
                    filter="url(#glowFilter)"
                  />

                  {/* Hub Code Tag */}
                  <rect
                    x="-18"
                    y={hub.y > 500 ? "-24" : "10"}
                    width="36"
                    height="17"
                    rx="4"
                    fill={isSelected ? "#0284c7" : "#0f172a"}
                    stroke={isSelected ? "#38bdf8" : "#334155"}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y={hub.y > 500 ? "-12" : "22"}
                    fill={isSelected ? "#ffffff" : "#cbd5e1"}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {hub.code}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Hub Telemetry HUD overlay */}
        <div className="network-hud-overlay">
          <div className="network-hud-header">
            <div className="network-hud-badge">
              <Plane size={13} className="text-sky-400" />
              <span>HUB: {selectedHub.code}</span>
            </div>
            <span className="network-dgca-tag">DGCA MONITORED</span>
          </div>

          <div className="network-hud-name">{selectedHub.name}</div>
          <div className="network-hud-city">{selectedHub.city}</div>

          <div className="network-hud-stats">
            <div>
              <span className="network-hud-stat-label">Corridor Avg Fare:</span>
              <strong className="network-hud-stat-val text-sky-400">
                ₹{selectedHub.fare.toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="network-hud-stat-label">National Traffic Share:</span>
              <strong className="network-hud-stat-val text-emerald-400">
                {selectedHub.trafficShare}
              </strong>
            </div>
          </div>

          <div className="network-hud-routes">
            <span className="network-hud-routes-title">Connected Monitored Corridors:</span>
            <div className="network-hud-chips">
              {selectedConnectedRoutes.map((r) => (
                <button
                  key={r.id}
                  className="network-corridor-chip"
                  onClick={() => onSelectCorridor && onSelectCorridor(r.id)}
                >
                  <span>{r.id}</span>
                  <span className="text-sky-300">{(r.weight * 100).toFixed(0)}%</span>
                  <span className={r.momChange >= 0 ? "text-red-400" : "text-emerald-400"}>
                    {r.momChange >= 0 ? "+" : ""}{r.momChange}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hovered Route Tooltip */}
        {hoveredRoute && (
          <div className="network-route-tooltip">
            <div className="network-tooltip-header">
              <Sparkles size={12} className="text-sky-400" />
              <strong>{hoveredRoute.id} Corridor</strong>
              <span className="network-tooltip-weight">
                {(hoveredRoute.weight * 100).toFixed(1)}% Basket Weight
              </span>
            </div>
            <div className="network-tooltip-body">
              <div>
                <span>Current Fare:</span>
                <strong>₹{hoveredRoute.currentFare.toLocaleString()}</strong>
              </div>
              <div>
                <span>Baseline (Jan 2025):</span>
                <span>₹{hoveredRoute.basePrice.toLocaleString()}</span>
              </div>
              <div>
                <span>MoM Drift:</span>
                <strong className={hoveredRoute.momChange >= 0 ? "text-rose-400" : "text-emerald-400"}>
                  {hoveredRoute.momChange >= 0 ? "+" : ""}{hoveredRoute.momChange}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Footer Summary */}
      <div className="network-map-footer">
        <div className="network-footer-item">
          <Shield size={14} className="text-emerald-400" />
          <span>100% DGCA Volume Calibrated Basket</span>
        </div>
        <div className="network-footer-item">
          <Activity size={14} className="text-sky-400" />
          <span>Real-time Truncated Mean Price Ingestion</span>
        </div>
        <div className="network-footer-item">
          <Users size={14} className="text-purple-400" />
          <span>Over 42% Domestic Passenger Coverage</span>
        </div>
      </div>
    </div>
  );
};
