const fs = require("node:fs");
const path = require("node:path");

const setId = Number(process.argv[2] || 1);
if (![1, 2, 3].includes(setId)) throw new Error("回数は1～3で指定してください。");
global.window = {};
if (setId === 1) {
  require("../js/mock-exam-data.js");
  require("../js/mock-exam-a-enhancements.js");
  require("../js/mock-exam-set-1-recent.js");
  require("../js/mock-exam-b.js");
} else {
  require("../js/mock-exam-set-common.js");
  require(`../js/mock-exam-set-${setId}-a.js`);
  require(`../js/mock-exam-set-${setId}-recent.js`);
  require(`../js/mock-exam-set-${setId}-b.js`);
}
require("../js/mock-exam-enrichment.js");

const data = window.FE_MOCK_EXAM;
const labels = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ"];
const fullwidth = n => String(n).replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 65248));
const lines = [
  "# 基本情報技術者試験 オリジナル模擬試験 第" + setId + "回",
  "",
  "全問新作。科目A 60問（90分）、科目B 20問（100分）。科目Bはアルゴリズム・プログラミング16問、情報セキュリティ4問。",
  "",
  "## 問題編"
];

for (const [name, questions] of [["A", data.a], ["B", data.b]]) {
  lines.push("", "### 科目" + name);
  questions.forEach((question, i) => {
    if (!question.material) lines.push("", "**問" + fullwidth(i + 1) + "** " + question.q);
    else lines.push("", "**問" + fullwidth(i + 1) + "**");
    if (question.intro) lines.push("", question.intro);
    if (question.material) lines.push("", "〔資料〕", "", "~~~text", question.material, "~~~");
    if (question.material) lines.push("", question.q);
    if (question.code) lines.push("", "〔プログラム〕", "", "~~~text", question.code, "~~~");
    if (question.meta.diagram?.type === "network") {
      lines.push("", "〔図：" + question.meta.diagram.title + "〕", "", "~~~mermaid", "flowchart LR");
      for (const [id] of question.meta.diagram.nodes) lines.push(`  ${id}["${id === "s" ? "開始" : id === "e" ? "終了" : id}"]`);
      for (const [from, to, name, days, dummy] of question.meta.diagram.edges)
        lines.push(dummy ? `  ${from} -.-> ${to}` : `  ${from} -->|${name} ${days}日| ${to}`);
      lines.push("~~~");
    }
    if (question.meta.diagram?.type === "fp-table") {
      lines.push("", "〔表：" + question.meta.diagram.title + "〕", "", "| 機能分類 | 件数 | 重み（FP/件） |", "|---|---:|---:|");
      question.meta.diagram.rows.forEach(row => lines.push(`| ${row[0]} | ${row[1]} | ${row[2]} |`));
    }
    lines.push("", "解答群", "");
    question.c.forEach((choice, j) => lines.push("- " + labels[j] + "　" + choice));
  });
}

lines.push("", "## 解答・解説");
for (const [name, questions] of [["A", data.a], ["B", data.b]]) {
  lines.push("", "### 科目" + name);
  questions.forEach((question, i) => {
    if (question.reasons) {
      lines.push("", "**問" + fullwidth(i + 1) + "　正解：" + labels[question.a] + "**");
      lines.push(`出題分野：${question.meta.major} ＞ ${question.meta.field}`, `図法・方法・用語：${question.meta.method}`);
      if (question.meta.purpose) lines.push(`この計算で分かること：${question.meta.purpose}`);
      question.reasons.forEach((reason, j) => lines.push("- " + labels[j] + (j === question.a ? "（正解）" : "（誤り）") + "　" + reason));
    } else {
      lines.push("", "**問" + fullwidth(i + 1) + "　" + labels[question.a] + "**　" + question.e);
      lines.push(`出題分野：${question.meta.major} ＞ ${question.meta.field}`, `図法・方法・用語：${question.meta.method}`);
      if (question.meta.purpose) lines.push(`この計算で分かること：${question.meta.purpose}`);
    }
  });
}
lines.push(
  "", "---", "",
  "参照資料：IPA 基本情報技術者試験 シラバス Ver.9.2、令和8年度 科目B公開問題、情報セキュリティマネジメント試験 科目B出題内容。",
  "",
  "https://www.ipa.go.jp/shiken/syllabus/gaiyou.html",
  "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/2026r08.html",
  "https://www.ipa.go.jp/shiken/kubun/sg/outline.html",
  "",
  "本資料は非公式の学習用模試であり、過去問の転載ではありません。"
);

const output = path.join(__dirname, `../MOCK-EXAM-0${setId}.md`);
fs.writeFileSync(output, lines.join("\n") + "\n", "utf8");
process.stdout.write("Wrote " + output + "\n");
