import React, { useState, useEffect, useRef } from "react";
import { Search, X, Compass, BarChart3, ShieldCheck, FileText, Layers, Activity, Calendar } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: any, extra?: string) => void;
}

interface SearchItem {
  id: string;
  category: "view" | "corridor" | "methodology" | "action";
  title: string;
  subtitle: string;
  view: string;
  corridor?: string;
  icon: any;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Views
  { id: "v-overview", category: "view", title: "Overview (APIx Index)", subtitle: "Real-time Airfare Price Index (APIx) summary", view: "overview", icon: Activity },
  { id: "v-heatmap", category: "view", title: "Sector Heatmap", subtitle: "Route-level fare pressure across the representative basket", view: "heatmap", icon: BarChart3 },
  { id: "v-elasticity", category: "view", title: "Lead-Time Elasticity", subtitle: "How the price index reacts to booking windows", view: "elasticity", icon: Calendar },
  { id: "v-routes", category: "view", title: "Route Explorer", subtitle: "Inspect and apply individual representative corridors", view: "routes", icon: Compass },
  { id: "v-fares", category: "view", title: "Fare Data", subtitle: "Auditable quote rows served by the typed prototype API", view: "fares", icon: Search },
  { id: "v-pipeline", category: "view", title: "Pipeline Monitor", subtitle: "Visible data-quality and normalization outcomes", view: "pipeline", icon: ShieldCheck },
  { id: "v-backtest", category: "view", title: "DGCA Benchmark Backtesting", subtitle: "Empirical validation against official DGCA passenger yield series", view: "backtest", icon: Layers },
  { id: "v-docs", category: "view", title: "API Docs", subtitle: "Transparent methodology, boundaries, and data assumptions", view: "docs", icon: FileText },

  // Corridors
  { id: "c-del-bom", category: "corridor", title: "DEL ↔ BOM (Delhi - Mumbai)", subtitle: "16.0% DGCA Traffic Weight • Base: ₹4,850", view: "routes", corridor: "DEL-BOM", icon: Compass },
  { id: "c-bom-del", category: "corridor", title: "BOM ↔ DEL (Mumbai - Delhi)", subtitle: "16.0% DGCA Traffic Weight • Base: ₹4,890", view: "routes", corridor: "BOM-DEL", icon: Compass },
  { id: "c-del-blr", category: "corridor", title: "DEL ↔ BLR (Delhi - Bengaluru)", subtitle: "13.0% DGCA Traffic Weight • Base: ₹5,420", view: "routes", corridor: "DEL-BLR", icon: Compass },
  { id: "c-blr-del", category: "corridor", title: "BLR ↔ DEL (Bengaluru - Delhi)", subtitle: "13.0% DGCA Traffic Weight • Base: ₹5,380", view: "routes", corridor: "BLR-DEL", icon: Compass },
  { id: "c-bom-blr", category: "corridor", title: "BOM ↔ BLR (Mumbai - Bengaluru)", subtitle: "11.0% DGCA Traffic Weight • Base: ₹3,950", view: "routes", corridor: "BOM-BLR", icon: Compass },
  { id: "c-del-hyd", category: "corridor", title: "DEL ↔ HYD (Delhi - Hyderabad)", subtitle: "8.0% DGCA Traffic Weight • Base: ₹4,650", view: "routes", corridor: "DEL-HYD", icon: Compass },
  { id: "c-bom-maa", category: "corridor", title: "BOM ↔ MAA (Mumbai - Chennai)", subtitle: "8.0% DGCA Traffic Weight • Base: ₹4,250", view: "routes", corridor: "BOM-MAA", icon: Compass },

  // Methodologies
  { id: "m-laspeyres", category: "methodology", title: "Laspeyres Price Index Formula", subtitle: "Lt = (∑ wi Pit / ∑ wi Pi0) × 100", view: "docs", icon: FileText },
  { id: "m-jevons", category: "methodology", title: "Jevons Geometric Mean Index", subtitle: "Jt = ∏ (Pit / Pi0)^wi × 100 (Substitution control)", view: "docs", icon: FileText },
  { id: "m-iqr", category: "methodology", title: "Dynamic IQR Outlier Filter", subtitle: "Fbounds = [Q1 - 1.5 IQR, Q3 + 1.5 IQR] per corridor", view: "pipeline", icon: ShieldCheck },
  { id: "m-sweetspot", category: "methodology", title: "30–44 Days Booking Sweet Spot", subtitle: "Empirical advance booking discount sweet spot (~14.5% savings)", view: "elasticity", icon: Calendar },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = SEARCH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: SearchItem) => {
    onNavigate(item.view, item.corridor);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="search-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={18} className="text-sky-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search corridors, methodologies, formulas, or views... (e.g. DEL-BOM, Laspeyres, Outlier, Heatmap)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="search-modal-input"
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          )}
          <kbd className="search-esc-badge">ESC</kbd>
        </div>

        <div className="search-results-list">
          {filteredItems.length === 0 ? (
            <div className="search-no-results">
              No matching corridors or methodologies found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`search-result-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="search-item-icon">
                    <Icon size={16} />
                  </div>
                  <div className="search-item-info">
                    <div className="search-item-title-row">
                      <span className="search-item-title">{item.title}</span>
                      <span className="search-item-category">{item.category}</span>
                    </div>
                    <span className="search-item-subtitle">{item.subtitle}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="search-modal-footer">
          <span className="flex items-center gap-1.5">
            <kbd className="search-key-badge">↑</kbd>
            <kbd className="search-key-badge">↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="search-key-badge">↵</kbd>
            <span>Select</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="search-key-badge">ESC</kbd>
            <span>Dismiss</span>
          </span>
        </div>
      </div>
    </div>
  );
};
