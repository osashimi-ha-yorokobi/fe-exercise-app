const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(setId) {
  const context = vm.createContext({ window: {} });
  const files = setId === 1
    ? ["mock-exam-data", "mock-exam-a-enhancements", "mock-exam-set-1-recent", "mock-exam-b"]
    : ["mock-exam-set-common", `mock-exam-set-${setId}-a`, `mock-exam-set-${setId}-recent`, `mock-exam-set-${setId}-b`];
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(__dirname, `../js/${file}.js`), "utf8"), context);
  return context.window.FE_MOCK_EXAM;
}

const rows = [];
for (let setId = 1; setId <= 3; setId++) {
  const data = load(setId);
  for (const subject of ["a", "b"]) {
    data[subject].forEach((q, i) => rows.push({ setId, subject: subject.toUpperCase(), number: i + 1, answer: q.c[q.a], question: q.q }));
  }
}

function normalize(value) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s・_\-/／（）()「」,，.。]/g, "");
}
function isTermAnswer(answer) {
  return !/^[-－+0-9０-９.,．％%/ ]+$/.test(answer) && !/^(true|false|O\(.+\))$/i.test(answer);
}

const grouped = new Map();
for (const row of rows) {
  const key = normalize(row.answer);
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(row);
}
if (require.main === module) {
  let terms = 0;
  let values = 0;
  for (const matches of grouped.values()) {
    if (matches.length < 2) continue;
    if (isTermAnswer(matches[0].answer)) terms++;
    else values++;
    process.stdout.write(`\n${matches[0].answer} (${matches.length})\n`);
    for (const row of matches) process.stdout.write(`  第${row.setId}回 科目${row.subject} 問${row.number}: ${row.question}\n`);
  }
  process.stdout.write(`\n全${rows.length}問、重複：用語 ${terms}件、数値・真偽値など ${values}件\n`);
}
module.exports = { rows, normalize, isTermAnswer };
