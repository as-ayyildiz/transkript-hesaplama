'use client';

import { useState, useEffect, useCallback } from 'react';
import { Course, Semester, Curriculum, LetterGrade, GRADE_MULTIPLIERS } from '../types/transcript';
import curriculum2022 from '../data/bilgisayar-muhendisligi-2022-2023.json';
import curriculum2023 from '../data/bilgisayar-muhendisligi-2023-2024.json';
import curriculum2024 from '../data/bilgisayar-muhendisligi-2024-2025.json';
import curriculum2025 from '../data/bilgisayar-muhendisligi-2025-2026.json';

const CURRICULA: Record<string, Curriculum> = {
  "2022-2023": curriculum2022 as Curriculum,
  "2023-2024": curriculum2023 as Curriculum,
  "2024-2025": curriculum2024 as Curriculum,
  "2025-2026": curriculum2025 as Curriculum,
};

const DEFAULT_YEAR = "2025-2026";
const STORAGE_PREFIX = 'transkript_hesaplama_';

// Guards against a stale/corrupted bolognaYear in localStorage (e.g. left over from a version
// of the app that supported a curriculum year no longer offered) crashing the whole app on load.
const resolveYear = (year: string | null): string => (year && CURRICULA[year]) ? year : DEFAULT_YEAR;

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

const decodeShiftedText = (text: string): string => {
  // Typical shifted indicators (e.g. backslashes, percent signs, pluses, non-injective character mappings)
  const isShifted = /[\\]|[%]|[*]|[+]|[&]|[÷]|[ú]|[Õ]|[⊗]/.test(text) || text.includes("LVWHP") || text.includes("LUL");
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

    const savedSemesters = localStorage.getItem(`${STORAGE_PREFIX}semesters_${savedYear}`);
    const savedLastObs = localStorage.getItem(`${STORAGE_PREFIX}lastObsImport_${savedYear}`);

    if (savedSemesters) {
      try {
        let parsed = JSON.parse(savedSemesters) as Semester[];
        const needsMigration = parsed.some(sem => sem.courses.some(c => c.courseCode === "SECMES7YY" || c.courseCode === "SECMES8YY"));
        if (needsMigration) {
          const defaultValue = JSON.parse(JSON.stringify(CURRICULA[savedYear].curriculum)) as Semester[];
          parsed = migrateSemesters(parsed, defaultValue);
          localStorage.setItem(`${STORAGE_PREFIX}semesters_${savedYear}`, JSON.stringify(parsed));
          localStorage.removeItem(`${STORAGE_PREFIX}lastObsImport_${savedYear}`);
        }
        setSemesters(parsed);
      } catch (e) {
        console.error("Error parsing saved semesters", e);
        setSemesters(JSON.parse(JSON.stringify(CURRICULA[savedYear].curriculum)));
      }
    } else {
      // Deep copy to prevent mutating static JSON reference
      setSemesters(JSON.parse(JSON.stringify(CURRICULA[savedYear].curriculum)));
    }

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
    const savedSemesters = localStorage.getItem(`${STORAGE_PREFIX}semesters_${newYear}`);
    if (savedSemesters) {
      try {
        let parsed = JSON.parse(savedSemesters) as Semester[];
        const needsMigration = parsed.some(sem => sem.courses.some(c => c.courseCode === "SECMES7YY" || c.courseCode === "SECMES8YY"));
        if (needsMigration) {
          const defaultValue = JSON.parse(JSON.stringify(CURRICULA[newYear].curriculum)) as Semester[];
          parsed = migrateSemesters(parsed, defaultValue);
          localStorage.setItem(`${STORAGE_PREFIX}semesters_${newYear}`, JSON.stringify(parsed));
          localStorage.removeItem(`${STORAGE_PREFIX}lastObsImport_${newYear}`);
        }
        setSemesters(parsed);
      } catch (e) {
        setSemesters(JSON.parse(JSON.stringify(CURRICULA[newYear].curriculum)));
      }
    } else {
      setSemesters(JSON.parse(JSON.stringify(CURRICULA[newYear].curriculum)));
    }

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
    const updatedSemesters = JSON.parse(JSON.stringify(semesters)) as Semester[];
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
          if ((cCode === "BM497" || cCode === "BM499") && (codeNorm === "BM497" || codeNorm === "BM499")) {
            return true;
          }
          if ((cCode === "BM397" || cCode === "BM399") && (codeNorm === "BM397" || codeNorm === "BM399")) {
            return true;
          }
          return cCode === codeNorm;
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
        // The parsed name from the student's own transcript is always the source of truth;
        // the dictionary is only a fallback for when extraction comes up empty (e.g. the name
        // got split across lines in a way we couldn't reconstruct).
        const parsedName = decodeShiftedText(courseName);
        const cleanName = parsedName && parsedName !== "Seçmeli Ders" ? parsedName : (ELECTIVE_NAMES[code] || "Seçmeli Ders");

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
          // year's pair (Güz/Bahar) still has an open elective placeholder, in text order.
          const numMatch = code.match(/\d/);
          const codeFirstDigit = numMatch ? parseInt(numMatch[0], 10) : 0;

          let targetSemesters: number[] = [];
          if (codeFirstDigit === 1) targetSemesters = [1, 2];
          else if (codeFirstDigit === 2) targetSemesters = [3, 4];
          else if (codeFirstDigit === 3) targetSemesters = [5, 6];
          else if (codeFirstDigit === 4) targetSemesters = [7, 8];
          else targetSemesters = updatedSemesters.map(s => s.semesterId);

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
      setSemesters(updatedSemesters);
      setLastObsImport(updatedSemesters);
      localStorage.setItem(`${STORAGE_PREFIX}lastObsImport_${bolognaYear}`, JSON.stringify(updatedSemesters));
    }
    return foundCourses;
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
