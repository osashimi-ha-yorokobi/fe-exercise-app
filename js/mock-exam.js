(() => {
  "use strict";
  const data = window.FE_MOCK_EXAM;
  const setId = window.FE_MOCK_SET_ID || 1;
  const state = window.FE_MOCK_STATE;
  const labels = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ"];
  const $ = id => document.getElementById(id);
  const fullwidth = n => String(n).replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 65248));
  const storeKey = subject => setId === 1
    ? "fe-mock-01-cbt-" + subject + (subject === "a" ? "-v4" : "-v2")
    : "fe-mock-0" + setId + "-cbt-" + subject + (subject === "a" ? (setId === 2 ? "-v3" : "-v2") : "-v1");
  const sessions = { a: null, b: null };
  let activeSubject = null;
  let navFilter = "all";

  function save(subject) {
    try { window.localStorage.setItem(storeKey(subject), JSON.stringify(sessions[subject])); }
    catch (_) { /* 保存できない環境でも画面内の受験は続けられる。 */ }
  }
  function load(subject) {
    try {
      const raw = window.localStorage.getItem(storeKey(subject));
      const session = raw ? JSON.parse(raw) : null;
      if (!state.valid(session) || session.subject !== subject) return null;
      sessions[subject] = session;
      if (state.advance(session, Date.now())) save(subject);
      return session;
    } catch (_) { return null; }
  }
  function current() { return sessions[activeSubject]; }
  function setMobileNav(open, restoreFocus = false) {
    $("question-nav").closest(".nav").classList.toggle("is-open", open);
    $("mobile-nav-backdrop").hidden = !open;
    $("mobile-nav-toggle").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("mobile-nav-open", open);
    if (open) $("close-mobile-nav").focus();
    else if (restoreFocus) $("mobile-nav-toggle").focus();
  }
  function showSection(name) {
    if (name !== "exam") setMobileNav(false);
    for (const id of ["welcome", "exam", "result"]) $(id).hidden = id !== name;
    window.scrollTo(0, 0);
  }
  function formatTime(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    return [hours, minutes, rest].map(n => String(n).padStart(2, "0")).join(":");
  }
  function renderWelcome() {
    const list = $("saved-list");
    list.replaceChildren();
    for (const subject of ["a", "b"]) {
      const s = sessions[subject];
      if (!s) continue;
      const row = document.createElement("div");
      row.className = "saved-row";
      const detail = document.createElement("span");
      const count = state.summary(s);
      detail.textContent = "科目" + subject.toUpperCase() + "　" + (s.phase === "active" ? "受験中・解答済み" + count.answered + "/" + count.total + "問・残り" + formatTime(s.deadline - Date.now()) : "終了済み・結果を確認できます");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary";
      button.textContent = s.phase === "active" ? "再開" : "結果を見る";
      button.addEventListener("click", () => open(subject));
      row.append(detail, button);
      list.append(row);
    }
    $("saved-session").hidden = list.childElementCount === 0;
  }
  function start(subject) {
    const previous = sessions[subject];
    if (previous && previous.phase === "active" && !window.confirm("科目" + subject.toUpperCase() + "の進行中の解答を破棄して、最初から始めますか。")) return;
    sessions[subject] = state.create(subject, Date.now());
    save(subject);
    open(subject);
  }
  function open(subject) {
    const s = sessions[subject];
    if (!s) return;
    activeSubject = subject;
    navFilter = "all";
    if (state.advance(s, Date.now())) save(subject);
    if (s.phase === "done") renderResult();
    else renderExam();
  }
  function renderExam() {
    const s = current();
    if (!s || s.phase !== "active") return;
    $("subject-name").textContent = "科目" + activeSubject.toUpperCase() + " / 全問必須";
    $("exam-title").textContent = "第" + setId + "回 科目" + activeSubject.toUpperCase() + " 模擬試験";
    renderQuestion();
    renderTimer();
    showSection("exam");
  }
  function renderQuestion() {
    const s = current();
    const index = s.current;
    const q = data[activeSubject][index];
    $("question-number").textContent = "問" + fullwidth(index + 1);
    $("question-text").hidden = !!q.material;
    $("question-text").textContent = q.q;
    $("question-final").hidden = !q.material;
    $("question-final").textContent = q.q;
    $("question-intro").hidden = !q.intro;
    $("question-intro").textContent = q.intro || "";
    $("question-material").hidden = !q.material;
    $("question-material").textContent = q.material || "";
    $("program-caption").hidden = !q.code;
    $("question-code").hidden = !q.code;
    $("question-code").textContent = q.code || "";
    window.FE_RENDER_DIAGRAM(q, $("question-diagram"));
    $("choices").replaceChildren();
    q.c.forEach((choice, i) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = i;
      input.checked = s.answers[index] === i;
      input.addEventListener("change", () => {
        s.answers[index] = i;
        save(activeSubject);
        renderNav();
        $("clear-answer").disabled = false;
      });
      const kana = document.createElement("span");
      kana.className = "kana";
      kana.textContent = labels[i];
      const content = document.createElement("span");
      content.textContent = choice;
      label.append(input, kana, content);
      $("choices").append(label);
    });
    $("flag").setAttribute("aria-pressed", String(s.flags[index]));
    $("flag").classList.toggle("is-flagged", s.flags[index]);
    $("flag").textContent = s.flags[index] ? "⚑ 見直しを解除" : "⚑ 後で見直す";
    $("clear-answer").disabled = s.answers[index] === null;
    $("prev").disabled = index === 0;
    $("next").disabled = index === s.answers.length - 1;
    $("mobile-prev").disabled = index === 0;
    $("mobile-next").disabled = index === s.answers.length - 1;
    $("mobile-position").textContent = (index + 1) + "/" + s.answers.length;
    renderNav();
  }
  function renderNav() {
    const s = current();
    const nav = $("question-nav");
    nav.replaceChildren();
    s.answers.forEach((answer, i) => {
      if (navFilter === "unanswered" && answer !== null) return;
      if (navFilter === "flagged" && !s.flags[i]) return;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(i + 1);
      button.className = [answer !== null ? "answered" : "", s.flags[i] ? "flagged" : "", i === s.current ? "current" : ""].join(" ");
      button.setAttribute("aria-label", "問" + (i + 1) + (answer !== null ? " 解答済み" : " 未解答") + (s.flags[i] ? " 見直し" : ""));
      button.addEventListener("click", () => {
        s.current = i;
        save(activeSubject);
        setMobileNav(false);
        renderQuestion();
        window.scrollTo(0, 0);
      });
      nav.append(button);
    });
    $("nav-empty").hidden = nav.childElementCount !== 0;
    const summary = state.summary(s);
    $("progress-label").textContent = (s.current + 1) + " / " + summary.total + "問　・　解答済み " + summary.answered + "問　・　見直し " + summary.flagged + "問";
    $("progress-fill").style.width = (summary.answered / summary.total * 100) + "%";
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.classList.toggle("active", button.dataset.filter === navFilter);
      button.setAttribute("aria-pressed", String(button.dataset.filter === navFilter));
    });
  }
  function renderTimer() {
    const s = current();
    if (!s || s.phase !== "active") return;
    const left = s.deadline - Date.now();
    $("time-left").textContent = formatTime(left);
    $("mobile-time-left").textContent = formatTime(left);
    $("time-left").parentElement.classList.toggle("low", left <= 5 * 60 * 1000);
    $("mobile-time-left").classList.toggle("low", left <= 5 * 60 * 1000);
  }
  function tick() {
    for (const subject of ["a", "b"]) {
      const s = sessions[subject];
      if (s && state.advance(s, Date.now())) {
        save(subject);
      }
    }
    if (!$("exam").hidden && activeSubject) {
      if (current().phase === "done") {
        if ($("finish-dialog").open) $("finish-dialog").close();
        renderResult();
      } else renderTimer();
    }
    if (!$("welcome").hidden) renderWelcome();
  }
  function askFinish() {
    setMobileNav(false);
    const s = current();
    if (!s || s.phase !== "active") return;
    const summary = state.summary(s);
    $("finish-title").textContent = "科目" + activeSubject.toUpperCase() + "を終了しますか";
    $("finish-message").textContent = summary.unanswered || summary.flagged ? "未解答や見直しを確認してから終了できます。" : "全ての問題に解答しています。";
    $("finish-answered").textContent = summary.answered + "問";
    $("finish-unanswered").textContent = summary.unanswered + "問";
    $("finish-flagged").textContent = summary.flagged + "問";
    if (typeof $("finish-dialog").showModal === "function") $("finish-dialog").showModal();
    else if (window.confirm("この科目を終了しますか。未解答：" + summary.unanswered + "問")) finish();
  }
  function finish() {
    const s = current();
    if (!s || s.phase !== "active") return;
    state.submit(s, Date.now());
    save(activeSubject);
    if ($("finish-dialog").open) $("finish-dialog").close();
    renderResult();
  }
  function renderResult() {
    const s = current();
    if (!s || s.phase !== "done") return;
    const items = data[activeSubject];
    const correct = items.reduce((total, q, i) => total + (s.answers[i] === q.a ? 1 : 0), 0);
    const summary = state.summary(s);
    $("result-title").textContent = "第" + setId + "回 科目" + activeSubject.toUpperCase() + " 採点結果";
    const scores = $("score");
    scores.replaceChildren();
    for (const [label, value] of [["正解", correct + " / " + items.length + "問"], ["正答率", Math.round(correct / items.length * 100) + "%"], ["未解答", summary.unanswered + "問"]]) {
      const box = document.createElement("div");
      const title = document.createElement("span");
      const number = document.createElement("strong");
      title.textContent = label;
      number.textContent = value;
      box.append(title, number);
      scores.append(box);
    }
    $("result-note").textContent = (s.endReason === "time" ? "制限時間に達したため自動終了しました。" : "解答を提出しました。") + "実際の試験はIRTに基づく評価点で判定されるため、この正答率だけでは合否を判断できません。";
    const review = $("review-list");
    review.replaceChildren();
    items.forEach((q, i) => {
      const card = document.createElement("article");
      card.className = "review";
      const h = document.createElement("h3");
      h.textContent = "問" + fullwidth(i + 1) + "　" + q.q;
      if (!q.material) card.append(h);
      if (q.intro) {
        const intro = document.createElement("div");
        intro.className = "question-intro";
        intro.textContent = q.intro;
        card.append(intro);
      }
      if (q.material) {
        const material = document.createElement("pre");
        material.className = "material";
        material.textContent = q.material;
        card.append(material);
        card.append(h);
      }
      if (q.code) {
        const caption = document.createElement("p");
        caption.className = "program-caption";
        caption.textContent = "〔プログラム〕";
        const pre = document.createElement("pre");
        pre.className = "code";
        pre.textContent = q.code;
        card.append(caption, pre);
      }
      if (q.meta?.diagram) {
        const diagram = document.createElement("div");
        window.FE_RENDER_DIAGRAM(q, diagram);
        card.append(diagram);
      }
      const options = document.createElement("ul");
      options.className = "review-options";
      q.c.forEach((choice, j) => {
        const li = document.createElement("li");
        li.textContent = labels[j] + "　" + choice;
        if (j === q.a) li.classList.add("correct");
        if (j === s.answers[i] && j !== q.a) li.classList.add("incorrect");
        options.append(li);
      });
      const selected = document.createElement("p");
      selected.className = s.answers[i] === q.a ? "selected correct" : "selected incorrect";
      selected.textContent = "あなたの解答：" + (s.answers[i] === null ? "未解答" : labels[s.answers[i]]);
      const explanation = document.createElement("div");
      explanation.className = "explanation";
      const context = document.createElement("div");
      context.className = "explanation-context";
      window.FE_RENDER_CONTEXT(q, context);
      explanation.append(context);
      if (q.reasons) {
        const title = document.createElement("p");
        title.textContent = "正解：" + labels[q.a] + "　選択肢ごとの解説";
        const details = document.createElement("ul");
        details.className = "option-reasons";
        q.reasons.forEach((reason, j) => {
          const li = document.createElement("li");
          li.textContent = labels[j] + (j === q.a ? "（正解）" : "（誤り）") + "　" + reason;
          details.append(li);
        });
        explanation.append(title, details);
      } else {
        explanation.textContent = "正解：" + labels[q.a] + "　解説：" + q.e;
      }
      card.append(options, selected, explanation);
      review.append(card);
    });
    showSection("result");
  }

  document.querySelectorAll("[data-start]").forEach(button => button.addEventListener("click", () => start(button.dataset.start)));
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { navFilter = button.dataset.filter; renderNav(); }));
  $("flag").addEventListener("click", () => {
    const s = current();
    s.flags[s.current] = !s.flags[s.current];
    save(activeSubject);
    renderQuestion();
  });
  $("clear-answer").addEventListener("click", () => {
    const s = current();
    s.answers[s.current] = null;
    save(activeSubject);
    renderQuestion();
  });
  function moveCurrent(delta) {
    const s = current();
    const next = s.current + delta;
    if (next < 0 || next >= s.answers.length) return;
    s.current = next;
    save(activeSubject);
    renderQuestion();
    window.scrollTo(0, 0);
  }
  $("prev").addEventListener("click", () => moveCurrent(-1));
  $("next").addEventListener("click", () => moveCurrent(1));
  $("mobile-prev").addEventListener("click", () => moveCurrent(-1));
  $("mobile-next").addEventListener("click", () => moveCurrent(1));
  $("mobile-nav-toggle").addEventListener("click", () => setMobileNav($("mobile-nav-backdrop").hidden));
  $("close-mobile-nav").addEventListener("click", () => setMobileNav(false, true));
  $("mobile-nav-backdrop").addEventListener("click", () => setMobileNav(false, true));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("mobile-nav-backdrop").hidden) setMobileNav(false, true);
  });
  $("submit").addEventListener("click", askFinish);
  $("cancel-finish").addEventListener("click", () => $("finish-dialog").close());
  $("confirm-finish").addEventListener("click", finish);
  $("leave-exam").addEventListener("click", () => { renderWelcome(); showSection("welcome"); });
  $("return-welcome").addEventListener("click", () => { renderWelcome(); showSection("welcome"); });
  $("restart").addEventListener("click", () => start(activeSubject));
  for (const subject of ["a", "b"]) load(subject);
  renderWelcome();
  setInterval(tick, 1000);
})();
