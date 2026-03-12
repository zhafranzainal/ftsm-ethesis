export interface Thesis {
  id: string; // student ID e.g. P123456
  title: string;
  author: string;
  supervisor: string;
  degree: string; // "Master" | "PhD" | ""
  center: string; // "CYBER" | "SOFTAM" | "CIAT"
  language: string; // "English" | "Malay"
  year: string;
  file: string; // relative PDF path
}
