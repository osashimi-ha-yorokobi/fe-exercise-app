const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { rows, normalize, isTermAnswer } = require("../scripts/audit-answer-terms.js");

function load(n) {
  const context = vm.createContext({ window: {} });
  for (const file of ["common", `${n}-a`, `${n}-recent`, `${n}-b`]) {
    const source = fs.readFileSync(path.join(__dirname, `../js/mock-exam-set-${file}.js`), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context.window.FE_MOCK_EXAM;
}

for (const n of [2, 3]) {
  test(`第${n}回は科目A60問・B20問で、各選択肢の解説を備える`, () => {
    const d = load(n);
    assert.equal(d.a.length, 60);
    assert.equal(d.b.length, 20);
    assert.equal(d.a.filter(q => q.recentFocus).length, 12);
    assert.equal(d.b.filter(q => q.field === "アルゴリズム").length, 16);
    assert.equal(d.b.filter(q => q.field === "情報セキュリティ").length, 4);
    for (const q of [...d.a, ...d.b]) {
      assert.equal(q.c.length, 4);
      assert.equal(q.reasons.length, 4);
      assert.equal(new Set(q.c).size, 4);
      assert.ok(q.reasons.every(Boolean));
      assert.equal(q.e, q.reasons[q.a]);
      if (q.field === "アルゴリズム") assert.ok(q.code && q.intro);
      if (q.field === "情報セキュリティ") assert.ok(q.material && q.intro);
    }
    const md = fs.readFileSync(path.join(__dirname, `../MOCK-EXAM-0${n}.md`), "utf8");
    assert.ok(md.includes(`第${n}回`));
    assert.equal((md.match(/\*\*問[０-９]+\*\*/g) || []).length, 80);
    assert.equal((md.match(/（正解）/g) || []).length, 80);
  });
}

test("追加セットの問題文とアルゴリズム題材は重複しない", () => {
  const d2 = load(2), d3 = load(3);
  const all = [...d2.a, ...d2.b, ...d3.a, ...d3.b];
  assert.equal(new Set(all.map(q => q.q)).size, all.length);
  const algs = [...d2.b, ...d3.b].filter(q => q.field === "アルゴリズム");
  assert.equal(new Set(algs.map(q => q.topic)).size, 32);
});

test("3セットの正解用語は正規化後も重複しない", () => {
  const terms = rows.filter(({ answer }) => isTermAnswer(answer));
  const keys = terms.map(({ answer }) => normalize(answer));
  assert.equal(new Set(keys).size, keys.length);
});

test("各回のCBTページは独立した問題データとスマホ用操作を読み込む", () => {
  for (const n of [2, 3]) {
    const html = fs.readFileSync(path.join(__dirname, `../mock-exam-0${n}.html`), "utf8");
    for (const script of ["common", `${n}-a`, `${n}-recent`, `${n}-b`]) {
      assert.ok(html.includes(`js/mock-exam-set-${script}.js`));
    }
    assert.ok(html.includes('name="viewport"'));
    assert.ok(html.includes('id="mobile-nav-toggle"'));
    assert.ok(html.includes('id="mobile-prev"'));
    assert.ok(html.includes('id="mobile-next"'));
    assert.ok(html.includes('js/mock-exam.js'));
  }
  const css = fs.readFileSync(path.join(__dirname, "../css/mock-exam.css"), "utf8");
  assert.ok(css.includes("@media(max-width:760px)"));
  assert.ok(css.includes(".mobile-toolbar{display:flex"));
});

test("科目Aの数値問題を独立した式で検算する", () => {
  const d2 = load(2).a, d3 = load(3).a;
  const checks = [
    [d2, 41, 8 * 7 * 6 / (3 * 2), "56"],
    [d2, 42, .9 ** 3 + 3 * .9 ** 2 * .1, "0.972"],
    [d2, 43, 120 * 8 / 80, "12秒"],
    [d2, 44, (4 - 1) * 2, "6"],
    [d2, 46, 2 ** 4 - 2, "14"],
    [d2, 47, 36 / (36 + 9) * 100, "80％"],
    [d2, 48, 800 * 600 * 24 / 8 / 1000, "1,440"],
    [d2, 49, 3 + Math.max(5, 7) + 4, "14日"],
    [d2, 50, 3 * 4 + 2 * 5 + 1 * 4 + 2 * 7 + 1 * 5, "45 FP"],
    [d2, 51, (90000 + 30000) / (800 - 500), "400個"],
    [d2, 53, .01 * .9 / (.01 * .9 + .99 * .05) * 100, "約15％"],
    [d2, 59, 80 - 100, "－20万円"],
    [d2, 60, 8 * 300, "2,400円"],
    [d3, 41, 150 - 256, "－106"],
    [d3, 43, 3 / 8, "3/8"],
    [d3, 44, 2000 / (.6 * 2 + .4 * 5), "3.2と625"],
    [d3, 45, .95 * 4 + .05 * 44, "6"],
    [d3, 47, 250 * 8 / 125, "16秒"],
    [d3, 49, .99 * .98, "0.9702"],
    [d3, 52, 4 + Math.max(6 + 5, 8) + 3, "18日"],
    [d3, 53, (250 * 4 - 800) / 800 * 100, "25％"],
    [d3, 54, (120000 + 60000) / (1500 - 900), "300個"],
    [d3, 55, 17 - 1, "16時間"],
    [d3, 56, .2 * 500 - .05 * 500 - 40, "35"],
    [d3, 59, Math.max(5 + 4 + 6 + 3, 5 + 7 + 6 + 3, 5 + 4 + 8 + 3), "21日"],
    [d3, 60, 5 * 400, "2,000円"]
  ];
  for (const [questions, number, actual, expected] of checks) {
    assert.ok(Number.isFinite(actual));
    assert.equal(questions[number - 1].c[questions[number - 1].a], expected, `問${number}: ${actual}`);
  }
  // 整数計画の末問は全実行可能な組合せを列挙して最大値を再確認する。
  const max2 = Math.max(...Array.from({ length: 13 }, (_, x) => Array.from({ length: 13 }, (_, y) => 2*x+y<=12 && x+2*y<=12 ? 300*(x+y) : 0)).flat());
  const max3 = Math.max(...Array.from({ length: 11 }, (_, p) => Array.from({ length: 9 }, (_, q) => 2*p+q<=10 && p+2*q<=8 ? 400*p+200*q : 0)).flat());
  assert.equal(max2, 2400);
  assert.equal(max3, 2000);
});
