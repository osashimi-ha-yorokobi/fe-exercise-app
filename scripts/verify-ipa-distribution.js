const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const {spawn} = require('node:child_process');
const {readCSV} = require('./csv');
const files = require('./public-files');
const root = path.resolve(__dirname,'..');
async function run() {
 const rows=readCSV(path.join(root,'data/vocabulary.csv'));
 const evidence=readCSV(path.join(root,'reports/exam-vocabulary-evidence.csv'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/sources.json'),'utf8'));
 assert.deepEqual(evidence.map(t=>t.id).sort(),rows.map(t=>t.id).sort());
 assert.ok(evidence.every(t=>['シラバス表記一致','公開問題の表記一致','学習補足'].includes(t.basis)));
 assert.equal(manifest.documents.length,28);
 assert.ok(manifest.documents.every(d=>new URL(d.url).hostname==='www.ipa.go.jp'));
 // Every current row keeps exactly its authored explanation and browser ID.
 const summary=JSON.parse(fs.readFileSync(path.join(root,'reports/ipa-rebuild-summary.json'),'utf8'));
 const beforeFiles=fs.readdirSync(path.join(root,'backups')).filter(n=>n.startsWith('vocabulary-before-ipa-rebuild-'));
 const originals=readCSV(path.join(root,'backups',beforeFiles[0]));
 const originalById=new Map(originals.map(t=>[t.id,t]));
 const currentById=new Map(rows.map(row=>[row.id,row]));
 for(const original of originals)assert.equal(currentById.get(original.id)?.description,original.description);
 for(const row of rows)assert.ok(row.description.trim(),`${row.name}: explanation required`);
 assert.equal(rows.length,summary.total);
 const serverPort=await new Promise(resolve=>{const probe=net.createServer();probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
 const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,FE_LAN_PORT:String(serverPort)},windowsHide:true,stdio:['ignore','pipe','pipe']});
 let errors=''; server.stderr.on('data',chunk=>errors+=chunk);
 try {
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timed out: '+errors)),10000);server.stdout.once('data',()=>{clearTimeout(timeout);resolve();});server.once('error',reject);});
  const base=`http://127.0.0.1:${serverPort}`;
  for(const file of files)assert.equal((await fetch(`${base}/${file}`)).status,200,file);
  const backup=fs.readdirSync(path.join(root,'backups')).find(name=>name.endsWith('.csv'));
  const blocked=[`backups/${backup}`,'tmp/fe-site-terms.html','scripts/restore-exam-vocabulary.py','scripts/csv.js','reports/all-description-review.csv','reports/exam-vocabulary-evidence.json','.git/config'];
  for(const file of blocked)assert.equal((await fetch(`${base}/${file}`)).status,404,file);
  const publishedFiles=[];
  function visit(folder,prefix=''){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const relative=prefix+item.name;item.isDirectory()?visit(path.join(folder,item.name),relative+'/'):publishedFiles.push(relative);}}
  visit(path.join(root,'public-site'));
  assert.deepEqual(publishedFiles.sort(),[...files].sort());
  for(const file of files)assert.deepEqual(fs.readFileSync(path.join(root,file)),fs.readFileSync(path.join(root,'public-site',file)));
  assert.ok(fs.existsSync(path.join(root,'start-lan-server.bat')));
  assert.ok(fs.existsSync(path.join(root,'update-vocabulary-data.bat')));
  console.log(`Verified ${rows.length} retained IDs and explanations, 28 official source links, ${files.length} public files, and private-file denial.`);
 } finally {server.kill();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
