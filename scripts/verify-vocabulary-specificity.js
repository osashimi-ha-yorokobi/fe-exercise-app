const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { readCSV } = require('./csv');

const root = path.resolve(__dirname, '..');
const rows = readCSV(path.join(root, 'data', 'vocabulary.csv'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'terms.json'), 'utf8'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data', 'descriptions.js'), 'utf8'), context);
const visible = data.categories.flatMap(category => category.sections.flatMap(section => section.terms));
const csvIds = rows.map(row => row.id).sort();
const visibleIds = visible.map(row => row.id).sort();
assert.deepEqual(visibleIds, csvIds, 'The app must show exactly the CSV terms');
const reviewSummary=JSON.parse(fs.readFileSync(path.join(root,'reports/all-description-review-summary.json'),'utf8'));
const reviewRows=readCSV(path.join(root,'reports/all-description-review.csv'));
assert.equal(rows.length, reviewSummary.total);
assert.equal(reviewSummary.unreviewed,0);
assert.equal(reviewSummary.reviewed,rows.length);
assert.deepEqual(reviewRows.map(row=>row.id).sort(),csvIds);
for(const reviewed of reviewRows){
  assert.notEqual(reviewed.before,reviewed.after,`${reviewed.name} must be revised`);
  assert.equal(rows.find(row=>row.id===reviewed.id).description,reviewed.after);
}
assert.equal(rows.filter(row => row.added_in_version).length, 448);
assert.equal(Object.keys(context.window.FE_DESCRIPTIONS).length, rows.length);
for (const row of rows) assert.equal(context.window.FE_DESCRIPTIONS[row.id], row.description);

const byName = new Map(rows.map(row => [row.name, row]));
for (const name of ['標本化', '量子化', '符号化', '有限オートマトン', '双方向リスト', '環状リスト']) {
  assert.ok(byName.has(name), `${name} must be in the CSV`);
}
assert.match(byName.get('線形リスト').description, /一列.*ポインタ/);
assert.match(byName.get('オートマトン').description, /状況.*状態.*制御/);
assert.match(byName.get('標本化').description, /一定間隔.*標本化周波数/);
assert.match(byName.get('量子化').description, /丸める.*量子化誤差/);
assert.match(byName.get('符号化').description, /ビット列/);
for (const name of ['OJT', '機能要件', '非機能要件', 'DRAM', 'SRAM', '内部割込み', '外部割込み', '稼働率']) {
  assert.equal(rows.filter(row => row.name === name).length, 1, `${name} must appear once`);
}
for (const name of ['教育', '費用']) assert.equal(rows.filter(row => row.name === name).length, 0);
assert.match(byName.get('DRAM').description, /安価.*リフレッシュ.*SRAM/);
assert.match(byName.get('内部割込み').description, /ゼロ除算.*ページフォールト/);
assert.match(byName.get('外部割込み').description, /入出力完了.*タイマー/);
assert.match(byName.get('稼働率').description, /MTBF.*MTTR/);
for (const name of ['スワッピング','ページング','スプーリング','スワップイン','スワップアウト','メモリインタリーブ','プッシュ','LFU','ブロッキング','インタプリタ','サブネットマスク','ブラックボックステスト','ファジング']) assert.ok(byName.has(name));
assert.match(byName.get('ポアソン分布').description,/要求数.*平均と分散/);
assert.match(byName.get('油圧シリンダ').description,/圧縮されにくく.*建設機械.*空気圧/);
assert.match(byName.get('空気圧シリンダ').description,/工場.*油圧/);
assert.match(byName.get('Wi-Fi4/5/6/6E').description,/600Mbps.*6\.9Gbps.*9\.6Gbps/);
assert.match(byName.get('BLE').description,/1Mbps.*2Mbps.*125\/500kbps/);
console.log(`Verified ${rows.length} CSV cards, ${visible.length} app cards, and the restored syllabus terms.`);
