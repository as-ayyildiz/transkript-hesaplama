'use client';

import { useState } from 'react';
import { Course, AVAILABLE_GRADES, LetterGrade } from '../types/transcript';

interface CourseRowProps {
  course: Course;
  semesterId: number;
  onGradeChange: (semesterId: number, courseCode: string, grade: LetterGrade) => void;
  onDelete?: (semesterId: number, courseCode: string) => void;
  onCourseDetailsChange?: (semesterId: number, courseCode: string, fields: Partial<Course>) => void;
}

export default function CourseRow({
  course,
  semesterId,
  onGradeChange,
  onDelete,
  onCourseDetailsChange
}: CourseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempCode, setTempCode] = useState(course.courseCode);
  const [tempName, setTempName] = useState(course.courseName);

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

  const handleStartEdit = () => {
    setTempCode(course.courseCode);
    setTempName(course.courseName);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempCode.trim() && tempName.trim() && onCourseDetailsChange) {
      onCourseDetailsChange(semesterId, course.courseCode, {
        courseCode: tempCode.trim().toUpperCase(),
        courseName: tempName.trim()
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempCode(course.courseCode);
    setTempName(course.courseName);
    setIsEditing(false);
  };

  // We allow editing if it's a curriculum elective placeholder (type Seçmeli and not manually added by the user)
  const isEditableElective = course.type === "Seçmeli" && !course.isCustom;

  // Placeholder texts logic for cleaner input boxes
  const isDefaultName = course.courseName.includes("Seçmelisi");
  const displayValue = isDefaultName && isEditing && tempName === course.courseName ? "" : tempName;
  const placeholderText = isDefaultName ? course.courseName : "Ders Adı";

  const isDefaultCode = course.courseCode.startsWith("SEC") && (course.courseCode.includes("YY") || course.courseCode.length > 5);
  const displayCode = isDefaultCode && isEditing && tempCode === course.courseCode ? "" : tempCode;
  const placeholderCode = isDefaultCode ? course.courseCode : "Kod";

  return (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors duration-150 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 group">
      {/* Course Code */}
      <td className="py-3.5 px-4 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 align-middle">
        {isEditing ? (
          <input
            type="text"
            placeholder={placeholderCode}
            value={displayCode}
            onChange={(e) => setTempCode(e.target.value)}
            className="w-24 px-2 py-1 text-xs font-mono font-semibold rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          course.courseCode
        )}
      </td>

      {/* Course Name */}
      <td className="py-3.5 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 align-middle">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              placeholder={placeholderText}
              value={displayValue}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full max-w-xs sm:max-w-md px-2 py-1 text-xs font-semibold rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            <span>{course.courseName}</span>
          )}
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

      {/* Actions (Edit/Delete) */}
      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 rounded-md text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:scale-90 transition-all cursor-pointer"
                title="Kaydet"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer"
                title="İptal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {isEditableElective && onCourseDetailsChange && (
                <button
                  onClick={handleStartEdit}
                  className="p-1 rounded-md text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:scale-90 transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100"
                  title="Dersi Düzenle"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 17.982a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              )}
              {course.isCustom && onDelete && (
                <button
                  onClick={() => onDelete(semesterId, course.courseCode)}
                  className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100"
                  title="Dersi Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

