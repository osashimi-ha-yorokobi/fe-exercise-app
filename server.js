const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const publicFiles = new Set(require('./scripts/public-files'));

const root = __dirname;
const port = Number(process.env.FE_LAN_PORT || 4173);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.csv': 'text/csv' };
const csvPath = path.join(root, 'data', 'vocabulary.csv');
let builtMtime = 0;
function refreshData() {
  const mtime = fs.statSync(csvPath).mtimeMs;
  if (mtime <= builtMtime) return;
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-static-data.js')], { cwd: root, windowsHide: true, stdio: 'pipe' });
  builtMtime = mtime;
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !publicFiles.has(pathname.slice(1))) {
    res.writeHead(404); res.end(); return;
  }
  if (pathname === '/data/terms.js' || pathname === '/data/descriptions.js' || pathname === '/data/terms.json') {
    try { refreshData(); }
    catch (error) { console.error('CSVの読み込みに失敗しました:', error.message); res.writeHead(500); res.end('CSVの読み込みに失敗しました'); return; }
  }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {
      'Content-Type': `${mime[path.extname(file)]}; charset=utf-8`,
      'Content-Length': body.length,
      'Cache-Control': path.extname(file) === '.json' ? 'public, max-age=3600' : 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`FE ことばノート: http://localhost:${port}/`);
  for (const items of Object.values(os.networkInterfaces())) {
    for (const item of items || []) {
      if (item.family === 'IPv4' && !item.internal) console.log(`スマホから: http://${item.address}:${port}/`);
    }
  }
});
