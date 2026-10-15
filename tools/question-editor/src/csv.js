// CSV パース / シリアライズ
// check-tool 側 tools/check-tool/index.html:82-114 の parseCSV と同等ロジック
// （BOM 除去、RFC 4180 準拠、CRLF/LF 両対応）

(function (global) {
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

  // ヘッダーは小文字化、空タイトル+空カテゴリの行はスキップ
  // 画像パスは decodeURIComponent 経由でカンマ区切り分解
  function rowsToQuestions(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name) => headers.indexOf(name);
    const titleIdx = col('title');
    const catIdx = col('category');
    const descIdx = col('description');
    const noteIdx = col('note');
    const goodIdx = col('good_image');
    const badIdx = col('bad_image');
    const urlIdx = col('url');

    const splitImages = (raw) => {
      if (!raw || !raw.trim()) return [];
      return raw.split(',').reduce((acc, p) => {
        const decoded = decodeURIComponent(p.trim());
        if (decoded) acc.push(decoded);
        return acc;
      }, []);
    };

    const questions = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const title = titleIdx >= 0 ? (row[titleIdx] || '').trim() : '';
      const category = catIdx >= 0 ? (row[catIdx] || '').trim() : '';
      if (!title && !category) continue;
      questions.push({
        title,
        category,
        description: descIdx >= 0 ? (row[descIdx] || '').trim() : '',
        note: noteIdx >= 0 ? (row[noteIdx] || '').trim() : '',
        goodImagesRel: goodIdx >= 0 ? splitImages(row[goodIdx]) : [],
        badImagesRel: badIdx >= 0 ? splitImages(row[badIdx]) : [],
        url: urlIdx >= 0 ? (row[urlIdx] || '').trim() : '',
      });
    }
    return questions;
  }

  function needsQuote(s) {
    return /[",\r\n]/.test(s);
  }
  function escapeField(s) {
    if (s == null) return '';
    const str = String(s);
    if (!needsQuote(str)) return str;
    return '"' + str.replace(/"/g, '""') + '"';
  }

  // questions: [{ title, category, description, note, goodImagesRel:[paths], badImagesRel:[paths], url }]
  function serializeCSV(questions) {
    const headers = ['Title', 'Category', 'Description', 'Note', 'Good_Image', 'Bad_Image', 'URL'];
    const lines = [headers.join(',')];
    for (const q of questions) {
      const goodPaths = (q.goodImagesRel || []).join(',');
      const badPaths = (q.badImagesRel || []).join(',');
      lines.push([
        escapeField(q.title),
        escapeField(q.category),
        escapeField(q.description),
        escapeField(q.note),
        escapeField(goodPaths),
        escapeField(badPaths),
        escapeField(q.url),
      ].join(','));
    }
    return lines.join('\r\n');
  }

  const api = { parseCSV, rowsToQuestions, serializeCSV, escapeField };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.QECsv = api;
  }
})(typeof window !== 'undefined' ? window : this);
