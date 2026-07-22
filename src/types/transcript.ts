export type CourseType = "Zorunlu" | "Seçmeli" | "Staj";

export interface Course {
  courseCode: string;
  courseName: string;
  akts: number;
  credit: number;
  type: CourseType;
  includeInGpa: boolean;
  grade?: string; // e.g. "AA", "BA", etc.
  isCustom?: boolean; // If added manually by the user
}

export interface Semester {
  semesterId: number;
  semesterName: string;
  courses: Course[];
}

export interface Curriculum {
  university: string;
  faculty: string;
  department: string;
  degree: string;
  bolognaYear: string;
  totalSemesters: number;
  curriculum: Semester[];
}

export type LetterGrade = "AA" | "BA" | "BB" | "CB" | "CC" | "DC" | "DD" | "FD" | "FF" | "DZ" | "";

export const GRADE_MULTIPLIERS: Record<string, number> = {
  "AA": 4.00,
  "BA": 3.50,
  "BB": 3.25,
  "CB": 3.00,
  "CC": 2.50,
  "DC": 2.25,
  "DD": 2.00,
  "FD": 1.50,
  "FF": 0.00,
  "DZ": 0.00,
};

export const AVAILABLE_GRADES: { label: string; value: LetterGrade; affectsGpa: boolean }[] = [
  { label: "AA (4.00)", value: "AA", affectsGpa: true },
  { label: "BA (3.50)", value: "BA", affectsGpa: true },
  { label: "BB (3.25)", value: "BB", affectsGpa: true },
  { label: "CB (3.00)", value: "CB", affectsGpa: true },
  { label: "CC (2.50)", value: "CC", affectsGpa: true },
  { label: "DC (2.25)", value: "DC", affectsGpa: true },
  { label: "DD (2.00)", value: "DD", affectsGpa: true },
  { label: "FD (1.50)", value: "FD", affectsGpa: true },
  { label: "FF (0.00)", value: "FF", affectsGpa: true },
  { label: "DZ (0.00 - Devamsız)", value: "DZ", affectsGpa: true },
];
