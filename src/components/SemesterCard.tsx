'use client';

import { useState } from 'react';
import { Semester, Course, CourseType, LetterGrade } from '../types/transcript';
import CourseRow from './CourseRow';

interface SemesterCardProps {
  semester: Semester;
  calculateSemesterStats: (semester: Semester) => {
    gpa: number;
    totalRegisteredAkts: number;
    totalRegisteredCredits: number;
    totalCompletedAkts: number;
    totalCompletedCompletedCredits: number;
  };
  onGradeChange: (semesterId: number, courseCode: string, grade: LetterGrade) => void;
  onAddCourse: (semesterId: number, newCourse: Omit<Course, 'isCustom'>) => void;
  onDeleteCourse: (semesterId: number, courseCode: string) => void;
}

export default function SemesterCard({
  semester,
  calculateSemesterStats,
  onGradeChange,
  onAddCourse,
  onDeleteCourse
}: SemesterCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredit, setNewCredit] = useState(3);
  const [newAkts, setNewAkts] = useState(5);
  const [newType, setNewType] = useState<CourseType>('Seçmeli');

  const stats = calculateSemesterStats(semester);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    onAddCourse(semester.semesterId, {
      courseCode: newCode.trim().toUpperCase(),
      courseName: newName.trim(),
      credit: Number(newCredit),
      akts: Number(newAkts),
      type: newType,
      includeInGpa: true,
      grade: ""
    });

    // Reset form
    setNewCode('');
    setNewName('');
    setNewCredit(3);
    setNewAkts(5);
    setNewType('Seçmeli');
    setIsAdding(false);
  };

  return (
    <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-200/80 dark:hover:border-zinc-700/60 transition-all duration-300">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800/60"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {semester.semesterId}
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">{semester.semesterName}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {semester.courses.length} Ders • Toplam {stats.totalRegisteredAkts} AKTS • {stats.totalRegisteredCredits} Kredi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Semester GPA Badge */}
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 block leading-tight">Dönem GANO</span>
            <span className={`text-base font-extrabold ${
              stats.gpa >= 3.0
                ? "text-emerald-600 dark:text-emerald-400"
                : stats.gpa >= 2.0
                ? "text-indigo-600 dark:text-indigo-400"
                : stats.gpa > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-400 dark:text-zinc-600"
            }`}>
              {stats.gpa > 0 ? stats.gpa.toFixed(2) : "0.00"}
            </span>
          </div>

          {/* Toggle Chevron */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className={`transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/30 dark:bg-zinc-950/20 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider border-b border-zinc-100 dark:border-zinc-800/60">
                <th className="py-2.5 px-4 w-24">Kod</th>
                <th className="py-2.5 px-4">Ders Adı</th>
                <th className="py-2.5 px-4 text-center w-24">Tür</th>
                <th className="py-2.5 px-4 text-center w-16">Kredi</th>
                <th className="py-2.5 px-4 text-center w-16">AKTS</th>
                <th className="py-2.5 px-4 w-32">Harf Notu</th>
                <th className="py-2.5 px-4 text-center w-12">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {semester.courses.map(course => (
                <CourseRow
                  key={course.courseCode}
                  course={course}
                  semesterId={semester.semesterId}
                  onGradeChange={onGradeChange}
                  onDelete={onDeleteCourse}
                />
              ))}
              {semester.courses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    Bu dönemde kayıtlı ders bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Add Course button */}
        <div className="p-4 bg-zinc-50/20 dark:bg-zinc-950/10 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tamamlanan AKTS: <strong className="text-zinc-800 dark:text-zinc-200">{stats.totalCompletedAkts}</strong> / {stats.totalRegisteredAkts}
          </span>
          
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors py-1 px-3.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ders Ekle
            </button>
          ) : null}
        </div>

        {/* Inline Add Course Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="p-5 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">Ders Kodu</label>
              <input
                type="text"
                required
                placeholder="Örn: BM225"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="sm:col-span-4">
              <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">Ders Adı</label>
              <input
                type="text"
                required
                placeholder="Örn: Yapay Zeka"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">Ders Türü</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CourseType)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              >
                <option value="Seçmeli">Seçmeli</option>
                <option value="Zorunlu">Zorunlu</option>
                <option value="Staj">Staj</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">Kredi</label>
              <input
                type="number"
                min={0}
                max={20}
                required
                value={newCredit}
                onChange={(e) => setNewCredit(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">AKTS</label>
              <input
                type="number"
                min={0}
                max={30}
                required
                value={newAkts}
                onChange={(e) => setNewAkts(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all py-2.5 px-3 rounded-xl cursor-pointer"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 text-xs font-bold text-zinc-600 bg-zinc-200 hover:bg-zinc-300 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95 transition-all py-2.5 px-3 rounded-xl cursor-pointer"
              >
                İptal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
