const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = {};
require("../js/mock-exam-data.js");
require("../js/mock-exam-a-enhancements.js");
require("../js/mock-exam-set-1-recent.js");
require("../js/mock-exam-b.js");
const data = window.FE_MOCK_EXAM;

test("科目Aと科目Bの問題数、選択肢、解答が整合する", () => {
  assert.equal(data.a.length, 60);
  assert.equal(data.b.length, 20);
  for (const question of [...data.a, ...data.b]) {
    assert.ok(question.q);
    assert.ok(question.e);
    assert.ok(question.c.length >= 4 && question.c.length <= 7);
    assert.equal(new Set(question.c).size, question.c.length);
    assert.ok(Number.isInteger(question.a) && question.a >= 0 && question.a < question.c.length);
  }
});

test("科目Bの16問は具体的なプログラム、4問は状況資料を伴う", () => {
  assert.equal(data.b.slice(0, 16).filter(q => q.intro && q.code && q.topic).length, 16);
  assert.equal(data.b.slice(16).filter(q => q.intro && q.material && q.topic).length, 4);
  assert.equal(new Set(data.b.slice(0, 16).map(q => q.topic)).size, 16);
  assert.ok(data.b.some(q => q.topic === "クイックソート"));
});

test("科目Aの計算問題は具体的な数値を計算して解く", () => {
  const answers = new Map([["排他的論理和", "DB"], ["パスワードに", "625"], ["2の補数", "－42"], ["全社員のうち", "52"], ["二つの装置", "0.9504"], ["A組12人", "74"], ["横1,024画素", "2.25"], ["クロック周波数2GHz", "0.019"], ["プロジェクトの作業", "37"], ["システム導入に", "20％"], ["月間固定費", "150"], ["200台のセンサ", "99.75％"]]);
  for (const [prompt, expected] of answers) {
    const question = data.a.find(q => q.q.includes(prompt));
    assert.ok(question, prompt);
    assert.ok(question.c[question.a].includes(expected), prompt);
    assert.ok(question.e.includes(expected), `${prompt}の解説`);
  }
  assert.match(data.a.at(-1).material, /先行作業/);
});

test("科目Aは後半を発展問題にし、両科目の全選択肢に解説を持つ", () => {
  assert.equal(data.a.slice(0, 30).filter(q => q.difficulty === "基礎").length, 30);
  assert.equal(data.a.slice(30, 45).filter(q => q.difficulty === "応用").length, 15);
  assert.equal(data.a.slice(45).filter(q => q.difficulty === "発展").length, 15);
  for (const q of [...data.a, ...data.b]) {
    assert.equal(q.reasons.length, q.c.length);
    assert.equal(q.reasons[q.a], q.e);
    assert.equal(new Set(q.reasons).size, q.c.length);
  }
});

test("閲覧用資料に両科目の問題と選択肢別解説が含まれる", () => {
  const text = fs.readFileSync(path.join(__dirname, "../MOCK-EXAM-01.md"), "utf8");
  assert.ok(text.includes(data.a[0].q));
  assert.ok(text.includes(data.a.at(-1).material));
  assert.ok(text.includes(data.a.at(-1).reasons[0]));
  assert.ok(text.includes(data.b[0].reasons[1]));
  assert.ok(text.includes(data.b[0].intro));
  assert.ok(text.includes(data.b[16].material));
  assert.ok(text.includes(data.b[19].e));
});
