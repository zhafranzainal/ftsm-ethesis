import type { Filters } from "../hooks/useTheses";

interface Props {
  filters: Filters;
  options: {
    degrees: string[];
    centers: string[];
    years: string[];
    languages: string[];
  };
  total: number;
  filtered: number;
  onChange: (filters: Filters) => void;
}

const selectClass =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-[#c9d1d9] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#58a6ff] transition-colors appearance-none cursor-pointer";

export function FilterBar({ filters, options, total, filtered, onChange }: Props) {
  const update = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.degree || filters.center || filters.year || filters.language || filters.keyword;

  return (
    <div className="filter-bar">
      {/* Search input */}
      <div className="search-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search title, author, supervisor, student ID..."
          value={filters.keyword}
          onChange={(e) => update("keyword", e.target.value)}
          className="search-input"
        />
        {filters.keyword && (
          <button onClick={() => update("keyword", "")} className="clear-btn" aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {/* Dropdowns */}
      <div className="dropdowns">
        <div className="select-wrapper">
          <select value={filters.degree} onChange={(e) => update("degree", e.target.value)} className={selectClass}>
            <option value="">All Degrees</option>
            {options.degrees.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <span className="select-arrow">▾</span>
        </div>

        <div className="select-wrapper">
          <select value={filters.center} onChange={(e) => update("center", e.target.value)} className={selectClass}>
            <option value="">All Centers</option>
            {options.centers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="select-arrow">▾</span>
        </div>

        <div className="select-wrapper">
          <select value={filters.year} onChange={(e) => update("year", e.target.value)} className={selectClass}>
            <option value="">All Years</option>
            {options.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="select-arrow">▾</span>
        </div>

        <div className="select-wrapper">
          <select value={filters.language} onChange={(e) => update("language", e.target.value)} className={selectClass}>
            <option value="">All Languages</option>
            {options.languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <span className="select-arrow">▾</span>
        </div>
      </div>

      {/* Stats + reset */}
      <div className="filter-meta">
        <span className="result-count">
          Showing <strong>{filtered}</strong> of <strong>{total}</strong> theses
        </span>
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ keyword: "", degree: "", center: "", year: "", language: "" })}
            className="reset-btn"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
