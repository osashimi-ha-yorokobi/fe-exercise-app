const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const practice = require("../js/mock-practice-state.js");
global.window = {};
require("../js/mock-practice-pool.js");
const pool = window.FE_MOCK_PRACTICE_POOL;

test("ランダム順は同じ周回で重複せず、全問を含む", () => {
  const session = practice.create(60, () => 0.37);
  assert.equal(session.order.length, 60);
  assert.equal(new Set(session.order).size, 60);
  assert.deepEqual([...session.order].sort((a, b) => a - b), Array.from({ length: 60 }, (_, i) => i));
  assert.notDeepEqual(session.order, Array.from({ length: 60 }, (_, i) => i));
});

test("一問に一度だけ回答でき、解説後に次へ進み、最後に終了する", () => {
  const session = practice.create(2, () => 0.5);
  assert.equal(practice.next(session), false);
  assert.equal(practice.answer(session, 1, 1), true);
  assert.equal(session.correct, 1);
  assert.equal(session.phase, "explanation");
  assert.equal(practice.answer(session, 0, 1), false);
  assert.equal(practice.next(session), true);
  assert.equal(session.phase, "question");
  assert.equal(session.selected, null);
  assert.equal(practice.answer(session, 0, 1), true);
  assert.equal(session.correct, 1);
  assert.equal(practice.next(session), true);
  assert.equal(session.phase, "done");
  assert.equal(practice.next(session), false);
});

test("3セットの画面に時間制限なしの入口と解説欄がある", () => {
  for (const file of ["mock-exam.html", "mock-exam-02.html", "mock-exam-03.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    for (const value of [
      'data-practice-start="a"', 'data-practice-start="b"', 'id="practice"',
      'id="practice-feedback"', 'id="practice-next"',
      'src="js/mock-practice-state.js"', 'src="js/mock-practice.js"'
    ]) assert.ok(html.includes(value), `${file}: ${value}`);
  }
  const script = fs.readFileSync(path.join(__dirname, "../js/mock-practice.js"), "utf8");
  const ids = [...script.matchAll(/\$\("([^\"]+)"\)/g)].map(m => m[1]);
  const html = fs.readFileSync(path.join(__dirname, "../mock-exam.html"), "utf8");
  for (const id of new Set(ids)) assert.ok(html.includes(`id="${id}"`), id);
});

test("全3回の240問を横断し、科目・計算問題・チェック済みで絞り込める", () => {
  assert.equal(pool.length, 240);
  assert.equal(new Set(pool.map(q => q.meta.key)).size, 240);
  for (const setId of [1, 2, 3]) {
    assert.equal(pool.filter(q => q.meta.setId === setId && q.meta.subject === "A").length, 60);
    assert.equal(pool.filter(q => q.meta.setId === setId && q.meta.subject === "B").length, 20);
  }
  assert.equal(practice.select(pool, { subject:"all" }).length, 240);
  assert.equal(practice.select(pool, { subject:"a" }).length, 180);
  assert.equal(practice.select(pool, { subject:"b" }).length, 60);
  const noCalculation = practice.select(pool, { excludeCalculation:true });
  assert.ok(noCalculation.length < 240 && noCalculation.length > 0);
  assert.ok(noCalculation.every(q => !q.meta.calculation));
  const bookmarks = new Set(["1-a-1", "2-b-3", "3-a-60"]);
  assert.deepEqual(practice.select(pool, { bookmarkedOnly:true, bookmarks }).map(q => q.meta.key), [...bookmarks]);
  assert.deepEqual(practice.select(pool, { subject:"a", bookmarkedOnly:true, bookmarks }).map(q => q.meta.key), ["1-a-1", "3-a-60"]);
});

test("全問題の解説に出題分野と方法があり、計算問題には用途を示す", () => {
  for (const q of pool) {
    assert.ok(["テクノロジ系", "マネジメント系", "ストラテジ系"].includes(q.meta.major), q.meta.key);
    assert.ok(q.meta.field && q.meta.method, q.meta.key);
    if (q.meta.calculation) assert.ok(q.meta.purpose, q.meta.key);
  }
  for (const key of ["1-a-60", "2-a-49", "3-a-52", "3-a-59"])
    assert.equal(pool.find(q => q.meta.key === key).meta.diagram.type, "network");
  const fp = pool.find(q => q.meta.key === "2-a-50");
  assert.equal(fp.meta.diagram.type, "fp-table");
  assert.equal(fp.meta.diagram.rows.reduce((sum, row) => sum + row[1] * row[2], 0), 45);
  assert.equal(fp.c[fp.a], "45 FP");
});

test("ホームは4つの同形カードから模試選択画面へ進める", () => {
  const home = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const hub = fs.readFileSync(path.join(__dirname, "../mock-exams.html"), "utf8");
  assert.equal((home.match(/class="start-card(?: [^"]*)?"/g) || []).length, 4);
  assert.ok(home.includes('href="mock-exams.html"'));
  for (const link of ["mock-exam.html", "mock-exam-02.html", "mock-exam-03.html", "mock-exam.html#practice-entry"])
    assert.ok(hub.includes(`href="${link}"`), link);
});
