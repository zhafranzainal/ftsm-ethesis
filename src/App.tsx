import { useEffect, useState } from "react";
import { FilterBar } from "./components/FilterBar";
import { ThesisTable } from "./components/ThesisTable";
import { useTheses } from "./hooks/useTheses";
import type { Thesis } from "./types";
import "./index.css";

export default function App() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("theses.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load theses.json");
        return r.json();
      })
      .then((data: Thesis[]) => {
        setTheses(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const { filters, setFilters, filtered, options } = useTheses(theses);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-mark">
              <span>e</span>
            </div>
            <div>
              <h1 className="site-title">FTSM eThesis</h1>
              <p className="site-subtitle">Faculty of Information Science & Technology · UKM</p>
            </div>
          </div>
          <div className="header-right">
            <a
              href="https://ftsm.ukm.my/ethesis/"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              Original Site ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>Loading theses...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <small>Make sure theses.json exists in the public folder.</small>
          </div>
        )}

        {!loading && !error && (
          <>
            <FilterBar
              filters={filters}
              options={options}
              total={theses.length}
              filtered={filtered.length}
              onChange={setFilters}
            />
            <ThesisTable theses={filtered} />
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Data sourced from{" "}
          <a href="https://ftsm.ukm.my/ethesis/" target="_blank" rel="noopener noreferrer">
            ftsm.ukm.my/ethesis
          </a>{" "}
          · Updated monthly via GitHub Actions
        </p>
      </footer>
    </div>
  );
}
