(() => {
  const data = window.FE_TERMS_DATA;
  const descriptions = window.FE_DESCRIPTIONS || {};
  const queryInput = document.getElementById('query');
  const categoryInput = document.getElementById('category');
  const versionInput = document.getElementById('version');
  const status = document.getElementById('status');
  const results = document.getElementById('results');
  const more = document.getElementById('more');
  if (!data?.categories) { status.textContent = 'データを読み込めませんでした。'; return; }
  const entries = data.categories.flatMap(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categoryInput.append(option);
    return category.sections.flatMap(section => section.terms.map(term => ({ ...term, categoryId: category.id, category: category.name, section: section.name, description: descriptions[term.id] || '' })));
  });
  let filtered = entries;
  let visible = 50;
  const normalize = text => String(text || '').normalize('NFKC').toLocaleLowerCase('ja-JP');
  function row(entry) {
    const article = document.createElement('article');
    article.className = 'row';
    const title = document.createElement('h2');
    title.textContent = entry.name;
    if (entry.addedInVersion) {
      const badge = document.createElement('span');
      badge.className = 'added-tag';
      badge.textContent = `Ver.${entry.addedInVersion}追加`;
      title.append(' ', badge);
    }
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = [entry.category, entry.section, entry.reading, entry.english].filter(Boolean).join(' · ');
    const description = document.createElement('p');
    description.className = `description ${entry.description ? '' : 'missing'}`;
    description.textContent = entry.description || '説明は未収録です。';
    article.append(title, meta, description);
    const diagram = window.FE_DIAGRAMS?.[entry.id];
    if (diagram) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.className = 'diagram-toggle';
      summary.textContent = '図で確認';
      const viewport = document.createElement('div');
      viewport.className = 'diagram-view';
      const image = document.createElement('img');
      image.src = diagram.src;
      image.alt = diagram.caption;
      image.loading = 'lazy';
      image.width = 720;
      image.height = 280;
      viewport.append(image);
      details.append(summary, viewport);
      article.append(details);
    }
    return article;
  }
  function render() {
    const fragment = document.createDocumentFragment();
    for (const entry of filtered.slice(0, visible)) fragment.append(row(entry));
    results.replaceChildren(fragment);
    status.textContent = `${filtered.length}件中${Math.min(visible, filtered.length)}件を表示 · 説明収録 ${entries.filter(entry => entry.description).length}件 / 全${entries.length}件`;
    more.hidden = visible >= filtered.length;
  }
  function filter() {
    const query = normalize(queryInput.value.trim());
    const category = categoryInput.value;
    const version = versionInput.value;
    filtered = entries.filter(entry => (!category || String(entry.categoryId) === category) && (!version || entry.addedInVersion === version) && (!query || [entry.name, entry.reading, entry.english, entry.description].some(value => normalize(value).includes(query))));
    visible = 50;
    render();
  }
  queryInput.addEventListener('input', filter);
  categoryInput.addEventListener('change', filter);
  versionInput.addEventListener('change', filter);
  more.addEventListener('click', () => { visible += 50; render(); });
  render();
})();
