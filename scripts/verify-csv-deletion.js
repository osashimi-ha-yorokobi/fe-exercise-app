const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { readCSV, stringifyCSV } = require('./csv');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'data', 'vocabulary.csv');
const backupPath = path.join(root, 'tmp', 'verify-deletion-backup.csv');
const profilePath = path.join(root, `.chrome-delete-verify-${process.pid}`);
const fields = ['id', 'category_id', 'category', 'section', 'name', 'reading', 'english', 'description', 'added_in_version'];
const rows = readCSV(csvPath);
if (rows.length < 2) throw new Error('行削除テストには2件以上の用語が必要です');
const original = fs.readFileSync(csvPath);
const port = 4191;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await fsp.mkdir(path.dirname(backupPath), { recursive: true });
  await fsp.writeFile(backupPath, original);
  await fsp.mkdir(profilePath, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env: { ...process.env, FE_LAN_PORT: String(port) }, windowsHide: true, stdio: 'ignore' });
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profilePath}`, 'about:blank'
  ], { windowsHide: true, stdio: 'ignore' });
  try {
    let debugPort;
    for (let i = 0; i < 100; i++) {
      try { debugPort = Number((await fsp.readFile(path.join(profilePath, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
      catch { await sleep(100); }
    }
    if (!debugPort) throw new Error('ブラウザを起動できませんでした');
    const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let nextId = 1;
    const pending = new Map();
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (!pending.has(message.id)) return;
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100); }
      throw new Error(`画面の更新を確認できませんでした: ${expression}`);
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/database.html` });
    await waitFor(`document.querySelector('#status')?.textContent.includes('全${rows.length}件')`);
    const before = await evaluate("({ first:document.querySelector('.row h2').textContent, count:document.querySelector('#status').textContent })");
    if (before.first !== rows[0].name) throw new Error('削除前の用語が表示されていません');

    fs.writeFileSync(csvPath, stringifyCSV(rows.slice(1), fields));
    const now = new Date(Date.now() + 2000);
    fs.utimesSync(csvPath, now, now);
    const response = await fetch(`http://127.0.0.1:${port}/data/terms.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`CSV更新後の読み込みに失敗しました: ${response.status}`);
    const updated = await response.json();
    const current = updated.categories.flatMap(category => category.sections.flatMap(section => section.terms));
    if (current.length !== rows.length - 1 || current.some(term => term.id === rows[0].id)) throw new Error('生成データに削除した用語が残っています');

    await send('Page.reload', { ignoreCache: true });
    await waitFor(`document.querySelector('#status')?.textContent.includes('全${rows.length - 1}件')`);
    const database = await evaluate("({ first:document.querySelector('.row h2').textContent, count:document.querySelector('#status').textContent })");
    if (database.first === rows[0].name) throw new Error('検索画面に削除した用語が残っています');

    await send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length > 0");
    const genreCount = await evaluate("document.querySelector('.genre-count').textContent");
    await evaluate("document.querySelector('[data-action=toggle-category]').click();document.querySelector('[data-action=start-study]').click()");
    await waitFor("document.querySelector('.card-term') !== null");
    const firstCard = await evaluate("document.querySelector('.card-term').textContent");
    const expectedCount = rows.filter(row => row.category_id === rows[0].category_id).length - 1;
    if (firstCard === rows[0].name || !genreCount.startsWith(`${expectedCount}語`)) throw new Error(`単語帳に削除した用語が残っています: genreCount=${genreCount}, firstCard=${firstCard}`);
    console.log(JSON.stringify({ before, afterDeletion: database, genreCount, firstCard, removed: rows[0].name }));
    socket.close();
  } finally {
    fs.writeFileSync(csvPath, original);
    execFileSync(process.execPath, [path.join(root, 'scripts', 'build-static-data.js')], { cwd: root, windowsHide: true });
    server.kill();
    chrome.kill();
    await fsp.rm(backupPath, { force: true });
    if (profilePath.startsWith(root + path.sep)) {
      for (let attempt = 0; attempt < 8; attempt++) {
        try { await fsp.rm(profilePath, { recursive: true, force: true }); break; }
        catch (error) { if (attempt === 7) console.warn(`ブラウザ作業フォルダを削除できませんでした: ${error.message}`); else await sleep(300); }
      }
    }
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
