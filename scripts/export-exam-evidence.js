// Export current rows only, using the IPA-only editorial evidence.
const fs = require('node:fs');
const path = require('node:path');
const {readCSV,stringifyCSV} = require('./csv');
const root = path.resolve(__dirname,'..');
const rows = readCSV(path.join(root,'data/vocabulary.csv'));
const evidence = readCSV(path.join(root,'reports/ipa-vocabulary-evidence.csv'));
const byId = new Map(evidence.map(item=>[item.id,item]));
const fields = Object.keys(evidence[0]);
const report = rows.map(row=> {
  const previous = byId.get(row.id);
  return previous?.name === row.name ? {...previous,category:row.category,section:row.section,added_in_version:row.added_in_version}
    : {id:row.id,name:row.name,category:row.category,section:row.section,added_in_version:row.added_in_version,
       basis:'未照合',note:'追加・変更された語です。IPA資料で収録根拠を確認してください。',description_reviewed:'no'};
});
fs.writeFileSync(path.join(root,'reports/exam-vocabulary-evidence.csv'),stringifyCSV(report,fields),'utf8');
console.log(`Exported IPA evidence for ${report.length} current CSV rows.`);
