(() => {
  "use strict";

  const PAGE_SIZE = 24;
  const questions = [
    ...(Array.isArray(window.FE_QUESTIONS) ? window.FE_QUESTIONS : []),
    ...(Array.isArray(window.FE_QUESTIONS_EXTRA) ? window.FE_QUESTIONS_EXTRA : [])
  ];
  const questionByKeyword = new Map(questions.map((question) => [question.keywordId, question]));

  const elements = {
    grid: document.querySelector("#keyword-grid"),
    search: document.querySelector("#library-search"),
    version: document.querySelector("#library-version"),
    field: document.querySelector("#library-field"),
    reset: document.querySelector("#library-reset"),
    more: document.querySelector("#library-more"),
    moreWrap: document.querySelector("#library-more-wrap"),
    total: document.querySelector("#library-total"),
    covered: document.querySelector("#library-covered"),
    verified: document.querySelector("#library-verified"),
    resultCount: document.querySelector("#library-result-count")
  };

  const state = { keywords: [], filtered: [], visible: PAGE_SIZE };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const officialSourceUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "www.ipa.go.jp" ? url.href : "#";
    } catch (_) {
      return "#";
    }
  };

  const fallbackKeywords = () => {
    const base = Array.isArray(window.FE_KEYWORDS_FALLBACK) ? window.FE_KEYWORDS_FALLBACK : [];
    const extras = Array.isArray(window.FE_KEYWORDS_EXTRA) ? window.FE_KEYWORDS_EXTRA : [];
    const seen = new Set(base.map((keyword) => keyword.id));
    return [...base, ...extras.filter((keyword) => !seen.has(keyword.id))];
  };

  const loadKeywords = async () => {
    try {
      const response = await fetch("data/keywords.json", { cache: "no-store" });
      if (!response.ok) throw new Error("keyword master unavailable");
      const data = await response.json();
      const loaded = Array.isArray(data) ? data : data.keywords;
      if (!Array.isArray(loaded)) throw new TypeError("invalid keyword master");
      return loaded;
    } catch (_) {
      return fallbackKeywords();
    }
  };

  const renderOptions = () => {
    const versions = [...new Set(state.keywords.map((keyword) => keyword.version))]
      .sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));
    const fields = [...new Set(state.keywords.map((keyword) => keyword.field))]
      .sort((a, b) => a.localeCompare(b, "ja"));
    elements.version.insertAdjacentHTML("beforeend", versions.map((version) => `<option value="${escapeHtml(version)}">Ver.${escapeHtml(version)}</option>`).join(""));
    elements.field.insertAdjacentHTML("beforeend", fields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join(""));
  };

  const definitionFor = (keyword) => {
    const question = questionByKeyword.get(keyword.id);
    return keyword.definition || question?.explanation || `${keyword.keyword}は、基本情報技術者試験シラバスの「${keyword.subField}」に追加・変更された用語です。`;
  };

  const cardHtml = (keyword) => {
    const question = questionByKeyword.get(keyword.id);
    const sourceUrl = officialSourceUrl(keyword.sourceUrl);
    const practiceUrl = `index.html?subject=A&keyword=${encodeURIComponent(keyword.keyword)}`;
    return `
      <article class="keyword-card-item">
        <header class="keyword-card-head">
          <span class="keyword-id">${escapeHtml(keyword.id)}</span>
          <span class="keyword-badges">
            <span class="keyword-badge">${keyword.supplemental ? "補足" : `Ver.${escapeHtml(keyword.version)}`}</span>
            <span class="keyword-badge ${keyword.supplemental ? "is-supplemental" : "is-change"}">${escapeHtml(keyword.changeType)}</span>
          </span>
        </header>
        <h2>${escapeHtml(keyword.keyword)}</h2>
        <p class="keyword-path">${escapeHtml(keyword.field)} ／ ${escapeHtml(keyword.subField)}</p>
        <p class="keyword-definition">${escapeHtml(definitionFor(keyword))}</p>
        <footer class="keyword-card-footer">
          <div class="keyword-source">
            <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(keyword.source)}</a><br />
            ${keyword.sourcePage ? `PDF p.${escapeHtml(keyword.sourcePage)} ／ ` : ""}${keyword.supplemental ? "関連用語（補足）" : (keyword.verified ? "IPA出典確認済み" : "確認中")}
          </div>
          ${question ? `<a class="keyword-practice" href="${escapeHtml(practiceUrl)}">この用語を解く →</a>` : ""}
        </footer>
      </article>`;
  };

  const render = () => {
    const visible = state.filtered.slice(0, state.visible);
    elements.resultCount.textContent = state.filtered.length;
    if (!visible.length) {
      elements.grid.innerHTML = '<section class="library-empty"><h2>該当する用語がありません</h2><p>検索語または絞り込み条件を変更してください。</p></section>';
    } else {
      elements.grid.innerHTML = visible.map(cardHtml).join("");
    }
    const hasMore = visible.length < state.filtered.length;
    elements.moreWrap.hidden = !hasMore;
    if (hasMore) elements.more.textContent = `さらに表示（残り${state.filtered.length - visible.length}件）`;
  };

  const applyFilters = () => {
    const query = elements.search.value.trim().toLocaleLowerCase("ja-JP");
    const version = elements.version.value;
    const field = elements.field.value;
    state.filtered = state.keywords.filter((keyword) => {
      const question = questionByKeyword.get(keyword.id);
      const haystack = `${keyword.keyword} ${keyword.field} ${keyword.subField} ${definitionFor(keyword)} ${question?.question || ""}`.toLocaleLowerCase("ja-JP");
      return (version === "all" || keyword.version === version)
        && (field === "all" || keyword.field === field)
        && (!query || haystack.includes(query));
    });
    state.visible = PAGE_SIZE;
    render();
  };

  const bindEvents = () => {
    elements.search.addEventListener("input", applyFilters);
    elements.version.addEventListener("change", applyFilters);
    elements.field.addEventListener("change", applyFilters);
    elements.reset.addEventListener("click", () => {
      elements.search.value = "";
      elements.version.value = "all";
      elements.field.value = "all";
      applyFilters();
      elements.search.focus();
    });
    elements.more.addEventListener("click", () => {
      state.visible += PAGE_SIZE;
      render();
    });
  };

  const initialize = async () => {
    const officialKeywords = await loadKeywords();
    const supplemental = Array.isArray(window.FE_KEYWORDS_SUPPLEMENTAL) ? window.FE_KEYWORDS_SUPPLEMENTAL : [];
    state.keywords = [...officialKeywords, ...supplemental]
      .sort((a, b) => a.id.localeCompare(b.id, "ja", { numeric: true }));
    state.filtered = [...state.keywords];
    const official = state.keywords.filter((keyword) => !keyword.supplemental);
    const covered = official.filter((keyword) => questionByKeyword.has(keyword.id)).length;
    const verified = official.filter((keyword) => keyword.verified).length;
    elements.total.textContent = `${official.length}語（補足${state.keywords.length - official.length}語）`;
    elements.covered.textContent = `${covered} / ${official.length}`;
    elements.verified.textContent = `${verified} / ${official.length}`;
    renderOptions();
    bindEvents();
    const requestedTerm = new URLSearchParams(window.location.search).get("term");
    if (requestedTerm) elements.search.value = requestedTerm;
    if (requestedTerm) applyFilters();
    render();
  };

  initialize();
})();
