const fs = require('node:fs');
const path = require('node:path');
const { readCSV } = require('./csv');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'data', 'vocabulary.csv');
const rows = readCSV(csvPath);
const fields = ['id', 'category_id', 'category', 'section', 'name', 'reading', 'english', 'description', 'added_in_version'];
const header = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0].split(',');
if (header.join(',') !== fields.join(',')) throw new Error(`CSVの列は ${fields.join(',')} にしてください`);

const categories = new Map();
const descriptions = {};
const seenIds = new Set();
for (const [index, row] of rows.entries()) {
  const categoryId = Number(row.category_id);
  if (!/^[a-z0-9-]+$/.test(row.id) || seenIds.has(row.id)) throw new Error(`CSVの${index + 2}行目のidが空か重複しています`);
  if (!Number.isInteger(categoryId) || categoryId < 1 || !row.category || !row.section || !row.name) throw new Error(`CSVの${index + 2}行目に必須項目がありません`);
  // Spreadsheet editors may save the numeric-looking 9.0 marker as 9.
  const addedInVersion = row.added_in_version === '9' ? '9.0' : row.added_in_version;
  if (!['', '9.0', '9.1', '9.2'].includes(addedInVersion)) throw new Error(`CSVの${index + 2}行目のadded_in_versionが不正です`);
  seenIds.add(row.id);
  if (!categories.has(categoryId)) categories.set(categoryId, { id: categoryId, name: row.category, sections: [], bySection: new Map() });
  const category = categories.get(categoryId);
  if (category.name !== row.category) throw new Error(`CSVの${index + 2}行目のジャンル名が一致しません`);
  if (!category.bySection.has(row.section)) {
    const section = { name: row.section, terms: [] };
    category.sections.push(section);
    category.bySection.set(row.section, section);
  }
  category.bySection.get(row.section).terms.push({ id: row.id, name: row.name, reading: row.reading || '', english: row.english || '', addedInVersion });
  if (row.description) descriptions[row.id] = row.description;
}
const data = {
  syllabus: '9.2',
  categories: [...categories.values()].sort((a, b) => a.id - b.id).map(({ id, name, sections }) => ({ id, name, sections }))
};
fs.writeFileSync(path.join(root, 'data', 'terms.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(root, 'data', 'terms.js'), `window.FE_TERMS_DATA = ${JSON.stringify(data)};\n`, 'utf8');
fs.writeFileSync(path.join(root, 'data', 'descriptions.js'), `window.FE_DESCRIPTIONS = ${JSON.stringify(descriptions)};\n`, 'utf8');
console.log(`CSV: ${data.categories.length} genres, ${rows.length} terms, ${Object.keys(descriptions).length} explanations`);
