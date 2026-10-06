const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../js/mock-exam-state.js");

test("科目AとBを独立して開始し、それぞれの問題数と時間を使う", () => {
  const a = engine.create("a", 1000);
  const b = engine.create("b", 1000);
  assert.equal(a.answers.length, 60);
  assert.equal(b.answers.length, 20);
  assert.equal(a.deadline - a.startedAt, 90 * 60 * 1000);
  assert.equal(b.deadline - b.startedAt, 100 * 60 * 1000);
  a.answers[0] = 2;
  assert.equal(b.answers[0], null);
  assert.equal(engine.valid(a), true);
  assert.equal(engine.valid(b), true);
});

test("解答と見直し状態を保持したまま提出できる", () => {
  const s = engine.create("a", 0);
  s.answers[2] = 1;
  s.flags[2] = true;
  s.current = 2;
  assert.deepEqual(engine.summary(s), { total: 60, answered: 1, unanswered: 59, flagged: 1 });
  assert.equal(engine.submit(s, 2000), true);
  assert.equal(s.phase, "done");
  assert.equal(s.endReason, "manual");
  assert.equal(engine.submit(s, 3000), false);
  assert.equal(engine.valid(JSON.parse(JSON.stringify(s))), true);
});

test("期限を過ぎたら元の締切時刻で自動終了し、次の科目へ進まない", () => {
  const s = engine.create("b", 500);
  assert.equal(engine.advance(s, s.deadline - 1), false);
  assert.equal(engine.advance(s, s.deadline + 10000), true);
  assert.equal(s.phase, "done");
  assert.equal(s.endedAt, s.deadline);
  assert.equal(s.endReason, "time");
  assert.equal(engine.advance(s, s.deadline + 20000), false);
});

test("壊れた保存状態を再開しない", () => {
  const s = engine.create("a", 0);
  s.answers.pop();
  assert.equal(engine.valid(s), false);
});

test("画面スクリプトが参照する要素がHTMLに存在する", () => {
  const html = fs.readFileSync(path.join(__dirname, "../mock-exam.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "../js/mock-exam.js"), "utf8");
  const ids = [...script.matchAll(/\$\("([^"]+)"\)/g)].map(match => match[1]);
  for (const id of new Set(ids)) assert.ok(html.includes('id="' + id + '"'), id);
});
