const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { readCSV, stringifyCSV } = require('./csv');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'data', 'vocabulary.csv');
const original = fs.readFileSync(csvPath);
const rows = readCSV(csvPath);
const fields = ['id', 'category_id', 'category', 'section', 'name', 'reading', 'english', 'description', 'added_in_version'];
const marker = 'CSV反映確認用の一時的な説明文';
const port = 4189;
const server = spawn(process.execPath, [path.join(root, 'server.js')], {
  cwd: root, env: { ...process.env, FE_LAN_PORT: String(port) }, windowsHide: true, stdio: 'ignore'
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getDescription() {
  const response = await fetch(`http://127.0.0.1:${port}/data/descriptions.js`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function run() {
  try {
    for (let i = 0; i < 50; i++) {
      try { await getDescription(); break; }
      catch { await sleep(100); }
    }
    rows[0].description = marker;
    fs.writeFileSync(csvPath, stringifyCSV(rows, fields));
    const changed = await getDescription();
    if (!changed.includes(marker)) throw new Error('CSVの変更がHTML用データに反映されませんでした');
    console.log('CSVの変更がカード・検索画面用データに反映されました');
  } finally {
    fs.writeFileSync(csvPath, original);
    execFileSync(process.execPath, [path.join(root, 'scripts', 'build-static-data.js')], { cwd: root, windowsHide: true });
    server.kill();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
