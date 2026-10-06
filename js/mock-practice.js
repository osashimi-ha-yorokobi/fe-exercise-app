/* 全3回の模試を横断する、時間制限なしの一問練習。 */
(() => {
  "use strict";
  const pool = window.FE_MOCK_PRACTICE_POOL;
  const state = window.FE_MOCK_PRACTICE_STATE;
  const labels = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ"];
  const storageKey = "fe-mock-practice-checks-v1";
  const validKeys = new Set(pool.map(q => q.meta.key));
  const $ = id => document.getElementById(id);
  let bookmarks = new Set();
  let selection = [];
  let session = null;
  let activeSubject = "all";

  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(saved)) bookmarks = new Set(saved.filter(key => validKeys.has(key)));
  } catch (_) { /* 保存が使えない場合も練習を続けられる。 */ }

  function saveBookmarks() {
    try { window.localStorage.setItem(storageKey, JSON.stringify([...bookmarks])); }
    catch (_) { /* 同じ画面内ではチェック状態を保持する。 */ }
    $("practice-bookmark-count").textContent = String(bookmarks.size);
  }

  function currentQuestion() { return selection[session.order[session.cursor]]; }

  function updateCheck() {
    const checked = bookmarks.has(currentQuestion().meta.key);
    const button = $("practice-check");
    button.setAttribute("aria-pressed", String(checked));
    button.classList.toggle("is-flagged", checked);
    button.textContent = checked ? "✓ チェックを外す" : "✓ 後で確認";
  }

  function start(subject) {
    activeSubject = subject;
    selection = state.select(pool, {
      subject,
      excludeCalculation: $("practice-no-calculation").checked,
      bookmarkedOnly: $("practice-bookmark-filter").checked,
      bookmarks
    });
    if (selection.length === 0) {
      $("practice-warning").textContent = "条件に合う問題がありません。チェックや科目の選択を変更してください。";
      $("practice-warning").hidden = false;
      return;
    }
    $("practice-warning").hidden = true;
    session = state.create(selection.length);
    $("practice-title").textContent = "全3回・" + ({ all:"全科目", a:"科目A", b:"科目B" })[subject] + " 一問ずつ練習";
    for (const id of ["welcome", "exam", "result"]) $(id).hidden = true;
    $("practice").hidden = false;
    showQuestion();
    window.scrollTo(0, 0);
  }

  function showQuestion() {
    const q = currentQuestion();
    $("practice-card").hidden = false;
    $("practice-complete").hidden = true;
    $("practice-stats").textContent = `${session.cursor + 1} / ${selection.length}問　正解 ${session.correct}問`;
    $("practice-number").textContent = "第" + (session.cursor + 1) + "問";
    $("practice-source").textContent = `出典：オリジナル模試 第${q.meta.setId}回・科目${q.meta.subject} 問${q.meta.number}`;
    $("practice-question").textContent = q.q;
    $("practice-question").hidden = !!q.material;
    $("practice-final").textContent = q.q;
    $("practice-final").hidden = !q.material;
    $("practice-intro").textContent = q.intro || "";
    $("practice-intro").hidden = !q.intro;
    $("practice-material").textContent = q.material || "";
    $("practice-material").hidden = !q.material;
    $("practice-code").textContent = q.code || "";
    $("practice-code").hidden = !q.code;
    $("practice-program-caption").hidden = !q.code;
    window.FE_RENDER_DIAGRAM(q, $("practice-diagram"));
    $("practice-feedback").hidden = true;
    $("practice-next").hidden = true;
    $("practice-choices").replaceChildren();
    q.c.forEach((choice, i) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "practice-answer";
      input.value = String(i);
      input.addEventListener("change", () => answer(i));
      const kana = document.createElement("span");
      kana.className = "kana";
      kana.textContent = labels[i];
      const content = document.createElement("span");
      content.textContent = choice;
      label.append(input, kana, content);
      $("practice-choices").append(label);
    });
    updateCheck();
  }

  function answer(choice) {
    const q = currentQuestion();
    if (!state.answer(session, choice, q.a)) return;
    if (choice !== q.a) {
      bookmarks.add(q.meta.key);
      saveBookmarks();
      updateCheck();
    }
    $("practice-choices").querySelectorAll("input").forEach(input => { input.disabled = true; });
    $("practice-stats").textContent = `${session.cursor + 1} / ${selection.length}問　正解 ${session.correct}問`;
    const heading = $("practice-feedback-title");
    heading.className = choice === q.a ? "correct" : "incorrect";
    heading.textContent = (choice === q.a ? "正解" : "不正解") + "　正解：" + labels[q.a];
    window.FE_RENDER_CONTEXT(q, $("practice-context"));
    const reasons = $("practice-reasons");
    reasons.replaceChildren();
    q.c.forEach((_, i) => {
      const li = document.createElement("li");
      li.className = i === q.a ? "correct" : "";
      li.textContent = labels[i] + (i === q.a ? "（正解）" : "（誤り）") + "　" + (q.reasons?.[i] || (i === q.a ? q.e : "問題の条件と合いません。"));
      reasons.append(li);
    });
    $("practice-feedback").hidden = false;
    $("practice-next").textContent = session.cursor === selection.length - 1 ? "結果を見る" : "次のランダム問題へ";
    $("practice-next").hidden = false;
    $("practice-feedback").focus();
  }

  function next() {
    if (!state.next(session)) return;
    if (session.phase === "done") {
      $("practice-card").hidden = true;
      $("practice-complete").hidden = false;
      $("practice-complete-score").textContent = `${selection.length}問中 ${session.correct}問正解`;
      $("practice-review-checks").disabled = bookmarks.size === 0;
      window.scrollTo(0, 0);
    } else {
      showQuestion();
      window.scrollTo(0, 0);
    }
  }

  function leave() {
    $("practice").hidden = true;
    $("welcome").hidden = false;
    $("practice-bookmark-count").textContent = String(bookmarks.size);
    window.scrollTo(0, 0);
  }

  document.querySelectorAll("[data-practice-start]").forEach(button =>
    button.addEventListener("click", () => start(button.dataset.practiceStart)));
  $("practice-check").addEventListener("click", () => {
    const key = currentQuestion().meta.key;
    if (bookmarks.has(key)) bookmarks.delete(key); else bookmarks.add(key);
    saveBookmarks();
    updateCheck();
  });
  $("practice-next").addEventListener("click", next);
  $("practice-leave").addEventListener("click", leave);
  $("practice-complete-leave").addEventListener("click", leave);
  $("practice-restart").addEventListener("click", () => start(activeSubject));
  $("practice-review-checks").addEventListener("click", () => {
    $("practice-bookmark-filter").checked = true;
    $("practice-no-calculation").checked = false;
    start("all");
  });
  $("practice-bookmark-count").textContent = String(bookmarks.size);
})();
