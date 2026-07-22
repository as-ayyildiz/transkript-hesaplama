'use client';

interface StatsDashboardProps {
  cgpa: number;
  completedAkts: number;
  registeredAkts: number;
  completedCredits: number;
  registeredCredits: number;
  gradeDistribution: Record<string, number>;
  onReset: () => void;
}

export default function StatsDashboard({
  cgpa,
  completedAkts,
  registeredAkts,
  completedCredits,
  registeredCredits,
  gradeDistribution,
  onReset
}: StatsDashboardProps) {
  const graduationAktsGoal = 240; // Standard for Turkish engineering bachelor degrees
  const aktsProgressPercent = Math.min((completedAkts / graduationAktsGoal) * 100, 100);

  // Define grade order for rendering distribution chart
  const gradeOrder = ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "FD", "FF", "DZ", "YT", "YZ"];
  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* CGPA Display */}
      <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between group">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        
        <div>
          <span className="text-indigo-100/70 text-xs font-semibold uppercase tracking-widest">Genel Not Ortalaması</span>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-6xl font-extrabold tracking-tight select-all">
              {cgpa > 0 ? cgpa.toFixed(2) : "0.00"}
            </h2>
            <span className="text-indigo-200/80 text-sm font-semibold">/ 4.00</span>
          </div>
          <p className="text-xs text-indigo-100/70 mt-3 font-medium">
            Hesaplama Ağırlığı: <strong className="text-white font-bold">AKTS Değerleri</strong>
          </p>
          <p className="text-[10px] text-indigo-200/60 mt-1 font-medium italic">
            * Düzce Üniversitesi yönetmeliğine uygundur.
          </p>
        </div>
      </div>

      {/* Graduation Progress & AKTS info */}
      <div className="lg:col-span-4 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest">Mezuniyet İlerlemesi</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
              {completedAkts} / {graduationAktsGoal} AKTS
            </span>
          </div>

          <div className="space-y-4">
            {/* AKTS Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                <span>Tamamlanan AKTS</span>
                <span>%{aktsProgressPercent.toFixed(0)}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                  style={{ width: `${aktsProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Credit Progress */}
            <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
              <span className="text-zinc-500 dark:text-zinc-400">Toplam Kayıtlı AKTS</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{registeredAkts} AKTS</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Tamamlanan Toplam Kredi</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{completedCredits} Kredi</span>
            </div>
          </div>
        </div>


      </div>

      {/* Grade Distribution Chart */}
      <div className="lg:col-span-4 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-widest block mb-4">Harf Notu Dağılımı</span>
          
          {/* Chart columns */}
          <div className="flex items-end justify-between h-24 px-1 gap-1">
            {gradeOrder.map((g) => {
              const count = gradeDistribution[g] || 0;
              const heightPercent = count > 0 ? (count / maxGradeCount) * 100 : 0;
              const isPassing = ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "YT"].includes(g);

              return (
                <div key={g} className="flex flex-col items-center flex-1 group/bar relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover/bar:opacity-100 bg-zinc-800 dark:bg-zinc-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {count} Adet
                  </div>

                  {/* Vertical bar */}
                  <div className="w-full rounded-t-sm bg-zinc-100 dark:bg-zinc-800 h-24 flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        count === 0
                          ? "bg-transparent"
                          : isPassing
                          ? "bg-indigo-500 dark:bg-indigo-400"
                          : "bg-red-400 dark:bg-red-500"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-1">{g}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Reset buttons */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <button
            onClick={onReset}
            className="w-full text-[10px] font-bold text-center py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors border border-red-200/20 dark:border-red-900/20 cursor-pointer"
          >
            Tüm Notları ve Verileri Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
}
