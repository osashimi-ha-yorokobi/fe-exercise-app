(() => {
  "use strict";

  const STORAGE_KEY = "fe-update-cbt-progress-v1";
  const letters = ["ア", "イ", "ウ", "エ"];
  const SUBJECT_B_TAG_ORDER = [
    "線形探索・集計系",
    "探索・二分探索系",
    "整列（ソート）系",
    "データ構造操作系（スタック/キュー/リスト）",
    "再帰・木構造系"
  ];
  const questionBanks = {
    A: [
      ...(Array.isArray(window.FE_QUESTIONS) ? window.FE_QUESTIONS : []),
      ...(Array.isArray(window.FE_QUESTIONS_EXTRA) ? window.FE_QUESTIONS_EXTRA : [])
    ],
    B: Array.isArray(window.FE_QUESTIONS_B) ? window.FE_QUESTIONS_B : []
  };
  let questions = questionBanks.A;

  const elements = {
    startScreen: document.querySelector("#start-screen"),
    appShell: document.querySelector("#app-shell"),
    startButtons: document.querySelectorAll("[data-start-subject]"),
    startCountA: document.querySelector("#start-count-a"),
    startCountB: document.querySelector("#start-count-b"),
    startCountKeywords: document.querySelector("#start-count-keywords"),
    startCountLibrary: document.querySelector("#start-count-library"),
    home: document.querySelector("#home-button"),
    stage: document.querySelector("#question-stage"),
    fieldLabel: document.querySelector("#field-label"),
    field: document.querySelector("#field-filter"),
    search: document.querySelector("#keyword-search"),
    applyFilter: document.querySelector("#apply-filter"),
    shuffleQuestions: document.querySelector("#shuffle-questions"),
    shuffleChoices: document.querySelector("#shuffle-choices"),
    modeList: document.querySelector("#mode-list"),
    topContext: document.querySelector("#top-context"),
    finish: document.querySelector("#finish-button"),
    coverageValue: document.querySelector("#coverage-value"),
    coverageFill: document.querySelector("#coverage-fill"),
    coverageCopy: document.querySelector("#coverage-copy"),
    dialValue: document.querySelector("#dial-value"),
    dialPercent: document.querySelector("#dial-percent"),
    statCorrect: document.querySelector("#stat-correct"),
    statWrong: document.querySelector("#stat-wrong"),
    statOpen: document.querySelector("#stat-open"),
    countAll: document.querySelector("#count-all"),
    countWrong: document.querySelector("#count-wrong"),
    countUnanswered: document.querySelector("#count-unanswered"),
    saveState: document.querySelector("#save-state"),
    menu: document.querySelector("#menu-button"),
    sidebar: document.querySelector("#sidebar"),
    scrim: document.querySelector("#scrim")
  };

  const emptyStore = () => ({
    stats: {},
    settings: { shuffleQuestions: false, shuffleChoices: false },
    activeSubject: "A",
    lastSession: null
  });

  const loadStore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const savedStore = { ...(saved || {}) };
      delete savedStore.reviews;
      return { ...emptyStore(), ...savedStore, settings: { ...emptyStore().settings, ...(saved?.settings || {}) } };
    } catch (_) {
      return emptyStore();
    }
  };

  const app = {
    store: loadStore(),
    keywords: [],
    glossaryTerms: [],
    subject: "A",
    mode: "all",
    queue: [],
    position: 0,
    presented: {},
    pending: {},
    sessionAnswers: {},
    showingResult: false
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const glossaryHref = (keyword) => `keywords.html?term=${encodeURIComponent(keyword)}`;

  const glossaryTermLink = (keyword) => {
    const text = String(keyword ?? "");
    if (!text) return "";
    const known = app.glossaryTerms.some((entry) => entry.keyword === text);
    return known
      ? `<a class="term-link" href="${escapeHtml(glossaryHref(text))}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
      : escapeHtml(text);
  };

  const linkGlossaryTerms = (value) => {
    const text = String(value ?? "");
    if (!text || !app.glossaryTerms.length) return escapeHtml(text);
    const entries = [...app.glossaryTerms]
      .filter((entry) => entry?.keyword && entry.keyword.length >= 2)
      .sort((a, b) => b.keyword.length - a.keyword.length);
    if (!entries.length) return escapeHtml(text);
    const escapedEntries = entries.map((entry) => ({
      entry,
      escaped: escapeHtml(entry.keyword)
    }));
    const escapedMap = new Map(escapedEntries.map(({ entry, escaped }) => [escaped, entry]));
    const pattern = escapedEntries.map(({ escaped, entry }) => {
      const escapedPattern = escapeRegExp(escaped);
      const ascii = /^[A-Za-z0-9]/.test(entry.keyword);
      return ascii ? `(?<![A-Za-z0-9])${escapedPattern}(?![A-Za-z0-9])` : escapedPattern;
    }).join("|");
    const escapedText = escapeHtml(text);
    return escapedText.replace(new RegExp(pattern, "gu"), (match) => {
      const entry = escapedMap.get(match);
      if (!entry) return match;
      return `<a class="term-link" href="${escapeHtml(glossaryHref(entry.keyword))}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
  };

  const shuffle = (values) => {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  };

  const saveStore = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(app.store));
      const now = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      elements.saveState.textContent = `${now} 保存済み`;
    } catch (_) {
      elements.saveState.textContent = "保存できませんでした";
    }
  };

  const closeMenu = () => {
    elements.sidebar.classList.remove("is-open");
    elements.scrim.classList.remove("is-open");
    elements.scrim.classList.remove("is-visible");
    elements.menu.setAttribute("aria-expanded", "false");
  };

  const showStudyScreen = () => {
    elements.startScreen.hidden = true;
    elements.appShell.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const showStartScreen = () => {
    closeMenu();
    elements.appShell.hidden = true;
    elements.startScreen.hidden = false;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("subject");
      url.searchParams.delete("keyword");
      history.replaceState(null, "", url);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const updateLocation = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("subject", app.subject);
      url.searchParams.delete("keyword");
      history.replaceState(null, "", url);
    } catch (_) {}
  };

  const getFilteredQuestions = () => {
    const field = elements.field.value;
    const query = elements.search.value.trim().toLocaleLowerCase("ja-JP");
    return questions.filter((question) => {
      const stats = app.store.stats[question.id];
      const matchesMode = app.mode === "all"
        || (app.mode === "wrong" && stats?.lastResult === false)
        || (app.mode === "unanswered" && !stats);
      const matchesField = field === "all" || question.field === field;
      const haystack = `${question.keyword} ${question.field} ${question.subField}`.toLocaleLowerCase("ja-JP");
      return matchesMode && matchesField && (!query || haystack.includes(query));
    });
  };

  const currentQuestion = () => app.queue[app.position];

  const getPresentedChoices = (question) => {
    if (!app.presented[question.id]) {
      const base = question.choices.map((text, originalIndex) => ({ text, originalIndex }));
      app.presented[question.id] = app.store.settings.shuffleChoices ? shuffle(base) : base;
    }
    return app.presented[question.id];
  };

  const buildSession = () => {
    let queue = getFilteredQuestions();
    if (app.store.settings.shuffleQuestions) queue = shuffle(queue);
    app.queue = queue;
    app.position = 0;
    app.presented = {};
    app.pending = {};
    app.sessionAnswers = {};
    app.showingResult = false;
    app.store.lastSession = {
      startedAt: new Date().toISOString(),
      subject: app.subject,
      mode: app.mode,
      field: elements.field.value,
      query: elements.search.value.trim(),
      total: queue.length
    };
    saveStore();
    renderQuestion();
    updateSummary();
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderQuestion = () => {
    const question = currentQuestion();
    if (!question) return renderEmpty();

    const answer = app.sessionAnswers[question.id];
    const selectedOriginal = answer?.selectedOriginal ?? app.pending[question.id];
    const presented = getPresentedChoices(question);
    const choicesHtml = presented.map((choice, presentedIndex) => {
      const isSelected = selectedOriginal === choice.originalIndex;
      const isCorrect = Boolean(answer) && choice.originalIndex === question.answer;
      const isWrong = Boolean(answer) && isSelected && choice.originalIndex !== question.answer;
      const classes = ["choice", isSelected ? "is-selected" : "", isCorrect ? "is-correct" : "", isWrong ? "is-wrong" : ""].filter(Boolean).join(" ");
      return `
        <label class="${classes}" data-choice="${choice.originalIndex}">
          <input type="radio" name="answer" value="${choice.originalIndex}" ${isSelected ? "checked" : ""} ${answer ? "disabled" : ""} />
          <span class="choice-letter">${letters[presentedIndex]}</span>
          <span class="choice-copy${choice.text.includes("\n") ? " is-code" : ""}">${escapeHtml(choice.text)}</span>
          <span class="choice-check" aria-hidden="true"></span>
        </label>`;
    }).join("");

    const feedbackHtml = answer ? renderFeedback(question, answer, presented) : "";
    const progress = ((app.position + 1) / app.queue.length) * 100;
    elements.stage.innerHTML = `
      <article class="question-card">
        <header class="question-head">
          <div class="question-kicker">
            <div class="question-count"><span>QUESTION</span><strong>${String(app.position + 1).padStart(2, "0")}</strong><span>/ ${String(app.queue.length).padStart(2, "0")}</span></div>
            <div class="session-progress" aria-label="${app.position + 1}問目"><i style="width:${progress}%"></i></div>
          </div>
          <div class="tag-row">
            <span class="tag version">${app.subject === "B" ? "科目B 公式形式" : `Syllabus Ver.${escapeHtml(question.version)}`}</span>
            <span class="tag">${escapeHtml(question.field)}</span>
            <span class="tag">${escapeHtml(question.scope || question.changeType)}</span>
            ${question.verified ? `<span class="tag verified">${app.subject === "B" ? "解答検証済み" : "IPA確認済み"}</span>` : ""}
          </div>
        </header>
        <div class="question-body">
          <p class="prompt-label">${app.subject === "B" ? "科目B・アルゴリズム" : "科目A・四肢択一"}</p>
          <p class="question-text">${answer ? linkGlossaryTerms(question.question) : escapeHtml(question.question)}</p>
          ${question.code ? `<pre class="code-block"><code>${escapeHtml(question.code)}</code></pre>` : ""}
          <div class="choices" role="radiogroup" aria-label="解答選択肢">${choicesHtml}</div>
          <div class="answer-actions">
            <button class="primary-button" id="submit-answer" ${selectedOriginal === undefined || answer ? "disabled" : ""}>${answer ? "回答済み" : "回答する"}</button>
          </div>
          ${feedbackHtml}
        </div>
        <footer class="question-footer">
          <button class="nav-button" id="previous-question" ${app.position === 0 ? "disabled" : ""}>← 前の問題</button>
          <span class="question-id">${escapeHtml(question.id)} · ${escapeHtml(question.keywordId)}</span>
          <button class="nav-button" id="next-question">${app.position === app.queue.length - 1 ? "結果を見る" : "次の問題"} →</button>
        </footer>
      </article>`;

    bindQuestionEvents();
  };

  const renderFeedback = (question, answer, presented) => {
    const correctPresentedIndex = presented.findIndex((choice) => choice.originalIndex === question.answer);
    const notes = presented.map((choice, index) => {
      const sourceNote = question.wrongExplanations[choice.originalIndex];
      const text = sourceNote.replace(/^[アイウエ]：/, "");
      return `<div class="option-note"><b>${letters[index]}</b><span>${linkGlossaryTerms(text)}</span></div>`;
    }).join("");
    return `
      <section class="feedback" tabindex="-1">
        <div class="feedback-title ${answer.correct ? "correct" : "wrong"}">
          <i>${answer.correct ? "✓" : "!"}</i>
          <strong>${answer.correct ? "正解" : "不正解"} — 正解は ${letters[correctPresentedIndex]}</strong>
        </div>
        <h3 class="explanation-heading">【解説】</h3>
        <p class="explanation-main">${linkGlossaryTerms(question.explanation)}</p>
        <h4 class="option-notes-heading">各選択肢の確認</h4>
        <div class="option-notes">${notes}</div>
        <div class="source-box">
          出典：<a href="${escapeHtml(question.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(question.source)}</a>
          ${question.sourcePage ? `／ PDF p.${escapeHtml(question.sourcePage)}` : "／ 出題形式・傾向を参照"} ／ 対象：${glossaryTermLink(question.keyword)}
        </div>
      </section>`;
  };

  const renderEmpty = () => {
    const labelsByMode = {
      all: "条件に合う問題がありません",
      wrong: "復習待ちの問題はありません",
      unanswered: "未回答の問題はありません"
    };
    elements.stage.innerHTML = `
      <section class="empty-card">
        <p class="prompt-label">NO QUESTIONS</p>
        <h2>${labelsByMode[app.mode]}</h2>
        <p>学習モードや絞り込み条件を変えて、もう一度出題してください。</p>
        <button class="primary-button" id="show-all">全ての問題へ</button>
      </section>`;
    document.querySelector("#show-all")?.addEventListener("click", () => {
      app.mode = "all";
      elements.field.value = "all";
      elements.search.value = "";
      syncModeButtons();
      buildSession();
    });
  };

  const bindQuestionEvents = () => {
    document.querySelectorAll("[data-choice]").forEach((choice) => {
      choice.addEventListener("click", () => selectChoice(Number(choice.dataset.choice)));
    });
    document.querySelector("#submit-answer")?.addEventListener("click", submitAnswer);
    document.querySelector("#previous-question")?.addEventListener("click", () => goTo(app.position - 1));
    document.querySelector("#next-question")?.addEventListener("click", () => {
      if (app.position === app.queue.length - 1) showResults();
      else goTo(app.position + 1);
    });
  };

  const selectChoice = (originalIndex) => {
    const question = currentQuestion();
    if (!question || app.sessionAnswers[question.id]) return;
    app.pending[question.id] = originalIndex;
    renderQuestion();
  };

  const submitAnswer = () => {
    const question = currentQuestion();
    const selectedOriginal = app.pending[question?.id];
    if (!question || selectedOriginal === undefined || app.sessionAnswers[question.id]) return;
    const correct = selectedOriginal === question.answer;
    const answeredAt = new Date().toISOString();
    app.sessionAnswers[question.id] = { selectedOriginal, correct, answeredAt };
    const previous = app.store.stats[question.id] || { attempts: 0, correct: 0, incorrect: 0 };
    app.store.stats[question.id] = {
      attempts: previous.attempts + 1,
      correct: previous.correct + (correct ? 1 : 0),
      incorrect: previous.incorrect + (correct ? 0 : 1),
      lastResult: correct,
      lastSelected: selectedOriginal,
      lastAnsweredAt: answeredAt
    };
    saveStore();
    renderQuestion();
    updateSummary();
    updateModeCounts();
    requestAnimationFrame(() => document.querySelector(".feedback")?.focus({ preventScroll: true }));
  };

  const goTo = (position) => {
    if (position < 0 || position >= app.queue.length) return;
    app.showingResult = false;
    app.position = position;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateSummary = () => {
    const answers = Object.values(app.sessionAnswers);
    const correct = answers.filter((answer) => answer.correct).length;
    const wrong = answers.length - correct;
    const percent = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const circumference = 238.76;
    elements.dialValue.style.strokeDashoffset = String(circumference * (1 - percent / 100));
    elements.dialPercent.textContent = `${percent}%`;
    elements.statCorrect.textContent = correct;
    elements.statWrong.textContent = wrong;
    elements.statOpen.textContent = Math.max(app.queue.length - answers.length, 0);
  };

  const updateModeCounts = () => {
    const stats = app.store.stats;
    const wrong = questions.filter((question) => stats[question.id]?.lastResult === false).length;
    const unanswered = questions.filter((question) => !stats[question.id]).length;
    elements.countAll.textContent = questions.length;
    elements.countWrong.textContent = wrong;
    elements.countUnanswered.textContent = unanswered;
  };

  const showResults = () => {
    app.showingResult = true;
    const answers = app.sessionAnswers;
    const total = app.queue.length;
    const answered = Object.keys(answers).length;
    const correct = Object.values(answers).filter((answer) => answer.correct).length;
    const wrong = answered - correct;
    const open = total - answered;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const grouped = new Map();
    app.queue.forEach((question) => {
      const current = grouped.get(question.field) || { total: 0, correct: 0 };
      current.total += 1;
      if (answers[question.id]?.correct) current.correct += 1;
      grouped.set(question.field, current);
    });
    const fieldsHtml = [...grouped.entries()].map(([field, score]) => {
      const rate = Math.round((score.correct / score.total) * 100);
      return `<div class="field-result"><span>${escapeHtml(field)}</span><div class="field-bar"><i style="width:${rate}%"></i></div><b>${rate}%</b></div>`;
    }).join("");

    elements.stage.innerHTML = `
      <section class="result-card">
        <header class="result-hero">
          <p class="result-kicker">SESSION RESULT</p>
          <h2>${percent}%</h2>
          <div class="result-summary">
            <div><strong>${total}</strong><span>出題</span></div>
            <div><strong>${correct}</strong><span>正解</span></div>
            <div><strong>${wrong}</strong><span>不正解</span></div>
            <div><strong>${open}</strong><span>未回答</span></div>
          </div>
        </header>
        <div class="result-body">
          <h3>${app.subject === "B" ? "タグ別" : "分野別"}の正答率</h3>
          <div class="field-results">${fieldsHtml || "<p>解答データがありません。</p>"}</div>
          <div class="result-actions">
            <button class="primary-button" id="review-wrong" ${wrong === 0 ? "disabled" : ""}>間違えた問題を復習</button>
            <button class="ghost-button" id="retry-session">同じ条件でもう一度</button>
          </div>
        </div>
      </section>`;
    document.querySelector("#review-wrong")?.addEventListener("click", () => {
      app.mode = "wrong";
      elements.field.value = "all";
      elements.search.value = "";
      syncModeButtons();
      buildSession();
    });
    document.querySelector("#retry-session")?.addEventListener("click", buildSession);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const syncModeButtons = () => {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === app.mode);
    });
  };

  const syncSubjectContext = () => {
    elements.topContext.textContent = app.subject === "B"
      ? "アルゴリズム演習・情報セキュリティ除外"
      : "新出範囲ドリル";
    elements.fieldLabel.textContent = app.subject === "B" ? "タグ" : "分野";
    elements.search.placeholder = app.subject === "B"
      ? "例：二分探索、スタック"
      : "例：LLM、SBOM";
  };

  const populateFields = () => {
    const fields = [...new Set(questions.map((question) => question.field))];
    fields.sort((a, b) => app.subject === "B"
      ? SUBJECT_B_TAG_ORDER.indexOf(a) - SUBJECT_B_TAG_ORDER.indexOf(b)
      : a.localeCompare(b, "ja"));
    elements.field.innerHTML = `<option value="all">${app.subject === "B" ? "すべてのタグ" : "すべての分野"}</option>`;
    elements.field.insertAdjacentHTML("beforeend", fields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join(""));
  };

  const updateCoverage = () => {
    if (app.subject === "B") {
      const expected = 55;
      elements.coverageValue.textContent = `${questions.length} / ${expected}`;
      elements.coverageFill.style.width = `${Math.min((questions.length / expected) * 100, 100)}%`;
      elements.coverageCopy.textContent = questions.length === expected
        ? "アルゴリズム55問・セキュリティ0問"
        : `${Math.max(expected - questions.length, 0)}問が不足しています`;
      return;
    }
    const questionKeywordIds = new Set(questions.map((question) => question.keywordId));
    const covered = app.keywords.filter((keyword) => questionKeywordIds.has(keyword.id)).length;
    const total = app.keywords.length;
    const rate = total ? Math.round((covered / total) * 100) : 0;
    elements.coverageValue.textContent = `${covered} / ${total}`;
    elements.coverageFill.style.width = `${rate}%`;
    elements.coverageCopy.textContent = covered === total
      ? "台帳の全キーワードに1問以上あります"
      : `${total - covered}語が未出題です`;
  };

  const loadKeywords = async () => {
    try {
      const response = await fetch("data/keywords.json", { cache: "no-store" });
      if (!response.ok) throw new Error("keyword master unavailable");
      const data = await response.json();
      const loaded = Array.isArray(data) ? data : data.keywords;
      const extras = Array.isArray(window.FE_KEYWORDS_EXTRA) ? window.FE_KEYWORDS_EXTRA : [];
      const seen = new Set(loaded.map((keyword) => keyword.id));
      app.keywords = [...loaded, ...extras.filter((keyword) => !seen.has(keyword.id))];
    } catch (_) {
      const base = Array.isArray(window.FE_KEYWORDS_FALLBACK) ? window.FE_KEYWORDS_FALLBACK : [];
      const extras = Array.isArray(window.FE_KEYWORDS_EXTRA) ? window.FE_KEYWORDS_EXTRA : [];
      const seen = new Set(base.map((keyword) => keyword.id));
      app.keywords = [...base, ...extras.filter((keyword) => !seen.has(keyword.id))];
    }
    const supplemental = Array.isArray(window.FE_KEYWORDS_SUPPLEMENTAL) ? window.FE_KEYWORDS_SUPPLEMENTAL : [];
    app.glossaryTerms = [...app.keywords, ...supplemental];
    elements.startCountKeywords.textContent = `${app.keywords.length}語`;
    elements.startCountLibrary.textContent = `${app.keywords.length}語`;
    updateCoverage();
    renderQuestion();
  };

  const switchSubject = (subject) => {
    if (!questionBanks[subject]) return;
    app.subject = subject;
    questions = questionBanks[subject];
    app.store.activeSubject = subject;
    app.mode = "all";
    elements.search.value = "";
    populateFields();
    syncSubjectContext();
    syncModeButtons();
    updateModeCounts();
    updateCoverage();
    buildSession();
  };

  const bindGlobalEvents = () => {
    elements.startButtons.forEach((button) => {
      button.addEventListener("click", () => {
        switchSubject(button.dataset.startSubject);
        showStudyScreen();
        updateLocation();
      });
    });
    elements.home.addEventListener("click", showStartScreen);
    elements.modeList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;
      app.mode = button.dataset.mode;
      syncModeButtons();
      buildSession();
    });
    elements.applyFilter.addEventListener("click", buildSession);
    elements.search.addEventListener("keydown", (event) => {
      if (event.key === "Enter") buildSession();
    });
    [elements.shuffleQuestions, elements.shuffleChoices].forEach((control) => {
      control.addEventListener("change", () => {
        app.store.settings.shuffleQuestions = elements.shuffleQuestions.checked;
        app.store.settings.shuffleChoices = elements.shuffleChoices.checked;
        saveStore();
        buildSession();
      });
    });
    elements.finish.addEventListener("click", () => {
      if (!app.queue.length) return;
      if (app.showingResult) {
        goTo(app.position);
        return;
      }
      showResults();
    });
    elements.menu.addEventListener("click", () => {
      const open = !elements.sidebar.classList.contains("is-open");
      elements.sidebar.classList.toggle("is-open", open);
      elements.scrim.classList.toggle("is-visible", open);
      elements.menu.setAttribute("aria-expanded", String(open));
    });
    elements.scrim.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (event) => {
      const tag = event.target.tagName;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
      if (/^[1-4]$/.test(event.key) && !app.showingResult) {
        const question = currentQuestion();
        if (!question) return;
        const presented = getPresentedChoices(question);
        const choice = presented[Number(event.key) - 1];
        if (choice) selectChoice(choice.originalIndex);
      } else if (event.key === "Enter" && !app.showingResult) {
        submitAnswer();
      } else if (event.key === "ArrowLeft") {
        goTo(app.position - 1);
      } else if (event.key === "ArrowRight") {
        if (app.position === app.queue.length - 1) showResults();
        else goTo(app.position + 1);
      }
    });
  };

  const registerWebMcp = () => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportRegistrationError = () => {};

    const register = (tool) => {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(reportRegistrationError);
      } catch (_) {
        reportRegistrationError();
      }
    };

    register({
      name: "start_fe_study_session",
      title: "学習セッションを開始",
      description: "表示中の基本情報技術者問題集で、モードと絞り込み、シャッフル設定を反映して新しい学習セッションを開始します。",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", enum: ["A", "B"] },
          mode: { type: "string", enum: ["all", "wrong", "unanswered"] },
          field: { type: "string", description: "科目Aの分野名又は科目Bのタグ名。省略時は全件。" },
          keyword: { type: "string", description: "対象キーワードの部分一致検索。" },
          shuffleQuestions: { type: "boolean" },
          shuffleChoices: { type: "boolean" }
        },
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input = {}) {
        const allowedModes = new Set(["all", "wrong", "unanswered"]);
        if (input.mode !== undefined && !allowedModes.has(input.mode)) throw new TypeError("modeが不正です");
        if (input.subject !== undefined && !questionBanks[input.subject]) throw new TypeError("subjectが不正です");
        if (input.subject && input.subject !== app.subject) {
          app.subject = input.subject;
          questions = questionBanks[input.subject];
          app.store.activeSubject = input.subject;
          populateFields();
          syncSubjectContext();
          updateModeCounts();
          updateCoverage();
        }
        showStudyScreen();
        const fieldValues = [...elements.field.options].map((option) => option.value);
        const requestedField = input.field || "all";
        if (!fieldValues.includes(requestedField)) throw new RangeError("存在しない分野又はタグです");
        app.mode = input.mode || "all";
        elements.field.value = requestedField;
        elements.search.value = typeof input.keyword === "string" ? input.keyword.trim() : "";
        if (typeof input.shuffleQuestions === "boolean") app.store.settings.shuffleQuestions = input.shuffleQuestions;
        if (typeof input.shuffleChoices === "boolean") app.store.settings.shuffleChoices = input.shuffleChoices;
        elements.shuffleQuestions.checked = app.store.settings.shuffleQuestions;
        elements.shuffleChoices.checked = app.store.settings.shuffleChoices;
        syncModeButtons();
        buildSession();
        return {
          status: "started",
          subject: app.subject,
          mode: app.mode,
          field: elements.field.value,
          totalQuestions: app.queue.length,
          currentQuestionId: currentQuestion()?.id || null
        };
      }
    });

    register({
      name: "answer_current_fe_question",
      title: "現在の問題に回答",
      description: "画面に表示されている問題へ、表示順の1〜4で回答し、同じ画面に正誤と解説を表示します。",
      inputSchema: {
        type: "object",
        properties: {
          choice: { type: "integer", minimum: 1, maximum: 4 }
        },
        required: ["choice"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!Number.isInteger(input?.choice) || input.choice < 1 || input.choice > 4) throw new RangeError("choiceは1〜4の整数で指定してください");
        const question = currentQuestion();
        if (!question || app.showingResult) throw new Error("回答できる問題が表示されていません");
        if (app.sessionAnswers[question.id]) throw new Error("この問題は回答済みです");
        const presented = getPresentedChoices(question);
        const selected = presented[input.choice - 1];
        selectChoice(selected.originalIndex);
        submitAnswer();
        const result = app.sessionAnswers[question.id];
        const correctPosition = presented.findIndex((choice) => choice.originalIndex === question.answer) + 1;
        return {
          status: "answered",
          questionId: question.id,
          keyword: question.keyword,
          correct: result.correct,
          correctChoice: correctPosition
        };
      }
    });
  };

  const initialize = async () => {
    const params = new URLSearchParams(window.location.search);
    const requestedSubject = params.get("subject");
    app.subject = questionBanks[requestedSubject]
      ? requestedSubject
      : (questionBanks[app.store.activeSubject] ? app.store.activeSubject : "A");
    questions = questionBanks[app.subject];
    elements.startCountA.textContent = `${questionBanks.A.length}問`;
    elements.startCountB.textContent = `${questionBanks.B.length}問`;
    elements.startCountKeywords.textContent = `${questionBanks.A.length}語`;
    elements.startCountLibrary.textContent = `${questionBanks.A.length}語`;
    elements.shuffleQuestions.checked = app.store.settings.shuffleQuestions;
    elements.shuffleChoices.checked = app.store.settings.shuffleChoices;
    populateFields();
    if (requestedSubject && params.get("keyword")) {
      elements.search.value = params.get("keyword").trim();
    }
    syncSubjectContext();
    bindGlobalEvents();
    updateModeCounts();
    buildSession();
    await loadKeywords();
    registerWebMcp();
    if (questionBanks[requestedSubject]) showStudyScreen();
    else showStartScreen();
  };

  initialize();
})();
