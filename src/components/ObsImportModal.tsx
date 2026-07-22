'use client';

import { useState } from 'react';

interface ObsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParse: (text: string) => { code: string; name: string; grade: string }[];
}

export default function ObsImportModal({
  isOpen,
  onClose,
  onParse
}: ObsImportModalProps) {
  const [text, setText] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [results, setResults] = useState<{ code: string; name: string; grade: string }[]>([]);

  if (!isOpen) return null;

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const matched = onParse(text);
    setResults(matched);
    setStep('result');
  };

  const handleClose = () => {
    setText('');
    setStep('input');
    setResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">OBS'den Otomatik Not Aktar</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Transkriptinizi kopyalayıp yapıştırarak notlarınızı saniyeler içinde aktarın.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'input' ? (
            <form onSubmit={handleParse} className="space-y-4">
              {/* Instructions */}
              <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl p-4 text-sm text-indigo-800 dark:text-indigo-300 text-center font-medium">
                OBS'den transkript sayfanızı Ctrl+A ile seçip kopyaladıktan sonra buraya yapıştırın.
              </div>

              <div>
                <label htmlFor="obs-text" className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1.5">
                  OBS Kopyalanan Metin
                </label>
                <textarea
                  id="obs-text"
                  required
                  rows={8}
                  placeholder="Kopyaladığınız transkript metnini buraya yapıştırın..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono transition-all resize-none"
                />
                
                {/* Privacy Badge */}
                <div className="mt-3 flex items-start gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Güvenlik ve Gizlilik Garantisi:</span>
                    <p className="mt-0.5 leading-relaxed">
                      Verileriniz %100 yerel olarak tarayıcınızda işlenir. Yapıştırdığınız metindeki TC Kimlik Numarası, Öğrenci Numarası ve isim gibi hassas bilgiler otomatik olarak temizlenir ve asla hiçbir sunucuya gönderilmez.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 px-5 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 px-5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  Notları Çıkar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {results.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold">Aktarım Başarılı!</p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                        Metin içinden **{results.length}** adet ders ve harf notu başarıyla eşleştirildi ve transkriptinize uygulandı.
                      </p>
                    </div>
                  </div>

                  {/* Results List */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-2">Eşleştirilen Dersler</span>
                    <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase">
                            <th className="py-2.5 px-4 w-24">Kod</th>
                            <th className="py-2.5 px-4">Ders Adı</th>
                            <th className="py-2.5 px-4 text-center w-24">Harf Notu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((res) => (
                            <tr key={res.code} className="border-b border-zinc-50 dark:border-zinc-800/40 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                              <td className="py-2.5 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100">{res.code}</td>
                              <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">{res.name}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-flex items-center justify-center w-8 py-0.5 rounded font-bold text-xs ${
                                  ["FF", "FD", "DZ", "YZ"].includes(res.grade)
                                    ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                    : ["YT", "AA", "BA", "BB"].includes(res.grade)
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}>
                                  {res.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/5 text-amber-500 border border-amber-100 dark:border-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Hiçbir Ders Eşleşmedi</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Yapıştırdığınız metin içerisinde müfredata ait herhangi bir ders kodu (Örn: BM111, MAT111) ve geçerli harf notu tespit edilemedi.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-sm font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 px-5 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  {results.length > 0 ? "Yeniden Aktar" : "Geri Dön"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 px-5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
