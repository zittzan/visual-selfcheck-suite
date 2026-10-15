function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let i = 0;
  const len = text.length;
  while (i < len) {
    const row = [];
    while (true) {
      if (i < len && text[i] === '"') {
        i++;
        let field = '';
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else { field += text[i++]; }
        }
        row.push(field);
      } else {
        let field = '';
        while (i < len && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          field += text[i++];
        }
        row.push(field);
      }
      if (i < len && text[i] === ',') { i++; } else { break; }
    }
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;
    rows.push(row);
  }
  return rows;
}

function buildFileMap(fileList) {
  const map = new Map();
  const files = Array.from(fileList);
  if (files.length === 0) return map;
  const rootDir = files[0].webkitRelativePath.split('/')[0] + '/';
  for (const file of files) {
    const fullPath = file.webkitRelativePath;
    const stripped = fullPath.startsWith(rootDir) ? fullPath.slice(rootDir.length) : fullPath;
    map.set(stripped, URL.createObjectURL(file));
  }
  return map;
}

function findCSVFile(fileList) {
  const files = Array.from(fileList);
  if (files.length === 0) return null;
  const rootDir = files[0].webkitRelativePath.split('/')[0] + '/';
  return files.find(f => {
    const rel = f.webkitRelativePath.startsWith(rootDir)
      ? f.webkitRelativePath.slice(rootDir.length)
      : f.webkitRelativePath;
    return rel.endsWith('.csv') && !rel.includes('/');
  }) || null;
}

function buildQuestions(rows, fileMap) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const col = name => headers.indexOf(name);
  const titleIdx = col('title');
  const catIdx   = col('category');
  const descIdx  = col('description');
  const noteIdx  = col('note');
  const goodIdx  = col('good_image');
  const badIdx   = col('bad_image');
  const urlIdx   = col('url');
  const catCounts = {};
  const questions = [];
  function resolveImages(raw) {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').reduce((acc, p) => {
      const decoded = decodeURIComponent(p.trim());
      if (!decoded) return acc;
      const url = fileMap.get(decoded);
      if (url) acc.push(url);
      return acc;
    }, []);
  }
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title    = titleIdx >= 0 ? (row[titleIdx]  || '').trim() : '';
    const category = catIdx   >= 0 ? (row[catIdx]    || '').trim() : '';
    if (!title && !category) continue;
    catCounts[category] = (catCounts[category] || 0) + 1;
    const id = `${category}-${String(catCounts[category]).padStart(2, '0')}`;
    questions.push({
      id, category, title,
      description: descIdx >= 0 ? (row[descIdx] || '').trim() : '',
      note:        noteIdx >= 0 ? (row[noteIdx] || '').trim() : '',
      goodImages:  goodIdx >= 0 ? resolveImages(row[goodIdx]) : [],
      badImages:   badIdx  >= 0 ? resolveImages(row[badIdx])  : [],
      url:         urlIdx  >= 0 ? (row[urlIdx]  || '').trim() : '',
    });
  }
  return questions;
}
