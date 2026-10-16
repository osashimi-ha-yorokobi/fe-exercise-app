const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {readCSV}=require('./csv');
const root=path.resolve(__dirname,'..');
const rows=readCSV(path.join(root,'data/vocabulary.csv'));
const decisions=readCSV(path.join(root,'reports/selection-1000.csv'));
const summary=JSON.parse(fs.readFileSync(path.join(root,'reports/selection-1000-summary.json'),'utf8'));
assert.ok(summary.backup,'The original CSV must be recoverable');
const before=readCSV(path.join(root,summary.backup));
const current=new Map(rows.map(row=>[row.id,row]));
assert.equal(rows.length,1000);
assert.equal(before.length,1397);
assert.equal(decisions.filter(row=>row.decision==='remove').length,397);
assert.equal(summary.removed,397);
assert.deepEqual(rows.map(row=>row.id).sort(),decisions.filter(row=>row.decision==='keep').map(row=>row.id).sort());
for(const row of before){
 const immutable=row.added_in_version||['ネットワーク','セキュリティ','データベース'].includes(row.category)||
  (row.category_id==='1'&&row.section==='通信に関する理論')||/プロトコル|通信規約|通信規格|インタフェース規格|無線.*規格/.test(row.name+' '+row.description);
 if(immutable)assert.deepEqual(current.get(row.id),row,`${row.name}: protected term changed`);
 if(current.has(row.id))assert.deepEqual(current.get(row.id),row,`${row.name}: retained term must keep its ID, meaning and genre`);
}
assert.equal(rows.filter(row=>row.added_in_version).length,448);
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/terms.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(root,'data/descriptions.js'),'utf8'),context);
const visible=context.window.FE_TERMS_DATA.categories.flatMap(category=>category.sections.flatMap(section=>section.terms));
assert.deepEqual(Array.from(visible,term=>term.id).sort(),rows.map(row=>row.id).sort());
for(const row of rows)assert.equal(context.window.FE_DESCRIPTIONS[row.id],row.description);
for(const row of decisions.filter(row=>row.decision==='remove')){
 assert.ok(!visible.some(term=>term.id===row.id),`${row.name}: deleted term still shown`);
 assert.ok(row.reason,'Every removal needs an editorial reason');
}
console.log('Verified exactly 1,000 cards, 397 deletions, 448 syllabus additions, unchanged protected fields/protocols, and an intact backup.');
