'use client';

import { useState, useEffect, useCallback } from 'react';
import { Course, Semester, Curriculum, LetterGrade, GRADE_MULTIPLIERS } from '../types/transcript';
import curriculumPre2024 from '../data/bilgisayar-muhendisligi-2023-oncesi.json';
import curriculumPost2024 from '../data/bilgisayar-muhendisligi-2024-sonrasi.json';

// Düzce Üniversitesi Bilgisayar Mühendisliği only actually changed its curriculum once in this
// window: course codes/credits/AKTS shifted starting the 2024-2025 intake. 2022-2023 and
// 2023-2024 share one identical curriculum, and 2024-2025 / 2025-2026 share the other (verified
// against ebs.duzce.edu.tr) — so there are only two real curricula, not four.
const PRE_2024_YEAR = "2023 ve Öncesi";
const POST_2024_YEAR = "2024 ve Sonrası";

const CURRICULA: Record<string, Curriculum> = {
  [PRE_2024_YEAR]: curriculumPre2024 as Curriculum,
  [POST_2024_YEAR]: curriculumPost2024 as Curriculum,
};

const DEFAULT_YEAR = POST_2024_YEAR;
const STORAGE_PREFIX = 'transkript_hesaplama_';

// Per-year storage keys used before the app collapsed to just two curricula, kept here purely
// so anyone with existing saved progress under an old key doesn't lose it.
const LEGACY_YEAR_KEYS: Record<string, string[]> = {
  [PRE_2024_YEAR]: ["2022-2023", "2023-2024"],
  [POST_2024_YEAR]: ["2024-2025", "2025-2026"],
};

// Guards against a stale/corrupted bolognaYear in localStorage (e.g. left over from a version
// of the app that supported a curriculum year no longer offered) crashing the whole app on load.
const resolveYear = (year: string | null): string => {
  if (year && CURRICULA[year]) return year;
  for (const bucket of Object.keys(LEGACY_YEAR_KEYS)) {
    if (year && LEGACY_YEAR_KEYS[bucket].includes(year)) return bucket;
  }
  return DEFAULT_YEAR;
};

const migrateSemesters = (parsed: Semester[], defaultValue: Semester[]) => {
  return parsed.map(sem => {
    if (sem.semesterId === 7 && sem.courses.some(c => c.courseCode === "SECMES7YY")) {
      const nonElectives = sem.courses.filter(c => c.courseCode !== "SECMES7YY");
      const defaultElectives = defaultValue.find(s => s.semesterId === 7)?.courses.filter(c => c.courseCode.startsWith("SEC")) || [];
      return {
        ...sem,
        courses: [...nonElectives, ...defaultElectives]
      };
    }
    if (sem.semesterId === 8 && sem.courses.some(c => c.courseCode === "SECMES8YY")) {
      const nonElectives = sem.courses.filter(c => c.courseCode !== "SECMES8YY");
      const defaultElectives = defaultValue.find(s => s.semesterId === 8)?.courses.filter(c => c.courseCode.startsWith("SEC")) || [];
      return {
        ...sem,
        courses: [...nonElectives, ...defaultElectives]
      };
    }
    return sem;
  });
};

// Loads the working semesters for a curriculum year: the year's own saved progress if present,
// falling back to progress saved under its pre-consolidation legacy keys, falling back to a
// fresh copy of the curriculum. Also carries forward the old SECMES7YY/8YY placeholder migration.
const loadSemestersForYear = (year: string): Semester[] => {
  const freshCopy = () => JSON.parse(JSON.stringify(CURRICULA[year].curriculum)) as Semester[];

  let raw = localStorage.getItem(`${STORAGE_PREFIX}semesters_${year}`);
  if (!raw) {
    for (const legacyKey of LEGACY_YEAR_KEYS[year] || []) {
      raw = localStorage.getItem(`${STORAGE_PREFIX}semesters_${legacyKey}`);
      if (raw) break;
    }
  }
  if (!raw) return freshCopy();

  try {
    let parsed = JSON.parse(raw) as Semester[];
    const needsMigration = parsed.some(sem => sem.courses.some(c => c.courseCode === "SECMES7YY" || c.courseCode === "SECMES8YY"));
    if (needsMigration) {
      parsed = migrateSemesters(parsed, freshCopy());
    }
    return parsed;
  } catch {
    return freshCopy();
  }
};

