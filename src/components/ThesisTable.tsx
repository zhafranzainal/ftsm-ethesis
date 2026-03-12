import type { Thesis } from "../types";

interface Props {
  theses: Thesis[];
}

const THESIS_BASE = "https://ftsm.ukm.my/ethesis/";

const centerColors: Record<string, string> = {
  CYBER: "#ff6b6b",
  SOFTAM: "#4ecdc4",
  CAIT: "#ffe66d",
};

const degreeColors: Record<string, string> = {
  Master: "#74b9ff",
  PhD: "#a29bfe",
};

function Badge({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  const color = colorMap[label] ?? "#8b949e";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.05em",
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function ThesisTable({ theses }: Props) {
  if (theses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <p>No theses match your filters.</p>
        <small>Try adjusting your search or clearing some filters.</small>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="thesis-table">
        <thead>
          <tr>
            <th style={{ width: "44%" }}>Title & Author</th>
            <th style={{ width: "10%" }}>Degree</th>
            <th style={{ width: "10%" }}>Center</th>
            <th style={{ width: "10%" }}>Language</th>
            <th style={{ width: "8%" }}>Year</th>
            <th style={{ width: "8%" }}>PDF</th>
          </tr>
        </thead>
        <tbody>
          {theses.map((t, i) => (
            <tr key={`${t.id}-${i}`}>
              <td>
                <div className="thesis-title">{t.title}</div>
                <div className="thesis-meta">
                  {t.id && (
                    <>
                      <span className="student-id">{t.id}</span>
                      <span className="separator">·</span>
                    </>
                  )}
                  <span className="author">{t.author}</span>
                  <span className="separator">·</span>
                  <span className="supervisor">{t.supervisor}</span>
                </div>
              </td>
              <td className="text-center">
                {t.degree ? <Badge label={t.degree} colorMap={degreeColors} /> : <span className="muted">—</span>}
              </td>
              <td className="text-center">
                {t.center ? <Badge label={t.center} colorMap={centerColors} /> : <span className="muted">—</span>}
              </td>
              <td className="text-center lang">{t.language || <span className="muted">—</span>}</td>
              <td className="text-center year">{t.year || <span className="muted">—</span>}</td>
              <td className="text-center">
                {t.hardcopy ? (
                  <span className="hardcopy-badge" title="Only available in hardcopy at FTSM Library, Level 2 Block H">
                    📚 Library
                  </span>
                ) : t.file ? (
                  <a
                    href={`${THESIS_BASE}${t.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pdf-link"
                    title="Open PDF"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    PDF
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
