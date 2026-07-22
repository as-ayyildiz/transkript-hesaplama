'use client';

import { Course, AVAILABLE_GRADES, LetterGrade } from '../types/transcript';

interface CourseRowProps {
  course: Course;
  semesterId: number;
  onGradeChange: (semesterId: number, courseCode: string, grade: LetterGrade) => void;
  onDelete?: (semesterId: number, courseCode: string) => void;
}

export default function CourseRow({
  course,
  semesterId,
  onGradeChange,
  onDelete
}: CourseRowProps) {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "Zorunlu":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20";
      case "Seçmeli":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20";
      case "Staj":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20";
      default:
        return "bg-zinc-50 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-500/20";
    }
  };

  return (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors duration-150 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 group">
      {/* Course Code */}
      <td className="py-3.5 px-4 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 align-middle">
        {course.courseCode}
      </td>

      {/* Course Name */}
      <td className="py-3.5 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 align-middle">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span>{course.courseName}</span>
          {course.isCustom && (
            <span className="inline-flex self-start sm:self-auto items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20">
              Kişisel
            </span>
          )}
        </div>
      </td>

      {/* Course Type Badge */}
      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(course.type)}`}>
          {course.type}
        </span>
      </td>

      {/* Credits */}
      <td className="py-3.5 px-4 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 align-middle">
        {course.credit}
      </td>

      {/* AKTS */}
      <td className="py-3.5 px-4 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100 align-middle">
        {course.akts}
      </td>

      {/* Letter Grade Dropdown */}
      <td className="py-3.5 px-4 align-middle">
        <select
          value={course.grade || ""}
          onChange={(e) => onGradeChange(semesterId, course.courseCode, e.target.value as LetterGrade)}
          className={`w-full text-xs font-semibold px-2 py-1.5 rounded-lg border focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none bg-white dark:bg-zinc-800 ${
            course.grade
              ? ["FF", "FD", "DZ", "YZ"].includes(course.grade)
                ? "border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400"
                : ["YT", "AA", "BA", "BB"].includes(course.grade)
                ? "border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"
          }`}
          aria-label={`${course.courseName} harf notu seçin`}
        >
          <option value="">Seçiniz</option>
          {AVAILABLE_GRADES.map((grade) => (
            <option key={grade.value} value={grade.value}>
              {grade.label}
            </option>
          ))}
        </select>
      </td>

      {/* Actions (Delete for Custom Courses) */}
      <td className="py-3.5 px-4 text-center align-middle">
        {course.isCustom && onDelete ? (
          <button
            onClick={() => onDelete(semesterId, course.courseCode)}
            className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100"
            title="Dersi Sil"
            aria-label={`${course.courseName} dersini sil`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
      </td>
    </tr>
  );
}