// Course codes renamed (not just re-valued) when the curriculum changed in 2024-2025, sourced
// from a direct diff against ebs.duzce.edu.tr. A student who took one of these before 2024 keeps
// the old code on their transcript forever, even if they're now viewed under the newer
// curriculum (or vice versa) — so OBS import must treat each pair as the same course.
const RENAMED_COURSE_PAIRS: [string, string][] = [
  ["BM101", "BM111"], ["BM105", "BM115"], ["FIZ101", "FIZ111"], ["MAT101", "MAT111"],
  ["BM102", "BM112"], ["BM104", "BM114"], ["FIZ102", "FIZ112"], ["MAT102", "MAT112"],
  ["BM205", "BM225"], ["BM209", "BM229"], ["BM211", "BM221"], ["BM215", "BM217"],
  ["BM399", "BM397"], ["BM499", "BM497"],
];
const RENAMED_COURSE_EQUIVALENT: Record<string, string> = {};
RENAMED_COURSE_PAIRS.forEach(([oldCode, newCode]) => {
  RENAMED_COURSE_EQUIVALENT[oldCode] = newCode;
  RENAMED_COURSE_EQUIVALENT[newCode] = oldCode;
});

// OBS import guesses which pair of semesters an elective belongs to from the first digit of its
// own code (US2xx -> 3./4. yarıyıl, MS3xx -> 5./6., BM4xx -> 7./8.) — true for every real
// elective except UNI101, a generic "herhangi bir üniversite seçmelisi" code that belongs to the
// 3./4. yarıyıl pool despite starting with "1".
const ELECTIVE_POOL_OVERRIDES: Record<string, number[]> = {
  "UNI101": [3, 4],
};

const decodeShiftedText = (text: string): string => {
  // Typical shifted indicators (e.g. backslashes, percent signs, pluses, non-injective character mappings)
  const isShifted = /[\\]|[%]|[*]|[+]|[&]|[÷]|[ú]|[Õ]|[⊗]|[ø]/.test(text) || text.includes("LVWHP") || text.includes("LUL");
  if (!isShifted) return text;

  let decoded = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);

    if (char === ' ') {
      // Space maps to 'ö' in this font encoding
      decoded += 'ö';
    } else if (char === 'ø') {
      // Ligature for 'il' / 'İl'
      decoded += 'il';
    } else if (char === 'ú') {
      decoded += 'ş';
    } else if (char === 'Õ') {
      decoded += 'ı';
    } else if (char === '÷') {
      decoded += 'ğ';
    } else if (char === '⊗') {
      decoded += 'ülü';
    } else if (char === 'I') {
      // Ligature for 'fi'
      decoded += 'fi';
    } else if (code >= 33 && code <= 126) {
      // Normal ASCII shift +29
      const newCode = code + 29;
      decoded += String.fromCharCode(newCode);
    } else {
      decoded += char;
    }
  }

  // Formatting post-processing to clean up spacings and capitalizations
  return decoded
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      const first = word.charAt(0);
      const rest = word.slice(1);
      if (first === 'ı') return 'I' + rest;
      if (first === 'i') return 'İ' + rest;
      return first.toUpperCase() + rest;
    })
    .join(' ');
};

