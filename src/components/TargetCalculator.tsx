'use client';

import { useState } from 'react';

interface TargetCalculatorProps {
  currentCgpa: number;
  currentWeight: number; // sum of credits/akts of graded courses
  totalCurriculumWeight: number; // sum of credits/akts of ALL courses in the selected curriculum
}

export default function TargetCalculator({
  currentCgpa,
  currentWeight,
  totalCurriculumWeight
}: TargetCalculatorProps) {
  const [targetCgpa, setTargetCgpa] = useState<number>(3.00);

  const remainingWeight = Math.max(totalCurriculumWeight - currentWeight, 0);

  let requiredGpa: number | null = null;
  let status: 'impossible' | 'reached' | 'possible' | 'no_courses' = 'possible';

  if (currentWeight === 0) {
    requiredGpa = targetCgpa;
  } else if (remainingWeight <= 0) {
    status = 'no_courses';
  } else {
    // target = (currentCgpa * currentWeight + requiredGpa * remainingWeight) / totalCurriculumWeight
    // target * totalCurriculumWeight = currentCgpa * currentWeight + requiredGpa * remainingWeight
    // requiredGpa = (target * totalCurriculumWeight - currentCgpa * currentWeight) / remainingWeight
    requiredGpa = (targetCgpa * totalCurriculumWeight - currentCgpa * currentWeight) / remainingWeight;
    
    if (requiredGpa > 4.00) {
      status = 'impossible';
    } else if (requiredGpa <= 0) {
      status = 'reached';
    }
  }

  return (
    <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm mb-8">
      <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base mb-2">Hedef GANO Simülatörü</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
        Hayalinizdeki genel not ortalamasına ulaşmak için kalan derslerinizden kaç ortalama almanız gerektiğini hesaplayın.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Input area */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <label className="flex justify-between items-center text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-2">
              <span>Hedef GANO</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{targetCgpa.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="1.00"
              max="4.00"
              step="0.05"
              value={targetCgpa}
              onChange={(e) => setTargetCgpa(Number(e.target.value))}
              className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="flex justify-between text-xs border-t border-zinc-100 dark:border-zinc-800/60 pt-3 text-zinc-500 dark:text-zinc-400">
            <span>Mevcut Durum:</span>
            <span>{currentWeight.toFixed(0)} / {totalCurriculumWeight.toFixed(0)} Ağırlık Girildi</span>
          </div>
        </div>

        {/* Result Area */}
        <div className="md:col-span-7 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-5 min-h-[120px] flex items-center">
          {status === 'no_courses' && (
            <div className="w-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-500 mx-auto mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Bütün derslerinizi tamamladınız!</p>
              <p className="text-xs text-zinc-500 mt-0.5">Hesaplanacak ders kalmadı.</p>
            </div>
          )}

          {status === 'reached' && (
            <div className="w-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Hedefe Ulaşıldı!</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-4 leading-relaxed">
                Mevcut ortalamanız ({currentCgpa.toFixed(2)}) hedefin üzerinde. Kalan dönemlerde sıfır ortalama yapsanız dahi hedefiniz gerçekleşiyor.
              </p>
            </div>
          )}

          {status === 'impossible' && (
            <div className="w-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500 mx-auto mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm font-bold text-red-500">Hedef Ulaşılamaz</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 px-4 leading-relaxed">
                Kalan dönemlerdeki tüm derslerden AA (4.00) alsanız dahi genel ortalamanız maksimum <strong>{((currentCgpa * currentWeight + 4.00 * remainingWeight) / totalCurriculumWeight).toFixed(2)}</strong> olabilir.
              </p>
            </div>
          )}

          {status === 'possible' && requiredGpa !== null && (
            <div className="w-full text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold tracking-wider mb-1">Gereken Ortalama</p>
              <p className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {requiredGpa.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 px-4 leading-relaxed">
                Kalan <strong className="text-zinc-800 dark:text-zinc-200">{remainingWeight.toFixed(0)}</strong> ağırlığındaki derslerinizin ortalaması en az <strong>{requiredGpa.toFixed(2)}</strong> olmalıdır.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
