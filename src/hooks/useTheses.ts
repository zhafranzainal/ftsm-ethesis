import { useMemo, useState } from "react";
import type { Thesis } from "../types";

export interface Filters {
  keyword: string;
  degree: string;
  center: string;
  year: string;
  language: string;
  availability: string; // "pdf" | "hardcopy"
}

export function useTheses(theses: Thesis[]) {
  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    degree: "",
    center: "",
    year: "",
    language: "",
    availability: "",
  });

  const options = useMemo(() => {
    const degrees = [...new Set(theses.map((t) => t.degree).filter(Boolean))].sort();
    const centers = [...new Set(theses.map((t) => t.center).filter(Boolean))].sort();
    const years = [...new Set(theses.map((t) => t.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    const languages = [...new Set(theses.map((t) => t.language).filter(Boolean))].sort();
    return { degrees, centers, years, languages };
  }, [theses]);

  const filtered = useMemo(() => {
    const kw = filters.keyword.toLowerCase().trim();
    return theses.filter((t) => {
      if (filters.degree && t.degree !== filters.degree) return false;
      if (filters.center && t.center !== filters.center) return false;
      if (filters.year && t.year !== filters.year) return false;
      if (filters.language && t.language !== filters.language) return false;
      if (filters.availability === "pdf" && t.hardcopy) return false;
      if (filters.availability === "hardcopy" && !t.hardcopy) return false;
      if (kw) {
        const haystack = `${t.title} ${t.author} ${t.supervisor} ${t.id}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [theses, filters]);

  return { filters, setFilters, filtered, options };
}