export function useTranscript() {
  const [bolognaYear, setBolognaYear] = useState<string>(DEFAULT_YEAR);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [lastObsImport, setLastObsImport] = useState<Semester[] | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize semesters from localStorage or default curriculum
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedYear = resolveYear(localStorage.getItem(`${STORAGE_PREFIX}bolognaYear`));
    setBolognaYear(savedYear);
    setSemesters(loadSemestersForYear(savedYear));

    const savedLastObs = localStorage.getItem(`${STORAGE_PREFIX}lastObsImport_${savedYear}`);
    if (savedLastObs) {
      try {
        setLastObsImport(JSON.parse(savedLastObs));
      } catch (_) {}
    }
    
    setIsInitialized(true);
  }, []);

  // Save to localStorage when semesters or year changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    localStorage.setItem(`${STORAGE_PREFIX}bolognaYear`, bolognaYear);
    localStorage.setItem(`${STORAGE_PREFIX}semesters_${bolognaYear}`, JSON.stringify(semesters));
  }, [semesters, bolognaYear, isInitialized]);

  // Change Bologna Year and load/initialize data
  const changeBolognaYear = useCallback((newYear: string) => {
    if (!CURRICULA[newYear]) return;

    setBolognaYear(newYear);
    setSemesters(loadSemestersForYear(newYear));

    const savedLastObs = localStorage.getItem(`${STORAGE_PREFIX}lastObsImport_${newYear}`);
    if (savedLastObs) {
      try {
        setLastObsImport(JSON.parse(savedLastObs));
      } catch (_) {
        setLastObsImport(null);
      }
    } else {
      setLastObsImport(null);
    }
  }, []);

  // Update a course's grade
  const updateCourseGrade = useCallback((semesterId: number, courseCode: string, grade: LetterGrade) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.semesterId !== semesterId) return sem;
      return {
        ...sem,
        courses: sem.courses.map(course => {
          if (course.courseCode !== courseCode) return course;
          return { ...course, grade };
        })
      };
    }));
  }, []);

  // Toggle whether to include a course in GPA
  const toggleCourseInclusion = useCallback((semesterId: number, courseCode: string) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.semesterId !== semesterId) return sem;
      return {
        ...sem,
        courses: sem.courses.map(course => {
          if (course.courseCode !== courseCode) return course;
          return { ...course, includeInGpa: !course.includeInGpa };
        })
      };
    }));
  }, []);

  // Add a custom course to a semester
  const addCustomCourse = useCallback((semesterId: number, newCourse: Omit<Course, 'isCustom'>) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.semesterId !== semesterId) return sem;
      // Prevent duplicate codes
      if (sem.courses.some(c => c.courseCode === newCourse.courseCode)) {
        return sem;
      }
      return {
        ...sem,
        courses: [...sem.courses, { ...newCourse, isCustom: true }]
      };
    }));
  }, []);

  // Delete a custom course
  const deleteCustomCourse = useCallback((semesterId: number, courseCode: string) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.semesterId !== semesterId) return sem;
      return {
        ...sem,
        courses: sem.courses.filter(c => c.courseCode !== courseCode)
      };
    }));
  }, []);

  // Update a course's name or code (used for editing placeholder electives)
  const updateCourseDetails = useCallback((semesterId: number, courseCode: string, fields: Partial<Course>) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.semesterId !== semesterId) return sem;
      return {
        ...sem,
        courses: sem.courses.map(c => {
          if (c.courseCode !== courseCode) return c;
          return { ...c, ...fields };
        })
      };
    }));
  }, []);

  // Reset transcript to default curriculum for the active year
  const resetTranscript = useCallback(() => {
    if (!CURRICULA[bolognaYear]) return;
    setSemesters(JSON.parse(JSON.stringify(CURRICULA[bolognaYear].curriculum)));
    setLastObsImport(null);
    localStorage.removeItem(`${STORAGE_PREFIX}lastObsImport_${bolognaYear}`);
  }, [bolognaYear]);

  // Revert back to the state imported from OBS
  const revertToObsImport = useCallback(() => {
    if (lastObsImport) {
      setSemesters(lastObsImport);
      localStorage.setItem(`${STORAGE_PREFIX}semesters_${bolognaYear}`, JSON.stringify(lastObsImport));
    }
  }, [lastObsImport, bolognaYear]);

  // Bulk actions
  const selectAllCourses = useCallback(() => {
    setSemesters(prev => prev.map(sem => ({
      ...sem,
      courses: sem.courses.map(c => ({ ...c, includeInGpa: true }))
    })));
  }, []);

  const deselectAllCourses = useCallback(() => {
    setSemesters(prev => prev.map(sem => ({
      ...sem,
      courses: sem.courses.map(c => ({ ...c, includeInGpa: false }))
    })));
  }, []);

  const resetAllInclusions = useCallback(() => {
    if (!CURRICULA[bolognaYear]) return;
    const defaultCurriculum = CURRICULA[bolognaYear].curriculum;
    setSemesters(prev => prev.map(sem => {
      const defaultSem = defaultCurriculum.find(s => s.semesterId === sem.semesterId);
      return {
        ...sem,
        courses: sem.courses.map(course => {
          const defaultCourse = defaultSem?.courses.find(c => c.courseCode === course.courseCode);
          return {
            ...course,
            includeInGpa: defaultCourse ? defaultCourse.includeInGpa : true
          };
        })
      };
    }));
  }, [bolognaYear]);

  const clearAllGrades = useCallback(() => {
    setSemesters(prev => prev.map(sem => ({
      ...sem,
      courses: sem.courses.map(c => ({ ...c, grade: undefined }))
    })));
  }, []);

  // Import JSON configuration
  const importTranscriptData = useCallback((importedSemesters: Semester[], importedYear?: string) => {
    if (importedYear && CURRICULA[importedYear]) {
      setBolognaYear(importedYear);
    }
    setSemesters(importedSemesters);
  }, []);

  // Parse OBS plain text and extract grades
  const parseTranscriptText = useCallback((text: string) => {
    // Privacy protection: strip TC identity and student numbers
    const sanitizedText = text
      .replace(/\b\d{11}\b/g, '***********')
      .replace(/\b\d{9,10}\b/g, '*********');

    const normalizedText = sanitizedText.trim();
    const lines = normalizedText.split(/\r?\n/).map(l => l.trim());

    const normalizeString = (str: string) => {
      return str
        .toUpperCase()
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'O')
        .replace(/[^A-Z0-9]/g, '');
    };

    // Detect which Bologna Yılı curriculum the pasted course codes actually belong to. Course
    // codes changed between eras (e.g. BM101 -> BM111 after 2024), so importing against the
    // wrong currently-selected year means none of the student's real courses match any
    // compulsory course — every one of them then gets misread as an unrecognized elective and
    // added as a duplicate "Kişisel" entry alongside the (empty) real compulsory course. Instead,
    // score every curriculum year by how many pasted codes are compulsory courses there, and
    // import against whichever year actually matches.
    const codesInText = new Set<string>();
    lines.forEach(line => {
      const re = /\b([A-Z]{2,3})\s*(\d{3})\b/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        codesInText.add(normalizeString(m[1] + m[2]));
      }
    });

    let bestYear = bolognaYear;
    let bestScore = -1;
    const scoreByYear: Record<string, number> = {};
    Object.keys(CURRICULA).forEach(year => {
      const compulsoryCodes = new Set<string>();
      CURRICULA[year].curriculum.forEach(sem => sem.courses.forEach(c => {
        if (!c.courseCode.toUpperCase().startsWith("SEC")) {
          compulsoryCodes.add(normalizeString(c.courseCode));
        }
      }));
      let score = 0;
      codesInText.forEach(code => { if (compulsoryCodes.has(code)) score++; });
      scoreByYear[year] = score;
      if (score > bestScore) {
        bestScore = score;
        bestYear = year;
      }
    });

    // Only switch away from the currently selected year if another year clearly matches
    // better — avoids flip-flopping over the handful of codes shared by every era
    // (AIB101, ING101, TDB121, etc).
    const currentYearScore = scoreByYear[bolognaYear] ?? 0;
    const yearSwitched = bestScore >= 3 && bestScore > currentYearScore && bestYear !== bolognaYear;
    const effectiveYear = yearSwitched ? bestYear : bolognaYear;

    const updatedSemesters: Semester[] = yearSwitched
      ? loadSemestersForYear(effectiveYear)
      : (JSON.parse(JSON.stringify(semesters)) as Semester[]);

    const foundCourses: { code: string; name: string; grade: string }[] = [];

    const gradeList = ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "FD", "FF", "DZ", "GR", "YT", "YZ"];

    // Fallback names sourced directly from Düzce Üniversitesi EBS (ebs.duzce.edu.tr) course
    // pools (SECSOS3/4YY, SECTEK5/6YY, SECMES7/8YY). Only used when the pasted OBS text itself
    // doesn't contain a usable course name — the parsed name always takes priority.
    const ELECTIVE_NAMES: Record<string, string> = {
      // BM 3./4. YY Üniversite Seçmelisi (SECSOS3YY / SECSOS4YY)
      "US201": "Bilim Tarihi ve Felsefesi",
      "US203": "Çevre ve Enerji",
      "US205": "Davranış Bilimine Giriş",
      "US207": "Girişimcilik",
      "US209": "İletişim Tekniği",
      "US211": "İş Psikolojisi",
      "US213": "İşletme Yönetimi",
      "US215": "Kültür Tarihi",
      "US217": "Sanat Tarihi",
      "US219": "Sivil Toplum Organizasyonları",
      "US221": "Uygarlık Tarihi",
      "US225": "Girişimcilik I",
      "US227": "Girişimcilik II",
      "TAR233": "Çalgı Eğitimi I",
      "UNI101": "Üniversite Seçmeli",
      // BM 5./6. YY Fakülte Seçmelisi (SECTEK5YY / SECTEK6YY)
      "MS301": "Endüstri İlişkileri",
      "MS303": "Meslek Hastalıkları",
      "MS305": "Teknoloji Felsefesi",
      "MS307": "Mühendisler İçin Yönetim",
      "MS309": "Mühendislik Etiği",
      "MS311": "Kalite Yönetim Sistemleri ve Uygulaması",
      "MS313": "Toplam Kalite Yönetimi",
      "MS315": "İş Güvenliği",
      "MS317": "İş Hukuku",
      "MS319": "Mühendislik Ekonomisi",
      "MS321": "Bilişim Teknolojilerinde Yeni Gelişmeler",
      "MS323": "Betik Dilleri",
      "MS325": "Mühendisler için Çevre Bilimi",
      "MS327": "Sıfır Atık Yönetimi",
      "MS332": "Bilimsel Araştırma ve Rapor Yazma",
      "MS334": "Mühendislikte İnovasyon Yönetimi",
      "MS335": "Mühendislikte Girişimcilik ve Ticarileştirme",
      // BM 7./8. YY Bölüm Seçmelisi (SECMES7YY / SECMES8YY)
      "BM420": "Bilgisayar Mimarileri",
      "BM421": "Bilgisayar Grafiği",
      "BM422": "Biyobilişime Giriş",
      "BM423": "Bulanık Mantık ve Yapay Sinir Ağlarına Giriş",
      "BM424": "Derleyici Tasarımı",
      "BM425": "Erp Sistemleri",
      "BM426": "Gerçek Zamanlı Ağ Sistemleri",
      "BM427": "İnternet Mühendisliği",
      "BM428": "Oyun Programlamaya Giriş",
      "BM429": "Optimizasyon",
      "BM430": "Proje Yönetimi",
      "BM431": "Örüntü Tanıma",
      "BM432": "Robotik",
      "BM433": "Sayısal İşaret İşleme",
      "BM434": "Sayısal Kontrol Sistemleri",
      "BM435": "Veri Madenciliği",
      "BM436": "Sistem Simülasyonu",
      "BM437": "Yapay Zeka",
      "BM438": "Yurtdışı Staj Etkinliği",
      "BM439": "Bilgisayar Görmesi",
      "BM440": "Veri Tabanı Tasarımı ve Uygulamaları",
      "BM441": "Bilgisayar Güvenliğine Giriş",
      "BM442": "Görsel Programlama",
      "BM443": "Mobil Programlama",
      "BM444": "Yazılım Tasarım Kalıpları",
      "BM445": "Java Programlama",
      "BM447": "Sayısal Görüntü İşleme",
      "BM449": "Ağ Güvenliğine Giriş",
      "BM451": "Kontrol Sistemlerine Giriş",
      "BM453": "İçerik Yönetim Sistemleri",
      "BM455": "Bulanık Mantığa Giriş",
      "BM457": "Bilgisayar Aritmetiği ve Otomata",
      "BM459": "Yazılım Test Mühendisliği",
      "BM461": "Coğrafi Bilgi Sistemleri",
      "BM463": "İleri Sistem Programlama",
      "BM465": "Mikrodenetleyiciler ve Uygulamaları",
      "BM467": "Kodlama Teorisi ve Kriptografi",
      "BM469": "Makine Öğrenmesine Giriş",
      "BM470": "İleri Java Programlama",
      "BM471": "Gömülü Sistem Uygulamaları",
      "BM472": "Ağ Programlama",
      "BM473": "Karar Destek Sistemleri",
      "BM474": "ERP Uygulamaları",
      "BM475": "Kurumsal Java",
      "BM476": "Açık Kaynak Programlama",
      "BM477": "Graf Teorisi",
      "BM478": "Python İle Veri Bilimine Giriş",
      "BM479": "Kompleks Ağ Analizi",
      "BM480": "Derin Öğrenme",
      "BM481": "Sanallaştırma Teknolojileri",
      "BM482": "Yazılım Gereksinimleri Mühendisliği",
      "BM483": "Doğal Dil İşlemeye Giriş",
      "BM485": "Dosya Organizasyonu",
      "BM486": "Sayısal Sistem Tasarım",
      "BM487": "Nesnelerin İnterneti",
      "BM488": "Veri Analizi ve Tahminleme Yöntemleri",
      "BM489": "Programlanabilir Mantık Denetleyiciler",
      "BM490": "Bilgi Güvenliği",
      "BM491": "Sistem Biyolojisi",
      "BM492": "Tıbbi İstatistik ve Tıp Bilişimine Giriş",
      "BM493": "Veri İletişimi",
      "BM494": "Kablosuz Haberleşme",
      "BM495": "İleri Gömülü Sistem Uygulamaları",
      "BM496": "Bilgi Mühendisliği ve Büyük Veriye Giriş",
      "BM404": "İşletmede Mesleki Eğitim",
      "MTH401": "LLM Tabanlı Soru-Cevap Sistemleri"
    };

    lines.forEach(line => {
      // Try parsing the line as a course line. Semester/class headers in the pasted text are
      // intentionally ignored for placement purposes: elective course pools are shared between
      // the two semesters of a class year (e.g. the same ~60 department electives can be taken
      // in either the 7th or 8th semester), so trusting a fragile "N. Yarıyıl" header parse to
      // pick one over the other only risks misplacing courses. Placement below instead fills
      // whichever semester of the pair still has an open elective slot, in the order courses
      // appear in the pasted text.
      const codeMatch = line.match(/\b([A-Z]{2,3})\s*(\d{3})\b/i);
      if (!codeMatch) return;

      const code = (codeMatch[1] + codeMatch[2]).toUpperCase();
      const codeNorm = normalizeString(code);

      // Find grade on the line
      let matchedGrade: string | null = null;
      let gradeIndex = -1;
      
      const tokens = line.split(/[\s,;|\t]+/);
      for (let j = tokens.length - 1; j >= 0; j--) {
        const tok = tokens[j].toUpperCase();
        if (gradeList.includes(tok)) {
          matchedGrade = tok;
          gradeIndex = j;
          break;
        }
      }

      // Look at subsequent lines (up to 8 lines) if grade not on same line
      if (!matchedGrade) {
        const lineIndex = lines.indexOf(line);
        if (lineIndex !== -1) {
          for (let offset = 1; offset <= 8 && (lineIndex + offset) < lines.length; offset++) {
            const nextLine = lines[lineIndex + offset];
            
            // Stop if next line is another course code
            const nextLineNorm = normalizeString(nextLine);
            if (/[A-Z]{2,3}\d{3}/.test(nextLineNorm)) {
              break;
            }

            const nextTokens = nextLine.split(/[\s,;|\t]+/);
            for (let j = nextTokens.length - 1; j >= 0; j--) {
              const tok = nextTokens[j].toUpperCase();
              if (gradeList.includes(tok)) {
                matchedGrade = tok;
                break;
              }
            }
            if (matchedGrade) break;
          }
        }
      }

      if (!matchedGrade) return; // Skip if no grade is found

      let finalGrade = matchedGrade;
      if (matchedGrade === "GR") {
        finalGrade = "FF";
      }

      // Extract credit and AKTS values
      let credit = 0;
      let akts = 0;
      const numbers: number[] = [];
      const limit = gradeIndex !== -1 ? gradeIndex : tokens.length;

      for (let i = 0; i < limit; i++) {
        const token = tokens[i];
        if (token.match(/^\d+(?:\.\d+)?$/)) {
          numbers.push(parseFloat(token));
        }
      }

      if (numbers.length >= 2) {
        akts = numbers[numbers.length - 1];
        credit = numbers[numbers.length - 2];
      } else if (numbers.length === 1) {
        akts = numbers[0];
        credit = numbers[0];
      }

      // Extract course name
      let codeIndex = -1;
      for (let i = 0; i < tokens.length; i++) {
        if (normalizeString(tokens[i]).includes(normalizeString(codeMatch[1] + codeMatch[2]))) {
          codeIndex = i;
          break;
        }
      }
      if (codeIndex === -1) {
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i].toUpperCase() === codeMatch[1].toUpperCase() && tokens[i+1] === codeMatch[2]) {
            codeIndex = i + 1;
            break;
          }
        }
      }

      const startNameIndex = codeIndex !== -1 ? codeIndex + 1 : 0;
      let endNameIndex = gradeIndex !== -1 ? gradeIndex : tokens.length;
      for (let i = startNameIndex; i < endNameIndex; i++) {
        if (tokens[i].match(/^\d+(?:\.\d+)?$/)) {
          endNameIndex = i;
          break;
        }
      }

      const courseName = tokens.slice(startNameIndex, endNameIndex).join(' ').trim() || "Seçmeli Ders";

      // 3. Match compulsory course
      let isCompulsoryMatched = false;
      for (let sIndex = 0; sIndex < updatedSemesters.length; sIndex++) {
        const sem = updatedSemesters[sIndex];
        const compCourse = sem.courses.find(c => {
          const cCode = normalizeString(c.courseCode);
          // A course renamed across the 2024 curriculum change (e.g. BM101/BM111) is the same
          // course regardless of which code variant the student's transcript happens to use.
          return cCode === codeNorm || RENAMED_COURSE_EQUIVALENT[cCode] === codeNorm;
        });
        if (compCourse) {
          compCourse.grade = finalGrade as LetterGrade;
          foundCourses.push({
            code: compCourse.courseCode,
            name: compCourse.courseName,
            grade: finalGrade
          });
          isCompulsoryMatched = true;
          break;
        }
      }

      // 4. Handle Elective course: update if already present anywhere, otherwise place it
      if (!isCompulsoryMatched) {
        // Prefer the verified EBS name whenever the code is a known elective: real OBS/PDF
        // exports are frequently copied with a broken font encoding (missing spaces, dropped
        // Turkish letters) that no amount of decoding fully recovers. Only fall back to the
        // parsed name for codes we don't have on file (e.g. a cross-listed course from another
        // department), where it's the only information available.
        const parsedName = decodeShiftedText(courseName);
        const cleanName = ELECTIVE_NAMES[code] || (parsedName && parsedName !== "Seçmeli Ders" ? parsedName : "Seçmeli Ders");

        // If this exact elective code was already placed earlier (e.g. the transcript was
        // pasted twice, or it was matched into a placeholder in a previous import), update it
        // in place instead of creating a duplicate entry elsewhere.
        let existingCourse: Course | undefined;
        for (const sem of updatedSemesters) {
          existingCourse = sem.courses.find(c => normalizeString(c.courseCode) === codeNorm && !c.courseCode.toUpperCase().startsWith("SEC"));
          if (existingCourse) break;
        }

        if (existingCourse) {
          existingCourse.grade = finalGrade as LetterGrade;
          existingCourse.courseName = cleanName;
          if (credit > 0) existingCourse.credit = credit;
          if (akts > 0) existingCourse.akts = akts;
          foundCourses.push({
            code: existingCourse.courseCode,
            name: existingCourse.courseName,
            grade: finalGrade
          });
        } else {
          // Determine the class year from the first digit of the course code number
          // (e.g. US225 -> 2nd year, BM451 -> 4th year) and fill whichever semester of that
          // year's pair (Güz/Bahar) still has an open elective placeholder, in text order. This
          // placement never looks at which semester the pasted text says the course was taken
          // in, so it's unaffected by üstten/alttan ders alma (a course taken out of its normal
          // semester) — it always lands in the semester the curriculum actually assigns it to.
          // A couple of real codes (UNI101) don't follow their pool's own digit pattern, so
          // known exceptions are corrected before falling back to the digit guess.
          const numMatch = code.match(/\d/);
          const codeFirstDigit = numMatch ? parseInt(numMatch[0], 10) : 0;

          let targetSemesters: number[] = ELECTIVE_POOL_OVERRIDES[code] || [];
          if (targetSemesters.length === 0) {
            if (codeFirstDigit === 1) targetSemesters = [1, 2];
            else if (codeFirstDigit === 2) targetSemesters = [3, 4];
            else if (codeFirstDigit === 3) targetSemesters = [5, 6];
            else if (codeFirstDigit === 4) targetSemesters = [7, 8];
            else targetSemesters = updatedSemesters.map(s => s.semesterId);
          }

          let assignedSemesterId: number | undefined = targetSemesters.find(semId => {
            const sem = updatedSemesters.find(s => s.semesterId === semId);
            return sem && sem.courses.some(c => c.courseCode.toUpperCase().startsWith("SEC"));
          });
          if (assignedSemesterId === undefined) {
            assignedSemesterId = targetSemesters[0];
          }

          const sem = updatedSemesters.find(s => s.semesterId === assignedSemesterId);
          if (sem) {
            const placeholder = sem.courses.find(c => c.courseCode.toUpperCase().startsWith("SEC"));
            if (placeholder) {
              placeholder.courseCode = code;
              placeholder.courseName = cleanName;
              if (credit > 0) placeholder.credit = credit;
              if (akts > 0) placeholder.akts = akts;
              placeholder.grade = finalGrade as LetterGrade;
              foundCourses.push({
                code,
                name: cleanName,
                grade: finalGrade
              });
            } else {
              sem.courses.push({
                courseCode: code,
                courseName: cleanName,
                credit: credit || 3,
                akts: akts || 5,
                type: "Seçmeli",
                includeInGpa: true,
                grade: finalGrade as LetterGrade,
                isCustom: true
              });
              foundCourses.push({
                code,
                name: cleanName,
                grade: finalGrade
              });
            }
          }
        }
      }
    });

    if (foundCourses.length > 0) {
      if (yearSwitched) {
        setBolognaYear(effectiveYear);
        localStorage.setItem(`${STORAGE_PREFIX}bolognaYear`, effectiveYear);
      }
      setSemesters(updatedSemesters);
      setLastObsImport(updatedSemesters);
      localStorage.setItem(`${STORAGE_PREFIX}semesters_${effectiveYear}`, JSON.stringify(updatedSemesters));
      localStorage.setItem(`${STORAGE_PREFIX}lastObsImport_${effectiveYear}`, JSON.stringify(updatedSemesters));
    }
    return { matched: foundCourses, detectedYear: yearSwitched ? effectiveYear : undefined };
  }, [semesters, bolognaYear]);

  // Calculations
  const calculateSemesterStats = useCallback((semester: Semester) => {
    let totalWeight = 0;
    let weightedSum = 0;
    let totalRegisteredAkts = 0;
    let totalRegisteredCredits = 0;
    let totalCompletedAkts = 0;
    let totalCompletedCredits = 0;

    semester.courses.forEach(course => {
      totalRegisteredAkts += course.akts;
      totalRegisteredCredits += course.credit;

      const weight = course.akts;
      const isPassed = course.grade && ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "YT"].includes(course.grade);

      if (isPassed) {
        totalCompletedAkts += course.akts;
        totalCompletedCredits += course.credit;
      }

      // Check if course has a grade and is included in GPA
      if (course.grade !== undefined && course.grade !== "" && course.includeInGpa) {
        // If it's a non-gpa grade (like YT / YZ), skip GPA math
        if (["YT", "YZ"].includes(course.grade)) {
          return;
        }

        const multiplier = GRADE_MULTIPLIERS[course.grade];
        if (multiplier !== undefined) {
          weightedSum += multiplier * weight;
          totalWeight += weight;
        }
      }
    });

    const gpa = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      gpa,
      totalRegisteredAkts,
      totalRegisteredCredits,
      totalCompletedAkts,
      totalCompletedCompletedCredits: totalCompletedCredits,
      totalWeightUsed: totalWeight
    };
  }, []);

  // Overall calculations (CGPA)
  const calculateOverallStats = useCallback(() => {
    let grandWeightedSum = 0;
    let grandTotalWeight = 0;
    let grandRegisteredAkts = 0;
    let grandRegisteredCredits = 0;
    let grandCompletedAkts = 0;
    let grandCompletedCredits = 0;

    // Grade distributions count
    const gradeDistribution: Record<string, number> = {};

    semesters.forEach(sem => {
      sem.courses.forEach(course => {
        grandRegisteredAkts += course.akts;
        grandRegisteredCredits += course.credit;

        const weight = course.akts;
        const grade = course.grade;

        if (grade) {
          gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
          const isPassed = ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "YT"].includes(grade);
          
          if (isPassed) {
            grandCompletedAkts += course.akts;
            grandCompletedCredits += course.credit;
          }

          if (course.includeInGpa && !["YT", "YZ"].includes(grade)) {
            const multiplier = GRADE_MULTIPLIERS[grade];
            if (multiplier !== undefined) {
              grandWeightedSum += multiplier * weight;
              grandTotalWeight += weight;
            }
          }
        }
      });
    });

    const cgpa = grandTotalWeight > 0 ? grandWeightedSum / grandTotalWeight : 0;

    return {
      cgpa,
      grandRegisteredAkts,
      grandRegisteredCredits,
      grandCompletedAkts,
      grandCompletedCredits,
      grandTotalWeight,
      gradeDistribution
    };
  }, [semesters]);

  return {
    bolognaYear,
    semesters,
    isInitialized,
    availableYears: Object.keys(CURRICULA),
    universityInfo: {
      university: CURRICULA[bolognaYear]?.university || "Düzce Üniversitesi",
      faculty: CURRICULA[bolognaYear]?.faculty || "Mühendislik Fakültesi",
      department: CURRICULA[bolognaYear]?.department || "Bilgisayar Mühendisliği",
      degree: CURRICULA[bolognaYear]?.degree || "Lisans",
    },
    changeBolognaYear,
    updateCourseGrade,
    toggleCourseInclusion,
    addCustomCourse,
    deleteCustomCourse,
    updateCourseDetails,
    resetTranscript,
    selectAllCourses,
    deselectAllCourses,
    resetAllInclusions,
    clearAllGrades,
    importTranscriptData,
    parseTranscriptText,
    calculateSemesterStats,
    calculateOverallStats,
    hasObsImport: !!lastObsImport,
    revertToObsImport
  };
}
