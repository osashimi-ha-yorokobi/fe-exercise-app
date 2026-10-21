// Shared allowlist for LAN serving and static distribution. Historical source
// data and downloaded PDFs stay local; publication uses only these files.
module.exports = [
  'index.html', 'database.html', 'sources.html',
  'css/style.css', 'js/app.js', 'js/database.js',
  'data/vocabulary.csv', 'data/terms.json', 'data/terms.js',
  'data/descriptions.js', 'data/diagrams.js', 'data/diagrams.json', 'data/sources.json',
  'reports/exam-vocabulary-evidence.csv',
  'reports/ipa-vocabulary-evidence.csv', 'reports/ipa-rebuild-summary.json'
].concat(Object.values(require('../data/diagrams.json')).map(item => item.src));
