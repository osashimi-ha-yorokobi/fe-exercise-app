const fs = require('node:fs');

function parseCSV(source) {
  const text = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value); value = '';
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
    } else value += char;
  }
  if (quoted) throw new Error('CSVの引用符が閉じていません');
  if (value !== '' || row.length) { row.push(value); rows.push(row); }
  if (!rows.length) throw new Error('空のCSVです');
  const header = rows.shift();
  return rows.map((cells, index) => {
    if (cells.length !== header.length) throw new Error(`CSVの${index + 2}行目の列数が違います`);
    return Object.fromEntries(header.map((key, column) => [key, cells[column]]));
  });
}

function stringifyCSV(rows, fields) {
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return '\uFEFF' + fields.join(',') + '\r\n' + rows.map(row => fields.map(field => cell(row[field])).join(',')).join('\r\n') + '\r\n';
}

function readCSV(file) { return parseCSV(fs.readFileSync(file, 'utf8')); }
module.exports = { parseCSV, stringifyCSV, readCSV };
