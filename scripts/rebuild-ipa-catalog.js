// Explicit editorial operation: reassess the CURRENT CSV against IPA sources.
// The normal CSV build remains separate and never restores deleted rows.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { readCSV, stringifyCSV } = require('./csv');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'data/vocabulary.csv');
const rows = readCSV(file);
const audit = JSON.parse(fs.readFileSync(path.join(root, 'tmp/ipa-official/audit.json'), 'utf8'));
const evidenceById = new Map(audit.terms.map(t => [t.id, t]));
if (rows.length !== audit.terms.length || rows.some(r => evidenceById.get(r.id)?.name !== r.name)) {
  throw new Error('CSVを変更した後はIPA照合をやり直してください。削除した行は復元しません。');
}
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const before = fs.readFileSync(file);
fs.mkdirSync(path.join(root, 'backups'), { recursive:true });
const backup = path.join(root, 'backups', `vocabulary-before-ipa-rebuild-${sha(before).slice(0,12)}.csv`);
if (!fs.existsSync(backup)) fs.writeFileSync(backup, before);

// Study subgroups authored for this app, nested under the official syllabus.
const subgroups = {
  'コンパイラ理論': [1, '情報に関する理論'],
  'A/D変換': [1, '情報に関する理論'],
  '自然言語処理': [2, 'アルゴリズム'],
  'プロセスの状態遷移': [5, 'オペレーティングシステム'],
  'OSI参照モデル': [10, 'データ通信と制御'],
  'スクラムの進め方': [13, '開発プロセス・手法']
};
// Keep meaning-based assignments: e.g. a buffer is not a buffer-overflow attack,
// and OC曲線 is not the substring of ROC曲線. Mere text search cannot classify.
const overrides = {
  'DMA': [3, '入出力デバイス'],
  '加法混色': [8, 'マルチメディア技術'],
  '減法混色': [8, 'マルチメディア技術'],
  'IPv6': [10, 'ネットワーク方式'],
  '分散オブジェクト技術': [10, '通信プロトコル'],
  'ファジング': [11, 'セキュリティ実装技術'],
  '状態遷移図': [12, '設計'],
  'データストア': [12, 'システム要件定義・ソフトウェア要件定義'],
  'ハルシネーション': [21, 'ビジネスシステム'],
  'AI開発ガイドライン': [21, 'ビジネスシステム']
};
const supplements = {
  'スニッフィング': {pages:[44], note:'利用者指定の追加語。シラバスの「盗聴」を具体的なパケット傍受・解析で理解するための補足。語そのものの出題実績は未確認。'},
  '指数部': {pages:[8], note:'浮動小数点数の指数の理解と計算を補う。シラバスの表記は「指数」。'},
  'HTTP/3': {pages:[40], note:'HTTPの世代・通信方式の比較を補う。HTTP/3自体のシラバス明記・出題は未確認。'},
  'CTR': {pages:[45], note:'暗号利用モードの比較を補う。CTR自体のシラバス明記・出題は未確認。'}
};
const sectionsByKey = new Map(audit.sections.map(s => [`${s.category_id}:${s.section.replace(/\s/g,'')}`, s]));
const review = [];
const ordering = new Map();
for (const row of rows) {
  const oldCategory = row.category, oldSection = row.section;
  const assignment = overrides[row.name] || [Number(row.category_id), row.section];
  const subgroup = subgroups[assignment[1]];
  const parent = subgroup || assignment;
  const official = sectionsByKey.get(`${parent[0]}:${parent[1].replace(/\s/g,'')}`);
  if (!official) throw new Error(`公式分類が未確認: ${row.name} ${parent}`);
  row.category_id = String(official.category_id);
  row.category = official.category;
  row.section = subgroup ? assignment[1] : official.section.replace(/\s/g,'');
  ordering.set(row.id, {sectionOrder:official.order, subgroup:subgroup ? row.section : ''});
  const term = evidenceById.get(row.id);
  const supplement = supplements[row.name];
  if (!term.syllabus.length && !term.exams.length && !supplement) throw new Error(`収録根拠の未確認語: ${row.name}`);
  const basis = term.syllabus.length ? 'シラバス表記一致' : term.exams.length ? '公開問題の表記一致' : '学習補足';
  review.push({id:row.id,name:row.name,category:row.category,section:row.section,
    official_section:official.section.replace(/\s/g,''),basis,
    syllabus_pages:[...new Set(term.syllabus.flatMap(h=>h.pages))].sort((a,b)=>a-b).join(' / '),
    related_topic_pages:supplement?.pages.join(' / ') || Object.keys(official.pages).join(' / '),
    matched_papers:new Set(term.exams.map(h=>h.document)).size,
    documents:[...new Set(term.exams.map(h=>h.document))].join(' / '),
    pages:term.exams.map(h=>`${h.document}:p${h.page}${h.match==='OCR variant'?' (OCR表記補正)':''}`).join(' / '),
    note:supplement?.note || '表記の一致は、この語自体を問う出題や網羅的な出題実績を保証しない。',
    added_in_version:row.added_in_version,description_reviewed:'yes',
    previous_category:oldCategory,previous_section:oldSection});
}
const collator = new Intl.Collator('ja', {numeric:true});
rows.sort((a,b) => Number(a.category_id)-Number(b.category_id) ||
  ordering.get(a.id).sectionOrder-ordering.get(b.id).sectionOrder ||
  collator.compare(ordering.get(a.id).subgroup,ordering.get(b.id).subgroup) ||
  collator.compare(a.reading || a.name,b.reading || b.name) || collator.compare(a.name,b.name) || a.id.localeCompare(b.id));
fs.writeFileSync(file, stringifyCSV(rows,Object.keys(rows[0])), 'utf8');
const orderedReview = rows.map(r => review.find(t=>t.id===r.id));
fs.writeFileSync(path.join(root,'reports/ipa-vocabulary-evidence.csv'), stringifyCSV(orderedReview,Object.keys(orderedReview[0])),'utf8');
// Compatibility filename used by local editing documentation.
fs.writeFileSync(path.join(root,'reports/exam-vocabulary-evidence.csv'), stringifyCSV(orderedReview,Object.keys(orderedReview[0])),'utf8');
const summary = {date:'2026-10-15',syllabus:'9.2',total:rows.length,
  syllabus_occurrences:review.filter(t=>t.basis==='シラバス表記一致').length,
  exam_only_occurrences:review.filter(t=>t.basis==='公開問題の表記一致').length,
  supplements:review.filter(t=>t.basis==='学習補足').map(t=>({name:t.name,note:t.note})),
  exam_papers:27,added_since_9_0:rows.filter(r=>r.added_in_version).length,
  classification_changes:review.filter(r=>r.category!==r.previous_category||r.section!==r.previous_section).length,
  ordering:'IPA中分類・小分類の順、学習用グループ、読みの五十音順',csv_sha256:sha(fs.readFileSync(file))};
fs.writeFileSync(path.join(root,'reports/ipa-rebuild-summary.json'),JSON.stringify(summary,null,2)+'\n');
const descriptionSummaryFile = path.join(root,'reports/all-description-review-summary.json');
if (fs.existsSync(descriptionSummaryFile)) {
  const descriptionSummary = JSON.parse(fs.readFileSync(descriptionSummaryFile,'utf8'));
  descriptionSummary.resultHash = summary.csv_sha256;
  fs.writeFileSync(descriptionSummaryFile,JSON.stringify(descriptionSummary,null,2)+'\n');
}
console.log(JSON.stringify(summary,null,2));
