// Run before uploading a static site. No deletion and no network publishing.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const files = require('./public-files');
const root = path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(__dirname,'build-static-data.js')],{cwd:root,windowsHide:true,stdio:'inherit'});
execFileSync(process.execPath,[path.join(__dirname,'export-exam-evidence.js')],{cwd:root,windowsHide:true,stdio:'inherit'});
const output = path.join(root,'public-site');
// Refuse unexpected leftovers instead of silently including private material.
function inspect(directory, prefix='') {
  if (!fs.existsSync(directory)) return;
  for (const item of fs.readdirSync(directory,{withFileTypes:true})) {
    const relative = prefix+item.name;
    if(item.isSymbolicLink()) throw new Error(`公開用フォルダにリンクがあります: ${relative}`);
    if(item.isDirectory()) inspect(path.join(directory,item.name),relative+'/');
    else if(!files.includes(relative)) throw new Error(`公開対象外のファイルがあります: ${relative}`);
  }
}
inspect(output);
for (const file of files) {
 const destination = path.join(output,file);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.copyFileSync(path.join(root,file),destination);
}
console.log(`公開用の${files.length}ファイルを public-site に用意しました。`);
