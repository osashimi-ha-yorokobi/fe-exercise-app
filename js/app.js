(() => {
  'use strict';

  const STORAGE_KEY = 'fe-kotoba-note-v1';
  const PAGE_SIZE = 60;
  const main = document.getElementById('app-main');
  const header = document.getElementById('app-header');
  const nav = document.getElementById('bottom-nav');
  const toastEl = document.getElementById('toast');

  const state = {
    data: null, baseData: null, entries: [], byId: new Map(),
    screen: 'genres', selectedCategories: [], newSyllabusOnly: false, detail: null,
    detailOrigin: 'list', detailScroll: 0,
    studyDeck: [], studyIndex: 0, flipped: false, shuffled: false, studyOrigin: 'genres',
    query: '', section: 'all', filter: 'all', checkedScope: 'all', shown: PAGE_SIZE,
    searchQuery: '', searchScope: 'all', searchCheckedOnly: false, searchNewOnly: false, searchShown: PAGE_SIZE,
    checkedQuery: '', checkedShown: PAGE_SIZE,
    store: loadStore(), toastTimer: null
  };

  function defaultStore() {
    return { version: 1, activeProfileId: 'default', profiles: [{ id: 'default', name: '自分用', createdAt: new Date().toISOString(), flags: {}, notes: {}, history: [], customTerms: [] }] };
  }

  function loadStore() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (value?.version === 1 && Array.isArray(value.profiles) && value.profiles.length) {
        for (const profile of value.profiles) {
          if (!profile.flags || typeof profile.flags !== 'object') profile.flags = {};
          if (!Array.isArray(profile.history)) profile.history = [];
          if (!profile.notes || typeof profile.notes !== 'object') profile.notes = {};
          if (!Array.isArray(profile.customTerms)) profile.customTerms = [];
        }
        if (!value.profiles.some(p => p.id === value.activeProfileId)) value.activeProfileId = value.profiles[0].id;
        return value;
      }
    } catch (_) { /* Damaged browser data is replaced with a fresh local profile. */ }
    return defaultStore();
  }

  const profile = () => state.store.profiles.find(p => p.id === state.store.activeProfileId);
  const isChecked = id => Boolean(profile().flags[id]);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)).replace(/\s+/g, '');
  const formatDate = value => { try { return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); } catch { return ''; } };
  const matchesSyllabus = term => !state.newSyllabusOnly || Boolean(term.addedInVersion);
  const countCategory = category => category.sections.reduce((sum, section) => sum + section.terms.filter(matchesSyllabus).length, 0);
  const checkedCategory = category => category.sections.reduce((sum, section) => sum + section.terms.filter(term => matchesSyllabus(term) && isChecked(term.id)).length, 0);
  const checkedCount = () => state.entries.filter(entry => isChecked(entry.id)).length;
  const selectedCategories = () => state.data.categories.filter(c => state.selectedCategories.includes(c.id));
  const selectedEntries = () => state.entries.filter(e => state.selectedCategories.includes(e.categoryId) && matchesSyllabus(e));
  const addedLabel = entry => entry.addedInVersion ? `<span class="added-tag">Ver.${escapeHTML(entry.addedInVersion)}追加</span>` : '';
  const processContexts = {
    'A/D変換': 'アナログ信号をデジタルデータに変える処理',
    'コンパイラ理論': 'コンパイラがプログラムを変換する流れの用語',
    '自然言語処理': '自然言語処理で文章を扱うときの用語',
    'プロセスの状態遷移': 'OSがプロセスの実行を管理するときの状態',
    'OSI参照モデル': 'ネットワーク通信の役割を分けたモデルの層',
    'プロダクトライフサイクル': '製品が市場に出てから売れ方が変わる流れの用語',
    'ISMSの運用と改善': '情報セキュリティを管理する活動',
    'スクラムの進め方': 'スクラムで開発を進めるときの用語'
  };
  const processContext = entry => processContexts[entry.sectionName] || `${entry.categoryName}の${entry.sectionName}に関する用語`;
  function legacyUrlId(value) {
    let hash = 0xcbf29ce484222325n;
    for (let i = 0; i < value.length; i++) {
      hash ^= BigInt(value.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 0x100000001b3n);
    }
    return `t-${hash.toString(16).padStart(16, '0')}`;
  }

  function saveStore() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store)); return true; }
    catch { return false; }
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function migrateProfileData(savedProfile) {
    const renamedTerms = {
      Pacal: 'Pascal',
      サポートベクターマシン: 'サポートベクトルマシン',
      ストップワードビット: 'ストップビット',
      ガーベジコレクション: 'ガベージコレクション',
      モーションキャプチャー: 'モーションキャプチャ',
      フロントエンドフレーム: 'フロントエンドフレームワーク'
    };
    const byName = new Map();
    for (const entry of state.entries) {
      if (!byName.has(entry.name)) byName.set(entry.name, []);
      byName.get(entry.name).push(entry);
    }
    for (const field of ['flags', 'notes']) {
      if (!savedProfile[field] || typeof savedProfile[field] !== 'object') savedProfile[field] = {};
      const values = savedProfile[field];
      for (const [oldKey, value] of Object.entries(values)) {
        if (state.byId.has(oldKey) || savedProfile.customTerms?.some(term => term.id === oldKey)) continue;
        if (/^https?:\/\//.test(oldKey)) {
          const id = legacyUrlId(oldKey);
          if (state.byId.has(id) && values[id] === undefined) values[id] = value;
          delete values[oldKey];
          continue;
        }
        const name = renamedTerms[oldKey] || oldKey;
        for (const entry of byName.get(name) || []) if (values[entry.id] === undefined) values[entry.id] = value;
        delete values[oldKey];
      }
    }
    for (const item of savedProfile.history || []) {
      if (typeof item.id === 'string' && /^https?:\/\//.test(item.id)) item.id = legacyUrlId(item.id);
    }
  }

  function prepareData(data) {
    if (!Array.isArray(data.categories) || !data.categories.length) throw new Error('用語データの形式が正しくありません');
    state.baseData = data;
    refreshEntries();
    for (const savedProfile of state.store.profiles) migrateProfileData(savedProfile);
    saveStore();
  }

  function refreshEntries() {
    const data = JSON.parse(JSON.stringify(state.baseData));
    state.data = data;
    state.entries = [];
    state.byId = new Map();
    for (const category of data.categories) {
      for (const section of category.sections) {
        for (const term of section.terms) {
          const entry = { id: term.id, name: term.name, reading: term.reading || '', english: term.english || '', description: window.FE_DESCRIPTIONS?.[term.id] || '', addedInVersion: term.addedInVersion || '', categoryId: category.id, categoryName: category.name, sectionName: section.name };
          state.entries.push(entry);
          state.byId.set(term.id, entry);
        }
      }
    }
  }

  function renderHeader() {
    header.innerHTML = `<div class="brand"><span class="brand-mark">FE</span><span class="brand-title">ことばノート</span></div><span class="header-note">単語帳</span>`;
  }

  function renderNav() {
    const focusedView = state.screen === 'detail' || state.screen === 'study';
    nav.hidden = focusedView;
    if (focusedView) { nav.innerHTML = ''; return; }
    const items = [ ['genres', '▦', 'ジャンル'], ['search', '⌕', '検索'], ['checked', '☑', 'チェック済み'], ['records', '◷', '記録'] ];
    nav.innerHTML = items.map(([id, icon, label]) => { const active = state.screen === id || (state.screen === 'list' && id === 'genres'); return `<button class="nav-button ${active ? 'active' : ''}" type="button" data-action="nav" data-screen="${id}" ${active ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}${id === 'checked' && checkedCount() ? `<span class="nav-count">${checkedCount()}</span>` : ''}</span><span>${label}</span></button>`; }).join('');
  }

  function render() {
    renderHeader();
    renderNav();
    main.classList.toggle('genre-mode', state.screen === 'genres');
    main.classList.toggle('deck-mode', state.screen === 'search' || state.screen === 'checked');
    if (!state.data) return;
    if (state.screen === 'genres') renderGenres();
    if (state.screen === 'list') renderList();
    if (state.screen === 'search') renderSearch();
    if (state.screen === 'detail') renderDetail();
    if (state.screen === 'checked') renderChecked();
    if (state.screen === 'records') renderRecords();
    if (state.screen === 'study') renderStudy();
  }

  function go(screen, resetScroll = true) {
    state.screen = screen;
    render();
    if (resetScroll) window.scrollTo(0, 0);
  }

  function renderGenres() {
    const selectedCount = selectedEntries().length;
    const addedCount = state.entries.filter(entry => entry.addedInVersion).length;
    const groups = [
      ['テクノロジ系', state.data.categories.filter(c => c.id <= 13)],
      ['マネジメント系', state.data.categories.filter(c => c.id >= 14 && c.id <= 16)],
      ['ストラテジ系', state.data.categories.filter(c => c.id >= 17)]
    ];
    main.innerHTML = `
      <div class="page-head"><h1>単語帳をつくる</h1><p>ジャンルを選んで、そのまま学習。</p></div>
      <form id="home-search-form" class="home-search"><label for="home-search">キーワードで用語を探す</label><div><input id="home-search" type="search" placeholder="用語・読み・意味" autocomplete="off" enterkeyhint="search"><button type="submit" aria-label="全用語を検索する">検索</button></div></form>
      ${checkedCount() ? `<button class="review-shortcut" type="button" data-action="nav" data-screen="checked"><span>☑ チェック済みの${checkedCount()}語を復習</span><span aria-hidden="true">→</span></button>` : ''}
      <div class="syllabus-picker"><button class="syllabus-toggle ${state.newSyllabusOnly ? 'active' : ''}" type="button" data-action="toggle-new-syllabus" aria-pressed="${state.newSyllabusOnly}"><span>新シラバスのみ</span><span class="syllabus-switch" aria-hidden="true">${state.newSyllabusOnly ? 'ON' : 'OFF'}</span></button><p>Ver.9.0以降の追加語・全${addedCount}語</p></div>
      <div class="genre-selection-tools"><span>ジャンル（複数選択）</span><div><button type="button" data-action="select-all-categories">全選択</button><button type="button" data-action="clear-categories" ${state.selectedCategories.length ? '' : 'disabled'}>解除</button></div></div>
      <p class="genre-selection-summary" role="status">${state.selectedCategories.length ? `選択中：${escapeHTML(selectedCategories().slice(0, 2).map(category => category.name).join('・'))}${state.selectedCategories.length > 2 ? ` ほか${state.selectedCategories.length - 2}ジャンル` : ''}` : '見たいジャンルを選んでください。'}</p>
      ${groups.map(([title, categories]) => `<section><div class="section-title"><h2>${title}</h2><span>${categories.length}ジャンル</span></div><ul class="genre-list">${categories.map(c => { const selected = state.selectedCategories.includes(c.id); const count = countCategory(c); return `<li class="genre-item"><button class="genre-button ${selected ? 'selected' : ''}" type="button" data-action="toggle-category" data-id="${c.id}" aria-pressed="${selected}" ${count ? '' : 'disabled'}><span class="genre-number">${String(c.id).padStart(2, '0')}</span><span class="genre-main"><span class="genre-name">${escapeHTML(c.name)}</span><span class="genre-count">${count ? `${count}語` : '追加語なし'}${checkedCategory(c) ? ` · ${checkedCategory(c)}件チェック` : ''}</span></span><span class="genre-choice" aria-hidden="true">${selected ? '✓' : ''}</span></button></li>`; }).join('')}</ul></section>`).join('')}
      <p class="footer-note">IPAのシラバスVer.9.2と公開問題を基準に用語を選んでいます。説明・例はこの単語帳で独自に作成しています。<br><a href="./sources.html">参照資料・収録方針を見る →</a></p>
      <div class="selection-bar"><p>${selectedCount ? `${state.selectedCategories.length}ジャンル · ${selectedCount}語を選択中${state.newSyllabusOnly ? '（追加語のみ）' : ''}` : 'ジャンルを選んでください'}</p><div class="selection-actions"><button class="shuffle-picker ${state.shuffled ? 'active' : ''}" type="button" data-action="shuffle-study" aria-pressed="${state.shuffled}" aria-label="シャッフルして表示">⇄ シャッフル <span>${state.shuffled ? 'ON' : 'OFF'}</span></button><button class="primary-button" type="button" data-action="start-study" ${selectedCount ? '' : 'disabled'}>単語帳を開く →</button></div></div>`;
  }

  function renderFilters(forChecked = false) {
    if (forChecked) return `<div class="filters"><select class="filter-select" id="checked-scope" aria-label="表示するジャンル"><option value="all">すべてのジャンル</option>${state.data.categories.map(c => `<option value="${c.id}" ${String(state.checkedScope) === String(c.id) ? 'selected' : ''}>${escapeHTML(c.name)}</option>`).join('')}</select></div>`;
    const categories = selectedCategories();
    return `<div class="filters"><select class="filter-select" id="section-filter" aria-label="小分類を選ぶ"><option value="all">すべての小分類</option>${categories.flatMap(c => c.sections.map((s, i) => `<option value="${c.id}:${i}" ${state.section === `${c.id}:${i}` ? 'selected' : ''}>${escapeHTML(categories.length > 1 ? `${c.name} · ${s.name}` : s.name)}</option>`)).join('')}</select><button class="filter-chip ${state.filter === 'checked' ? 'active' : ''}" type="button" data-action="toggle-list-filter" aria-pressed="${state.filter === 'checked'}">チェック済み</button></div>`;
  }

  function renderList() {
    const categories = selectedCategories();
    if (!categories.length) { go('genres'); return; }
    const title = categories.length === 1 ? categories[0].name : `選んだ${categories.length}ジャンル`;
    const count = categories.reduce((sum, category) => sum + countCategory(category), 0);
    main.innerHTML = `<div class="page-head"><button class="back-link" type="button" data-action="return-study"><span aria-hidden="true">‹</span> カードに戻る</button><div class="list-heading"><h1>${escapeHTML(title)}の一覧</h1><span class="count-badge">${count}語</span></div><p>用語を探したり、チェックを付けたりできます。</p></div><label class="search-box"><span aria-hidden="true">⌕</span><input id="search-input" type="search" autocomplete="off" placeholder="選んだジャンルの用語を検索" aria-label="用語を検索" value="${escapeHTML(state.query)}"></label>${renderFilters()}<div id="results"></div>`;
    renderListResults();
  }

  function termRow(entry, preview = false) {
    const checked = isChecked(entry.id);
    const full = state.byId.get(entry.id) || entry;
    const context = preview || state.screen === 'checked' ? full.categoryName : state.selectedCategories.length > 1 ? entry.categoryName : entry.sectionName;
    const snippet = preview ? `<span class="word-preview">${escapeHTML((full.description || '意味はまだ入力されていません。').replace(/\s+/g, ' ').slice(0, 120))}</span>` : '';
    return `<li class="word-item"><button class="word-open" type="button" data-action="open-term" data-key="${escapeHTML(entry.id)}"><span class="word-name">${escapeHTML(entry.name)}</span>${addedLabel(entry)}<span class="word-sub">${escapeHTML([entry.reading, context].filter(Boolean).join(' · '))}</span>${snippet}</button><button class="check-button ${checked ? 'checked' : ''}" type="button" data-action="check" data-key="${escapeHTML(entry.id)}" aria-label="${escapeHTML(entry.name)}を${checked ? 'チェックから外す' : '分からないとしてチェックする'}" aria-pressed="${checked}"><span class="check-symbol" aria-hidden="true">${checked ? '✓' : ''}</span><span>${checked ? 'チェック済み' : '分からない'}</span></button></li>`;
  }

  const keywordTokens = query => String(query).normalize('NFKC').trim().split(/\s+/).filter(Boolean).map(normalize);
  function keywordMatches(entry, query) {
    const text = [entry.name, entry.reading, entry.english, entry.description, entry.categoryName].map(value => normalize(value || ''));
    return keywordTokens(query).every(token => text.some(value => value.includes(token)));
  }

  function searchEntries() {
    const tokens = keywordTokens(state.searchQuery);
    const entries = state.entries.filter(entry => (state.searchScope === 'all' || entry.categoryId === Number(state.searchScope)) && (!state.searchCheckedOnly || isChecked(entry.id)) && (!state.searchNewOnly || entry.addedInVersion) && keywordMatches(entry, state.searchQuery));
    const relevance = entry => tokens.reduce((score, token) => score + (normalize(entry.name) === token ? 100 : normalize(entry.english) === token ? 90 : normalize(entry.name).startsWith(token) ? 70 : normalize(entry.name).includes(token) ? 50 : normalize(entry.reading).includes(token) ? 40 : 10), 0);
    return tokens.length ? entries.sort((a, b) => relevance(b) - relevance(a)) : entries;
  }

  function checkedEntries() {
    return state.entries.filter(entry => isChecked(entry.id) && (state.checkedScope === 'all' || entry.categoryId === Number(state.checkedScope)) && keywordMatches(entry, state.checkedQuery));
  }

  function searchBox(id, value, placeholder, action) {
    return `<div class="keyword-box"><span aria-hidden="true">⌕</span><input id="${id}" type="search" value="${escapeHTML(value)}" placeholder="${escapeHTML(placeholder)}" aria-label="${escapeHTML(placeholder)}" autocomplete="off" enterkeyhint="search"><button class="clear-keyword" type="button" data-action="${action}" aria-label="検索語を消す" ${value ? '' : 'hidden'}>×</button></div>`;
  }

  function deckActions(count, action, checked = false) {
    return `<p class="deck-selection-note" role="status">${checked ? 'チェック済み' : '検索結果'} ${count}語で単語帳を作成</p><div class="selection-actions"><button class="shuffle-picker ${state.shuffled ? 'active' : ''}" type="button" data-action="shuffle-study" aria-pressed="${state.shuffled}">⇄ シャッフル <span>${state.shuffled ? 'ON' : 'OFF'}</span></button><button class="primary-button ${checked ? 'checked-study-button' : ''}" type="button" data-action="${action}" ${count ? '' : 'disabled'}>${checked ? 'チェック済みで復習' : '検索結果で単語帳'} →</button></div>`;
  }

  function renderSearch() {
    main.innerHTML = `<div class="page-head compact-page-head"><h1>用語を検索</h1><p>用語名・読み・英語・説明から探せます。</p></div><section class="search-controls">${searchBox('global-search', state.searchQuery, '例：RFID、暗号化、でぃーらむ', 'clear-search')}<div class="filters"><select class="filter-select" id="search-scope" aria-label="検索するジャンル"><option value="all">すべてのジャンル</option>${state.data.categories.map(category => `<option value="${category.id}" ${String(state.searchScope) === String(category.id) ? 'selected' : ''}>${escapeHTML(category.name)}</option>`).join('')}</select></div><div class="search-chips"><button class="filter-chip ${state.searchCheckedOnly ? 'active' : ''}" type="button" data-action="search-checked-only" aria-pressed="${state.searchCheckedOnly}">☑ チェック済みのみ</button><button class="filter-chip ${state.searchNewOnly ? 'active' : ''}" type="button" data-action="search-new-only" aria-pressed="${state.searchNewOnly}">新シラバスのみ</button></div></section><div id="search-results"></div><div class="selection-bar" id="search-deck-actions"></div>`;
    renderSearchResults();
  }

  function renderSearchResults() {
    const entries = searchEntries();
    const visible = entries.slice(0, state.searchShown);
    document.getElementById('search-results').innerHTML = `<p class="result-count" role="status">${entries.length}語${entries.length > visible.length ? ` · ${visible.length}語を表示` : ''}</p>${entries.length ? `<ul class="word-list">${visible.map(entry => termRow(entry, true)).join('')}</ul>${entries.length > visible.length ? '<button class="more-button" type="button" data-action="more-search">もっと見る</button>' : ''}` : '<div class="empty"><strong>用語が見つかりませんでした</strong><p>短いキーワードにするか、ジャンルや絞り込みを変更してください。</p><button class="outline-button" type="button" data-action="reset-search">絞り込みを解除</button></div>'}`;
    document.getElementById('search-deck-actions').innerHTML = deckActions(entries.length, 'study-search');
    const clear = main.querySelector('[data-action=clear-search]');
    if (clear) clear.hidden = !state.searchQuery;
  }

  function renderListResults() {
    const container = document.getElementById('results');
    if (!container) return;
    const categories = selectedCategories();
    const groups = categories.flatMap(category => category.sections.map((section, index) => ({ category, section, terms: section.terms.filter(term => matchesSyllabus(term) && (state.section === 'all' || state.section === `${category.id}:${index}`) && (state.filter !== 'checked' || isChecked(term.id)) && keywordMatches(state.byId.get(term.id) || term, state.query)).map(term => ({ ...term, categoryName: category.name, sectionName: section.name })) }))).filter(group => group.terms.length);
    const total = groups.reduce((sum, g) => sum + g.terms.length, 0);
    let remaining = state.shown;
    const html = groups.map(group => {
      const visible = group.terms.slice(0, Math.max(remaining, 0));
      remaining -= visible.length;
      if (!visible.length) return '';
      return `<section class="word-group"><h2>${escapeHTML(categories.length > 1 ? `${group.category.name} · ${group.section.name}` : group.section.name)} <span>${group.terms.length}語</span></h2><ul class="word-list">${visible.map(entry => termRow(entry)).join('')}</ul></section>`;
    }).join('');
    container.innerHTML = `<p class="result-count">${total}語を表示${total > state.shown ? ` ・ 最初の${state.shown}語` : ''}</p>${total ? html : `<div class="empty"><div class="empty-symbol" aria-hidden="true">⌕</div><strong>用語が見つかりませんでした</strong><p>検索語や小分類を変えてみてください。</p></div>`}${total > state.shown ? `<button class="more-button" type="button" data-action="more">もっと見る（残り${total - state.shown}語）</button>` : ''}`;
  }

  function openTerm(id) {
    const entry = state.byId.get(id);
    if (!entry) return;
    state.detail = entry;
    state.detailOrigin = state.screen;
    state.detailScroll = window.scrollY;
    go('detail');
  }

  function renderDetail() {
    const entry = state.detail;
    if (!entry) { go('genres'); return; }
    const checked = isChecked(entry.id);
    const backLabel = state.detailOrigin === 'search' ? '検索結果に戻る' : state.detailOrigin === 'checked' ? 'チェック済みに戻る' : '一覧に戻る';
    main.innerHTML = `<div class="detail-wrap"><button class="back-link" type="button" data-action="back-detail"><span aria-hidden="true">‹</span> ${backLabel}</button><article class="detail-card"><span class="tag">${escapeHTML(entry.categoryName)}</span>${addedLabel(entry)}<h1>${escapeHTML(entry.name)}</h1><p class="detail-category">${escapeHTML(entry.sectionName)}</p>${entry.reading ? `<div class="term-meta"><span>読み</span><strong>${escapeHTML(entry.reading)}</strong></div>` : ''}${entry.english ? `<div class="term-meta"><span>英語</span><strong>${escapeHTML(entry.english)}</strong></div>` : ''}<div class="detail-divider"></div><p class="detail-label">用語の説明</p><p class="detail-copy"></p></article></div><div class="detail-footer"><button class="outline-button" type="button" data-action="back-detail">戻る</button><button class="primary-button ${checked ? 'is-checked' : ''}" type="button" data-action="check" data-key="${escapeHTML(entry.id)}" aria-pressed="${checked}">${checked ? '✓ チェックを外す' : '□ 分からないのでチェック'}</button></div>`;
    main.querySelector('.detail-copy').textContent = entry.description || 'この用語の説明はまだ収録されていません。';
  }

  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function startStudy(entries = selectedEntries(), origin = 'genres') {
    if (!entries.length) { toast('表示する用語がありません'); return; }
    state.studyDeck = [...entries];
    if (state.shuffled) shuffle(state.studyDeck);
    state.studyIndex = 0;
    state.flipped = false;
    state.studyOrigin = origin;
    go('study');
  }

  function moveStudy(direction) {
    const next = state.studyIndex + direction;
    if (next < 0 || next >= state.studyDeck.length) return;
    state.studyIndex = next;
    state.flipped = false;
    renderStudy();
    window.scrollTo(0, 0);
  }

  function advanceStudy() {
    if (state.studyIndex === state.studyDeck.length - 1) { toast('最後の用語です'); return; }
    moveStudy(1);
  }

  function renderStudy() {
    const entry = state.studyDeck[state.studyIndex];
    if (!entry) { go('genres'); return; }
    const checked = isChecked(entry.id);
    const note = profile().notes?.[entry.id] || '';
    const progress = Math.round((state.studyIndex + 1) / state.studyDeck.length * 100);
    main.innerHTML = `<div class="study-top"><button class="back-link" type="button" data-action="back-study"><span aria-hidden="true">‹</span> ${state.studyOrigin === 'checked' ? 'チェック済みに戻る' : state.studyOrigin === 'search' ? '検索結果に戻る' : 'ジャンルを選び直す'}</button>${state.studyOrigin !== 'genres' ? '' : '<button class="study-list-link" type="button" data-action="start-list">一覧</button>'}</div><div class="study-progress"><span>${state.studyIndex + 1} / ${state.studyDeck.length} 語</span></div><div class="progress-track"><div style="width:${progress}%"></div></div><p class="study-section">${escapeHTML(entry.categoryName)} · ${escapeHTML(entry.sectionName)}</p><article class="flashcard ${state.flipped ? 'is-back' : ''}" aria-label="${state.flipped ? 'カードの裏面。タップすると次の用語へ進みます' : 'カードの表面'}" ${state.flipped ? 'role="button" tabindex="0"' : ''}><span class="card-side">${state.flipped ? '裏面' : '表面'}</span>${addedLabel(entry)}${state.flipped ? `<h1>${escapeHTML(entry.name)}</h1><div class="card-info">${entry.reading ? `<div><span>読み</span><strong>${escapeHTML(entry.reading)}</strong></div>` : ''}${entry.english ? `<div><span>英語</span><strong>${escapeHTML(entry.english)}</strong></div>` : ''}</div><div class="card-note"><label for="study-note">自分用の説明メモ</label><textarea id="study-note" rows="3" maxlength="500" placeholder="意味を自分の言葉でメモできます">${escapeHTML(note)}</textarea><span>この端末に保存されます</span></div><span class="card-next-hint">${state.studyIndex < state.studyDeck.length - 1 ? 'カードをタップして次の用語へ →' : '最後の用語です'}</span>` : `<button class="card-face" type="button" data-action="flip-card"><span class="card-context">${escapeHTML(processContext(entry))}</span><span class="card-term">${escapeHTML(entry.name)}</span><span class="card-hint">タップして説明を見る ↻</span></button>`}</article><button class="study-check ${checked ? 'checked' : ''}" type="button" data-action="check" data-key="${escapeHTML(entry.id)}" aria-pressed="${checked}"><span class="study-check-box">${checked ? '✓' : ''}</span>${checked ? 'チェック済み' : '分からないのでチェック'}</button>`;
    if (state.flipped) {
      const explanation = document.createElement('div');
      explanation.className = 'card-explanation';
      const label = document.createElement('strong');
      label.textContent = '説明';
      const copy = document.createElement('p');
      copy.textContent = entry.description || 'この用語の説明はまだ収録されていません。';
      explanation.append(label, copy);
      main.querySelector('.card-note').before(explanation);
    }
  }

  function renderChecked() {
    main.innerHTML = `<div class="page-head compact-page-head"><h1>チェック済み</h1><p>チェックした用語だけで復習できます。</p></div><div class="checked-summary"><span>チェックした用語</span><strong><span id="checked-total-count">${checkedCount()}</span>語</strong></div><section class="search-controls">${searchBox('checked-search', state.checkedQuery, 'チェックした用語を検索', 'clear-checked-search')}${renderFilters(true)}</section><div id="checked-results"></div><div class="selection-bar" id="checked-deck-actions"></div>`;
    renderCheckedResults();
  }

  function renderCheckedResults() {
    const entries = checkedEntries();
    const visible = entries.slice(0, state.checkedShown);
    document.getElementById('checked-total-count').textContent = checkedCount();
    document.getElementById('checked-results').innerHTML = `<p class="result-count" role="status">復習する用語：${entries.length}語${entries.length > visible.length ? ` · ${visible.length}語を表示` : ''}</p>${entries.length ? `<ul class="word-list">${visible.map(entry => termRow(entry, true)).join('')}</ul>${entries.length > visible.length ? '<button class="more-button" type="button" data-action="more-checked">もっと見る</button>' : ''}` : `<div class="empty"><div class="empty-symbol" aria-hidden="true">☑</div><strong>${checkedCount() ? '条件に合うチェック済み用語がありません' : 'まだチェックした用語はありません'}</strong><p>${checkedCount() ? '検索語を消すか、ジャンルを変更してください。' : '検索結果やカードの「分からない」を押すと、ここに集まります。'}</p><button class="outline-button" type="button" data-action="${checkedCount() ? 'reset-checked-filter' : 'open-search'}">${checkedCount() ? '絞り込みを解除' : '用語を検索する'}</button></div>`}`;
    document.getElementById('checked-deck-actions').innerHTML = deckActions(entries.length, 'study-checked', true);
    const clear = main.querySelector('[data-action=clear-checked-search]');
    if (clear) clear.hidden = !state.checkedQuery;
  }

  function renderRecords() {
    const current = profile();
    const history = [...current.history].reverse().slice(0, 30);
    main.innerHTML = `<div class="page-head"><p class="eyebrow">MY RECORD</p><h1>学習の記録</h1><p>チェックした用語と最近の操作を確認できます。</p></div><div class="profile-bar"><select id="profile-select" aria-label="使うプロフィール">${state.store.profiles.map(p => `<option value="${escapeHTML(p.id)}" ${p.id === current.id ? 'selected' : ''}>${escapeHTML(p.name)}</option>`).join('')}</select><button class="outline-button" type="button" data-action="add-profile">＋ 追加</button></div><div class="stats-card"><div><strong>${checkedCount()}</strong><small>語をチェック中</small></div><span aria-hidden="true">☑</span></div><section class="record-section"><div class="section-title"><h2>最近のチェック操作</h2><span>最大100件保存</span></div>${history.length ? `<ul class="history-list">${history.map(item => `<li class="history-item"><div><strong>${escapeHTML(item.name)}</strong><small>${formatDate(item.at)}</small></div><span class="history-action ${item.checked ? '' : 'off'}">${item.checked ? 'チェックした' : '外した'}</span></li>`).join('')}</ul>` : `<div class="empty"><div class="empty-symbol" aria-hidden="true">◷</div><strong>まだ記録はありません</strong><p>用語にチェックを付けると、ここに履歴が残ります。</p></div>`}${history.length ? `<button class="text-danger" type="button" data-action="clear-history">操作履歴を消す</button>` : ''}</section><section class="record-section"><div class="section-title"><h2>記録の保存</h2></div><p class="muted-note">記録はこのブラウザ内だけに保存されます。機種変更に備えてファイルに書き出せます。</p><div class="action-grid"><button class="outline-button" type="button" data-action="export">記録を書き出す</button><button class="outline-button" type="button" data-action="import">記録を読み込む</button></div><input id="import-file" type="file" accept="application/json,.json" hidden><button class="text-danger" type="button" data-action="delete-profile">このプロフィールを削除</button></section>`;
    main.insertAdjacentHTML('beforeend', '<section class="record-section"><div class="section-title"><h2>単語データ</h2></div><p class="muted-note">収録用語を検索・閲覧し、全件CSVを保存できます。</p><a class="source-button" href="./database.html">単語データを見る →</a><a class="source-button" href="./sources.html">参照資料・収録方針を見る →</a></section>');
  }

  document.addEventListener('submit', event => {
    if (event.target.id === 'home-search-form') {
      event.preventDefault();
      state.searchQuery = document.getElementById('home-search').value.trim();
      state.searchScope = 'all'; state.searchCheckedOnly = false; state.searchNewOnly = false; state.searchShown = PAGE_SIZE;
      document.activeElement?.blur(); go('search'); return;
    }
  });

  function toggleCheck(id) {
    const entry = state.byId.get(id);
    if (!entry) return;
    const current = profile();
    const before = JSON.stringify(state.store);
    const checked = !isChecked(id);
    if (checked) current.flags[id] = { at: new Date().toISOString() };
    else delete current.flags[id];
    current.history.push({ name: entry.name, id, checked, at: new Date().toISOString() });
    current.history = current.history.slice(-100);
    if (!saveStore()) {
      state.store = JSON.parse(before);
      toast('保存できませんでした。ブラウザの空き容量を確認してください。');
      render();
      return;
    }
    renderNav();
    if (state.screen === 'list') renderListResults();
    else if (state.screen === 'search') renderSearchResults();
    else if (state.screen === 'checked') renderCheckedResults();
    else if (state.screen === 'detail') renderDetail();
    else if (state.screen === 'study') renderStudy();
    else render();
    toast(checked ? 'チェックしました' : 'チェックを外しました');
  }

  function showModal(title, description, submitText, onSubmit, withInput = false) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p>${withInput ? '<label for="modal-input">プロフィール名</label><input id="modal-input" maxlength="20" autocomplete="off" placeholder="名前を入力">' : ''}<div class="modal-actions"><button class="outline-button" type="button" data-close>キャンセル</button><button class="primary-button" type="button" data-submit>${escapeHTML(submitText)}</button></div></div>`;
    document.body.append(backdrop);
    backdrop.querySelector('[data-close]').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
    backdrop.querySelector('[data-submit]').addEventListener('click', () => { const value = backdrop.querySelector('#modal-input')?.value.trim(); if (withInput && !value) { backdrop.querySelector('#modal-input').focus(); return; } if (onSubmit(value) !== false) backdrop.remove(); });
    backdrop.querySelector('#modal-input')?.focus();
  }

  function exportProfile() {
    const current = profile();
    const payload = { app: 'fe-kotoba-note', version: 1, exportedAt: new Date().toISOString(), profile: { name: current.name, flags: current.flags, history: current.history, notes: current.notes || {}, customTerms: current.customTerms || [] } };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `fe-kotoba-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('記録を書き出しました');
  }

  async function importProfile(file) {
    if (!file || file.size > 2_000_000) { toast('2MB以下の記録ファイルを選んでください'); return; }
    const before = JSON.stringify(state.store);
    try {
      const payload = JSON.parse(await file.text());
      if (payload.app !== 'fe-kotoba-note' || payload.version !== 1 || !payload.profile || typeof payload.profile.flags !== 'object' || !Array.isArray(payload.profile.history)) throw new Error('形式が違います');
      const customTerms = payload.profile.customTerms || [];
      const customIds = new Set();
      if (!Array.isArray(customTerms) || customTerms.length > 5000 || customTerms.some(term => {
        if (!term || typeof term.id !== 'string' || !/^custom-[a-zA-Z0-9-]{1,100}$/.test(term.id) || customIds.has(term.id) || typeof term.name !== 'string' || !term.name.trim() || term.name.length > 100 || !state.baseData.categories.some(category => category.id === Number(term.categoryId)) || (term.description !== undefined && (typeof term.description !== 'string' || term.description.length > 2000))) return true;
        customIds.add(term.id); return false;
      })) throw new Error('追加した用語の形式が違います');
      const validNames = new Set([...state.baseData.categories.flatMap(category => category.sections.flatMap(section => section.terms.map(term => term.name))), ...customTerms.map(term => term.name)]);
      const history = payload.profile.history.filter(item => item && validNames.has(item.name) && typeof item.checked === 'boolean' && typeof item.at === 'string').slice(-100);
      const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const name = String(payload.profile.name || '読み込んだ記録').slice(0, 20);
      const imported = { id, name, createdAt: new Date().toISOString(), flags: { ...payload.profile.flags }, history, notes: { ...(payload.profile.notes || {}) }, customTerms: customTerms.map(term => ({ id: term.id, name: term.name.trim(), categoryId: Number(term.categoryId), description: term.description || '', createdAt: typeof term.createdAt === 'string' ? term.createdAt : new Date().toISOString() })) };
      migrateProfileData(imported);
      imported.notes = Object.fromEntries(Object.entries(imported.notes).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, value.slice(0, 500)]));
      state.store.profiles.push(imported);
      state.store.activeProfileId = id;
      if (!saveStore()) throw new Error('保存できません');
      refreshEntries();
      render(); toast('記録を読み込みました');
    } catch { state.store = JSON.parse(before); refreshEntries(); toast('記録ファイルを読み込めませんでした'); }
  }

  document.addEventListener('click', event => {
    if (state.screen === 'study' && state.flipped && event.target.closest('.flashcard') && !event.target.closest('a, textarea, label')) { advanceStudy(); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'open-search') { go('search'); document.getElementById('global-search')?.focus(); return; }
    if (action === 'clear-search' || action === 'clear-checked-search') {
      const checked = action === 'clear-checked-search';
      if (checked) { state.checkedQuery = ''; state.checkedShown = PAGE_SIZE; }
      else { state.searchQuery = ''; state.searchShown = PAGE_SIZE; }
      const input = document.getElementById(checked ? 'checked-search' : 'global-search');
      input.value = ''; checked ? renderCheckedResults() : renderSearchResults(); input.focus(); return;
    }
    if (action === 'reset-search') { state.searchQuery = ''; state.searchScope = 'all'; state.searchCheckedOnly = false; state.searchNewOnly = false; state.searchShown = PAGE_SIZE; renderSearch(); return; }
    if (action === 'reset-checked-filter') { state.checkedQuery = ''; state.checkedScope = 'all'; state.checkedShown = PAGE_SIZE; renderChecked(); return; }
    if (action === 'search-checked-only' || action === 'search-new-only') {
      if (action === 'search-checked-only') state.searchCheckedOnly = !state.searchCheckedOnly;
      else state.searchNewOnly = !state.searchNewOnly;
      state.searchShown = PAGE_SIZE; renderSearch(); return;
    }
    if (action === 'study-search') { startStudy(searchEntries(), 'search'); return; }
    if (action === 'more-search') { state.searchShown += PAGE_SIZE; renderSearchResults(); return; }
    if (action === 'more-checked') { state.checkedShown += PAGE_SIZE; renderCheckedResults(); return; }
    if (action === 'nav') { go(button.dataset.screen); if (button.dataset.screen === 'search') document.getElementById('global-search')?.focus(); return; }
    if (action === 'toggle-category') { const id = Number(button.dataset.id); const scroll = window.scrollY; state.selectedCategories = state.selectedCategories.includes(id) ? state.selectedCategories.filter(x => x !== id) : [...state.selectedCategories, id].sort((a, b) => a - b); renderGenres(); window.scrollTo(0, scroll); return; }
    if (action === 'select-all-categories' || action === 'clear-categories') {
      const scroll = window.scrollY;
      state.selectedCategories = action === 'clear-categories' ? [] : state.data.categories.filter(category => countCategory(category) > 0).map(category => category.id);
      renderGenres(); window.scrollTo(0, scroll); return;
    }
    if (action === 'start-study') { startStudy(); return; }
    if (action === 'start-list') { if (!state.selectedCategories.length) return; state.query = ''; state.section = 'all'; state.filter = 'all'; state.shown = PAGE_SIZE; go('list'); return; }
    if (action === 'return-study') { go('study'); return; }
    if (action === 'back-study') { go(state.studyOrigin); return; }
    if (action === 'flip-card') { state.flipped = true; renderStudy(); return; }
    if (action === 'shuffle-study') { state.shuffled = !state.shuffled; const scroll = window.scrollY; if (state.screen === 'search') renderSearchResults(); else if (state.screen === 'checked') renderCheckedResults(); else renderGenres(); window.scrollTo(0, scroll); return; }
    if (action === 'toggle-new-syllabus') {
      state.newSyllabusOnly = !state.newSyllabusOnly;
      if (state.newSyllabusOnly) {
        const available = state.data.categories.filter(category => countCategory(category) > 0).map(category => category.id);
        state.selectedCategories = state.selectedCategories.filter(id => available.includes(id));
      }
      renderGenres(); return;
    }
    if (action === 'study-checked') { startStudy(checkedEntries(), 'checked'); return; }
    if (action === 'toggle-list-filter') { state.filter = state.filter === 'checked' ? 'all' : 'checked'; state.shown = PAGE_SIZE; renderList(); return; }
    if (action === 'more') { state.shown += PAGE_SIZE; renderListResults(); return; }
    if (action === 'open-term') { openTerm(button.dataset.key); return; }
    if (action === 'check') { toggleCheck(button.dataset.key); return; }
    if (action === 'back-detail') { const origin = state.detailOrigin; go(origin, false); window.scrollTo(0, state.detailScroll); return; }
    if (action === 'add-profile') { showModal('プロフィールを追加', 'このスマホのブラウザ内で記録を分けられます。', '追加する', value => { const before = JSON.stringify(state.store); const id = `p-${Date.now()}`; state.store.profiles.push({ id, name: value.slice(0, 20), createdAt: new Date().toISOString(), flags: {}, history: [], notes: {}, customTerms: [] }); state.store.activeProfileId = id; if (!saveStore()) { state.store = JSON.parse(before); toast('保存できませんでした'); return false; } refreshEntries(); render(); toast('プロフィールを追加しました'); }, true); return; }
    if (action === 'clear-history') { showModal('操作履歴を消しますか？', 'チェック済みの状態は残ります。', '履歴を消す', () => { profile().history = []; saveStore(); render(); toast('履歴を消しました'); }); return; }
    if (action === 'delete-profile') { if (state.store.profiles.length === 1) { toast('最後のプロフィールは削除できません'); return; } showModal('プロフィールを削除しますか？', 'このプロフィールの用語・チェック・履歴が消えます。', '削除する', () => { const before = JSON.stringify(state.store); state.store.profiles = state.store.profiles.filter(p => p.id !== state.store.activeProfileId); state.store.activeProfileId = state.store.profiles[0].id; if (!saveStore()) { state.store = JSON.parse(before); toast('削除を保存できませんでした'); return false; } refreshEntries(); render(); toast('プロフィールを削除しました'); }); return; }
    if (action === 'export') { exportProfile(); return; }
    if (action === 'import') { document.getElementById('import-file').click(); }
  });

  document.addEventListener('keydown', event => {
    if (state.screen !== 'study' || !state.flipped || !event.target.matches('.flashcard.is-back')) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceStudy(); }
  });

  document.addEventListener('input', event => {
    if (event.target.id === 'global-search') { state.searchQuery = event.target.value; state.searchShown = PAGE_SIZE; renderSearchResults(); }
    if (event.target.id === 'checked-search') { state.checkedQuery = event.target.value; state.checkedShown = PAGE_SIZE; renderCheckedResults(); }
    if (event.target.id === 'search-input') { state.query = event.target.value; state.shown = PAGE_SIZE; renderListResults(); }
    if (event.target.id === 'study-note') { const id = state.studyDeck[state.studyIndex]?.id; if (!id) return; const current = profile(); const before = current.notes?.[id]; if (!current.notes) current.notes = {}; if (event.target.value) current.notes[id] = event.target.value; else delete current.notes[id]; if (!saveStore()) { if (before === undefined) delete current.notes[id]; else current.notes[id] = before; toast('メモを保存できませんでした'); } }
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'section-filter') { state.section = event.target.value; state.shown = PAGE_SIZE; renderListResults(); }
    if (event.target.id === 'checked-scope') { state.checkedScope = event.target.value; state.checkedShown = PAGE_SIZE; renderCheckedResults(); }
    if (event.target.id === 'search-scope') { state.searchScope = event.target.value; state.searchShown = PAGE_SIZE; renderSearchResults(); }
    if (event.target.id === 'profile-select') { const previous = state.store.activeProfileId; state.store.activeProfileId = event.target.value; if (!saveStore()) { state.store.activeProfileId = previous; render(); toast('切り替えを保存できませんでした'); return; } refreshEntries(); render(); toast('プロフィールを切り替えました'); }
    if (event.target.id === 'import-file') importProfile(event.target.files[0]);
  });

  let touchStart = null;
  document.addEventListener('touchstart', event => {
    if (state.screen !== 'study' || !event.target.closest('.flashcard') || event.target.closest('textarea, a')) return;
    touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }, { passive: true });
  document.addEventListener('touchend', event => {
    if (!touchStart || state.screen !== 'study') return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) moveStudy(dx < 0 ? 1 : -1);
  }, { passive: true });

  renderHeader();
  main.innerHTML = '<div class="loading">用語を読み込んでいます…</div>';
  try {
    prepareData(window.FE_TERMS_DATA);
    render();
  } catch (error) {
    console.error('用語データの読み込みに失敗しました', error);
    main.innerHTML = '<div class="empty"><strong>用語を読み込めませんでした</strong><p>アプリのファイルがそろっているか確認して、開き直してください。</p><button class="more-button" type="button" onclick="location.reload()">再読み込み</button></div>';
  }
})();





