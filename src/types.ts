export interface Thesis {
  id: string; // student ID e.g. P113852
  title: string;
  author: string;
  supervisor: string;
  degree: string; // "Master" | "PhD" | ""
  center: string; // "CYBER" | "SOFTAM" | "CIAT" | etc.
  language: string; // "English" | "Bhs. Melayu"
  year: string;
  file: string; // relative PDF path
}
