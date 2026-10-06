const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function setData(setId) {
  const context = vm.createContext({ window: {} });
  const files = setId === 1
    ? ["mock-exam-data", "mock-exam-a-enhancements", "mock-exam-set-1-recent", "mock-exam-b"]
    : ["mock-exam-set-common", `mock-exam-set-${setId}-a`, `mock-exam-set-${setId}-recent`, `mock-exam-set-${setId}-b`];
  files.push("mock-exam-enrichment");
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(__dirname, `../js/${file}.js`), "utf8"), context, { filename:file });
  return context.window.FE_MOCK_EXAM;
}

const pool = [];
for (let setId = 1; setId <= 3; setId++) {
  const data = setData(setId);
  for (const subject of ["a", "b"]) {
    data[subject].forEach(question => pool.push(question));
  }
}
if (pool.length !== 240 || new Set(pool.map(q => q.meta.key)).size !== 240) throw new Error("問題プールが不完全です");
const output = path.join(__dirname, "../js/mock-practice-pool.js");
fs.writeFileSync(output, `/* 3セット・全240問の一問練習用データ。build-mock-practice-pool.jsで生成。 */\nwindow.FE_MOCK_PRACTICE_POOL = ${JSON.stringify(pool)};\n`, "utf8");
process.stdout.write(`Wrote ${output} (${pool.length} questions)\n`);
