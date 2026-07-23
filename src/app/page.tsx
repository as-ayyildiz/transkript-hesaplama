'use client';

import { useTranscript } from '../hooks/useTranscript';
import StatsDashboard from '../components/StatsDashboard';
import SemesterCard from '../components/SemesterCard';
import { useRef, useState } from 'react';
import ObsImportModal from '../components/ObsImportModal';

export default function Home() {
  const {
    bolognaYear,
    semesters,
    isInitialized,
    availableYears,
    universityInfo,
    changeBolognaYear,
    updateCourseGrade,
    addCustomCourse,
    deleteCustomCourse,
    updateCourseDetails,
    resetTranscript,
    importTranscriptData,
    parseTranscriptText,
    calculateSemesterStats,
    calculateOverallStats,
    hasObsImport,
    revertToObsImport
  } = useTranscript();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isInitialized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const {
    cgpa,
    grandRegisteredAkts,
    grandRegisteredCredits,
    grandCompletedAkts,
    grandCompletedCredits,
    grandTotalWeight,
    gradeDistribution
  } = calculateOverallStats();



  // JSON Export handler
  const handleExport = () => {
    const dataStr = JSON.stringify({
      bolognaYear,
      semesters
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `transkript_simulasyon_${bolognaYear}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // JSON Import handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsedData.semesters)) {
            importTranscriptData(parsedData.semesters, parsedData.bolognaYear);
            alert("Transkript simülasyonu başarıyla yüklendi!");
          } else {
            alert("Geçersiz dosya formatı. Lütfen geçerli bir yedek dosyası seçin.");
          }
        } catch (error) {
          alert("Dosya okunurken bir hata oluştu.");
        }
      };
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 uppercase tracking-wider">
              {universityInfo.degree} Programı
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Düzce Üniversitesi Bilgisayar Mühendisliği Sanal Transkript
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {universityInfo.university} • {universityInfo.faculty} • {universityInfo.department}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Bologna selector */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-1.5 shadow-sm">
            <label htmlFor="bologna-select" className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase whitespace-nowrap">Bologna Yılı:</label>
            <select
              id="bologna-select"
              value={bolognaYear}
              onChange={(e) => changeBolognaYear(e.target.value)}
              className="text-sm font-bold text-zinc-800 dark:text-zinc-100 bg-transparent border-none outline-none cursor-pointer pr-1"
            >
              {availableYears.map(year => (
                <option key={year} value={year} className="dark:bg-zinc-900">
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="space-y-8">
        {/* Statistics and Gauges */}
        <section aria-label="Genel İstatistikler">
          <StatsDashboard
            cgpa={cgpa}
            completedAkts={grandCompletedAkts}
            registeredAkts={grandRegisteredAkts}
            completedCredits={grandCompletedCredits}
            registeredCredits={grandRegisteredCredits}
            gradeDistribution={gradeDistribution}
            onReset={resetTranscript}
          />
        </section>



        {/* Semesters list */}
        <section aria-label="Dönemler ve Dersler" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Dönem Dersleri</h2>
            <div className="flex items-center gap-2">
              {/* Backup actions */}
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                OBS'den Otomatik Aktar
              </button>
              {hasObsImport && (
                <button
                  onClick={revertToObsImport}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-800/60 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 animate-in fade-in duration-200"
                  title="OBS'den en son aktarılan notlara geri dön"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                  OBS Notlarına Geri Dön
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                İçe Aktar
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Yedekle (Dışa Aktar)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {semesters.map((semester) => (
              <SemesterCard
                key={semester.semesterId}
                semester={semester}
                calculateSemesterStats={calculateSemesterStats}
                onGradeChange={updateCourseGrade}
                onAddCourse={addCustomCourse}
                onDeleteCourse={deleteCustomCourse}
                onCourseDetailsChange={updateCourseDetails}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 text-center text-xs text-zinc-500 dark:text-zinc-500">
        <p>© 2026 Düzce Üniversitesi Bilgisayar Mühendisliği Transkript Simülatörü</p>
        <p className="mt-1.5">Harf notları ve katsayıları üniversite senato yönetmeliğine göre uyarlanmıştır.</p>
      </footer>
      <ObsImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onParse={parseTranscriptText}
      />
    </div>
  );
}
