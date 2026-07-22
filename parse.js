const fs = require('fs');
const path = require('path');

// Helper to decode HTML entities
function decodeHtml(htmlStr) {
  return htmlStr
    .replace(/&#214;/g, 'Ö')
    .replace(/&#246;/g, 'ö')
    .replace(/&#220;/g, 'Ü')
    .replace(/&#252;/g, 'ü')
    .replace(/&#199;/g, 'Ç')
    .replace(/&#231;/g, 'ç')
    .replace(/&#350;/g, 'Ş')
    .replace(/&#351;/g, 'ş')
    .replace(/&#304;/g, 'İ')
    .replace(/&#305;/g, 'ı')
    .replace(/&#286;/g, 'Ğ')
    .replace(/&#287;/g, 'ğ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFile(filePath, filename) {
  // Determine year from filename
  // Format could be curriculum20222023.html or curriculum.html
  let year = "2025-2026"; // default fallback
  const yearMatch = filename.match(/curriculum(\d{4})(\d{4})/i);
  if (yearMatch) {
    year = `${yearMatch[1]}-${yearMatch[2]}`;
  }

  console.log(`Parsing ${filename} for year ${year}...`);

  const html = fs.readFileSync(filePath, 'utf8');
  const semesters = [];

  // Regular expression to match semesters and their tables
  const semesterRegex = /id="y_(\d+)(?:Yarıyıl|Yariyil)[^>]*">[\s\S]*?<h5>([^<]+)<\/h5>[\s\S]*?<div class="ibox-content">([\s\S]*?)<\/table>/gi;

  let match;
  // Reset regex index
  semesterRegex.lastIndex = 0;
  while ((match = semesterRegex.exec(html)) !== null) {
    const semesterId = parseInt(match[1], 10);
    const semesterName = decodeHtml(match[2]);
    const tableContent = match[3];

    const courses = [];
    const rowRegex = /<tr id="dersRow_[^"]*">([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cellsContent = rowMatch[1];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(cellsContent)) !== null) {
        cells.push(cellMatch[1].trim());
      }

      if (cells.length >= 7) {
        const courseCode = decodeHtml(cells[0]);

        const nameMatch = /<a[^>]*>([\s\S]*?)<\/a>/i.exec(cells[1]);
        const rawName = nameMatch ? nameMatch[1] : cells[1];
        const courseName = decodeHtml(rawName);

        const isZorunlu = decodeHtml(cells[2]).toLowerCase().includes('evet');
        const includeInGpa = decodeHtml(cells[3]).toLowerCase().includes('evet');
        const tu = decodeHtml(cells[4]);
        const credit = parseInt(decodeHtml(cells[5]), 10) || 0;
        const akts = parseInt(decodeHtml(cells[6]), 10) || 0;

        let type = isZorunlu ? "Zorunlu" : "Seçmeli";
        if (courseName.toLowerCase().includes('staj')) {
          type = "Staj";
        }

        courses.push({
          courseCode,
          courseName,
          akts,
          credit,
          type,
          includeInGpa
        });
      }
    }

    semesters.push({
      semesterId,
      semesterName,
      courses
    });
  }

  const result = {
    university: "Düzce Üniversitesi",
    faculty: "Mühendislik Fakültesi",
    department: "Bilgisayar Mühendisliği",
    degree: "Lisans",
    bolognaYear: year,
    totalSemesters: 8,
    curriculum: semesters
  };

  // Ensure directory exists
  const outputDir = path.join(__dirname, 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `bilgisayar-muhendisligi-${year}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Successfully wrote curriculum JSON to ${outputPath}`);
}

// Find all curriculum*.html files in current directory
const files = fs.readdirSync(__dirname);
const curriculumFiles = files.filter(f => f.toLowerCase().startsWith('curriculum') && f.toLowerCase().endsWith('.html'));

if (curriculumFiles.length === 0) {
  console.error("No curriculum HTML files found!");
  process.exit(1);
}

curriculumFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    parseFile(filePath, file);
  } catch (err) {
    console.error(`Error parsing ${file}:`, err);
  }
});

console.log("All parsing operations completed!");
