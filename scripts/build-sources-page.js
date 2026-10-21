const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const sources = JSON.parse(fs.readFileSync(path.join(root,'data/sources.json'),'utf8'));
const summary = JSON.parse(fs.readFileSync(path.join(root,'reports/ipa-rebuild-summary.json'),'utf8'));
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups = ['シラバス','旧午前問題','公開科目A問題','修了試験問題'];
const supplementNames = summary.supplements.map(term=>`「${escape(term.name)}」`).join('、');
const lists = groups.map(group=>`<details ${group==='シラバス'?'open':''}><summary>${group}（${sources.documents.filter(s=>s.type===group).length}冊）</summary><ul>${sources.documents.filter(s=>s.type===group).map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)} <span>PDF ↗</span></a></li>`).join('')}</ul></details>`).join('\n');
const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>参照資料・収録方針 | FE ことばノート</title>
<style>
:root{font-family:system-ui,"Hiragino Sans",Meiryo,sans-serif;color:#17362e;background:#f3f7f3}*{box-sizing:border-box}body{margin:0}main{max-width:640px;margin:auto;padding:20px 16px 48px}h1{font-size:24px;line-height:1.4;margin:20px 0}h2{font-size:19px;margin:0 0 12px}p,li{font-size:16px;line-height:1.8}a{color:#086858;text-underline-offset:3px;overflow-wrap:anywhere}.back{display:inline-flex;align-items:center;min-height:44px;font-weight:700}.panel{background:#fff;border:1px solid #d4e4da;border-radius:16px;padding:18px;margin:16px 0}.panel p:last-child{margin-bottom:0}ul{padding-left:22px}li{margin:12px 0}.note{font-size:14px;color:#405f51}details{background:white;border:1px solid #d4e4da;border-radius:12px;margin:12px 0;overflow:hidden}summary{padding:16px;font-size:16px;font-weight:700;cursor:pointer;min-height:52px}details ul{margin:0;padding:0 18px 12px;list-style:none}details li{margin:0}details a{display:block;padding:12px 0;border-top:1px solid #edf2ed;min-height:44px}details span{font-size:13px;white-space:nowrap}.download{display:block;padding:12px;border:1px solid #bfd8ca;border-radius:10px;margin-top:12px;font-weight:700;text-align:center}
</style></head><body><main>
<a class="back" href="./index.html">‹ 単語帳に戻る</a><h1>参照資料・収録方針</h1>
<section class="panel"><h2>この単語帳について</h2><p>出典：独立行政法人情報処理推進機構（IPA）の基本情報技術者試験シラバスVer.9.2、および下記の公開問題。</p><p>収録対象はVer.9.0以降に追加された用語448語です。説明・例・比較は、この単語帳で独自に作成しています。分類はIPAの中分類・小分類を基準にし、処理の流れには学習用のグループを追加しています。</p><p class="note">IPAが制作・監修したアプリではありません。</p></section>
<section class="panel"><h2>収録語の根拠</h2><p>Ver.9.0以降の追加語を中心に、公開問題の表記一致と関連するシラバス項目の学習補足を含めています。補足語の${supplementNames}は関連するシラバス項目を根拠に収録しています。</p><p class="note">2026年10月15日の再照合：対象${summary.total.toLocaleString('ja-JP')}件中、シラバス表記一致${summary.syllabus_occurrences.toLocaleString('ja-JP')}件、公開問題のみで表記一致${summary.exam_only_occurrences}件、学習補足${summary.supplements.length}件。表記の一致は、その語自体を問う問題の出題を意味するとは限りません。</p><a class="download" href="./reports/exam-vocabulary-evidence.csv" download>用語ごとの収録根拠をCSVで見る</a></section>
<section><h2>確認したIPA資料</h2><p>問題の照合期間は2012〜2026年度です。旧午前16冊、公開科目A4冊、修了試験7冊を確認しました。CBTの未公開問題は確認できません。画像PDFのOCRには読み取り漏れがあるため、表記が見つからないだけで未出題とは判断しません。</p><p class="note">根拠CSVのページ番号はPDFの先頭から数えたページです。CSVを自分で編集した後の用語は、再照合するまでこの一覧に反映されない場合があります。</p>${lists}</section>
<section class="panel"><h2>資料の利用条件</h2><p><a href="https://www.ipa.go.jp/siteinfo.html" target="_blank" rel="noopener">IPA ウェブサイトのご利用について ↗</a><br><a href="https://www.ipa.go.jp/shiken/faq.html" target="_blank" rel="noopener">IPA 試験に関するよくある質問 ↗</a></p></section>
<a class="back" href="./database.html">単語データを見る →</a>
</main></body></html>\n`;
fs.writeFileSync(path.join(root,'sources.html'),html,'utf8');
console.log(`Built source credits for ${sources.documents.length} official documents.`);


