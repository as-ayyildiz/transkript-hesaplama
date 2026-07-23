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

const STORAGE_PREFIX = 'transkript_hesaplama_';

export function useTranscript() {
  const [bolognaYear, setBolognaYear] = useState<string>("2025-2026");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [lastObsImport, setLastObsImport] = useState<Semester[] | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize semesters from localStorage or default curriculum
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedYear = localStorage.getItem(`${STORAGE_PREFIX}bolognaYear`) || "2025-2026";
    setBolognaYear(savedYear);

    const savedSemesters = localStorage.getItem(`${STORAGE_PREFIX}semesters_${savedYear}`);
    const savedLastObs = localStorage.getItem(`${STORAGE_PREFIX}lastObsImport_${savedYear}`);

    if (savedSemesters) {
      try {
        setSemesters(JSON.parse(savedSemesters));
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
        setSemesters(JSON.parse(savedSemesters));
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

    const ELECTIVE_NAMES: Record<string, string> = {
      "US201": "Bilim Tarihi ve Felsefesi",
      "US203": "Afet Yönetimi ve Afet Bilinci",
      "US207": "Tüketici Davranışları",
      "US209": "İşaret Dili",
      "US211": "Gönüllülük Çalışmaları",
      "US213": "Sürdürülebilir Kalkınma",
      "US215": "Medya Okuryazarlığı",
      "US217": "Temel İlk Yardım",
      "US219": "Sağlıklı Yaşam ve Egzersiz",
      "US221": "İş Sağlığı ve Güvenliği I",
      "US223": "Değerlerimiz",
      "US225": "Girişimcilik I",
      "US227": "Eleştirel Düşünme",
      "US229": "Proje Yönetimi"
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

    let currentSemesterId = 1;

    lines.forEach(line => {
      // 1. Detect semester headers (e.g. 1. Yarıyıl, 2. Dönem, 3.YY vb.)
      const semMatch = line.match(/(\d+)\s*\.\s*(?:Yarıyıl|Yariyil|Dönem|Donem|Yy|Y\.Y)/i);
      if (semMatch) {
        currentSemesterId = parseInt(semMatch[1], 10);
        return;
      }

      // 2. Try parsing the line as a course line
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
      } else if (matchedGrade === "YT" || matchedGrade === "YZ") {
        finalGrade = "";
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
        const compCourse = sem.courses.find(c => normalizeString(c.courseCode) === codeNorm);
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

      // 4. Handle Elective course replacement or addition
      if (!isCompulsoryMatched) {
        // Determine year from first digit of the course code number (e.g. US225 -> 2)
        const numMatch = code.match(/\d/);
        const codeFirstDigit = numMatch ? parseInt(numMatch[0], 10) : 0;
        
        let targetSemesters: number[] = [];
        if (codeFirstDigit === 1) targetSemesters = [1, 2];
        else if (codeFirstDigit === 2) targetSemesters = [3, 4];
        else if (codeFirstDigit === 3) targetSemesters = [5, 6];
        else if (codeFirstDigit === 4) targetSemesters = [7, 8];
        
        // Find the best semester to put this elective in
        let assignedSemesterId = currentSemesterId;
        
        // If currentSemesterId is not within targetSemesters, we fallback to finding the first target semester with an unused placeholder
        if (!targetSemesters.includes(currentSemesterId)) {
          let foundSem = false;
          for (const semId of targetSemesters) {
            const sem = updatedSemesters.find(s => s.semesterId === semId);
            if (sem && sem.courses.some(c => c.courseCode.toUpperCase().startsWith("SEC"))) {
              assignedSemesterId = semId;
              foundSem = true;
              break;
            }
          }
          if (!foundSem && targetSemesters.length > 0) {
            assignedSemesterId = targetSemesters[0];
          }
        }

        const cleanName = ELECTIVE_NAMES[code] || courseName;

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
            // Check if course already added to avoid duplicates
            if (!sem.courses.some(c => normalizeString(c.courseCode) === codeNorm)) {
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
