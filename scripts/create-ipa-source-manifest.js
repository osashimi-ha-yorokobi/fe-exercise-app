// Use verified IPA URLs collected from their yearly problem pages.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const urls = fs.readFileSync(path.join(root,'tmp/ipa-official/exam-urls.txt'),'utf8').trim().split(/\r?\n/).map(line=>line.split('\t')[1]);
const extra = [
 ['ug65p90000001fci','20130623'], ['ug65p90000001bq0','20180610'],
 ['ug65p90000001bq0','20200126'], ['ug65p90000001bq0','20200726'],
 ['ug65p90000001bq0','20201213'], ['ug65p90000001bq0','20230122'],
 ['gmcbt800000077l9','20250608']
];
for (const [folder,date] of extra) urls.push(`https://www.ipa.go.jp/shiken/about/${folder}-att/tokurei_Mondai_${date}_FE.pdf`);
const documents = [{type:'シラバス',title:'基本情報技術者試験 シラバス Ver.9.2',file:'syllabus_fe_ver9_2.pdf',url:'https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf'}];
for (const url of [...new Set(urls)].sort()) {
 if (new URL(url).hostname !== 'www.ipa.go.jp') throw new Error('IPA以外の資料URL');
 const file = path.basename(new URL(url).pathname);
 const year = file.match(/\d{4}/)[0];
 let type,title;
 if (file.startsWith('tokurei_')) {
   const date = file.match(/\d{8}/)[0];
   type='修了試験問題';title=`${date.slice(0,4)}年${Number(date.slice(4,6))}月${Number(date.slice(6,8))}日 修了試験問題`;
 } else if (file.includes('kamoku_a')) {
   type='公開科目A問題';title=`${year}年度 基本情報技術者試験 公開科目A問題`;
 } else {
   type='旧午前問題';title=`${year}年度${/[hr]\d+h_/.test(file)?'春期':'秋期'} 基本情報技術者試験 午前問題`;
 }
 documents.push({type,title,file,url});
}
for (const document of documents) {
 const folder = document.type==='シラバス'?'ipa-official':'ipa-subject-a';
 document.sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'tmp',folder,document.file))).digest('hex');
}
if (documents.length!==28) throw new Error(`想定外の資料数: ${documents.length}`);
fs.writeFileSync(path.join(root,'data/sources.json'),JSON.stringify({checked:'2026-10-15',publisher:'独立行政法人情報処理推進機構（IPA）',documents},null,2)+'\n','utf8');
console.log(`Saved ${documents.length} verified IPA documents.`);
