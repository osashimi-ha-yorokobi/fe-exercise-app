"""Read only IPA documents and the editable CSV; never use a third-party word list.

Literal occurrences are evidence of text occurrence, not a guarantee that a word
was itself the subject of a question. OCR and homonyms need human review.
"""
import csv, json, re, unicodedata
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
norm = lambda s: re.sub(r'\s+', '', unicodedata.normalize('NFKC', s)).upper()
def contains(term, text):
    term = norm(term)
    if len(term) < 2 and term not in {'C','R'}:
        return False
    boundary = '[A-Z]' if term in {'C','R'} else '[A-Z0-9]'
    left = r'(?<!'+boundary+r')' if re.match(r'[A-Z0-9]',term) else ''
    right = r'(?!'+boundary+r')' if re.search(r'[A-Z0-9]$',term) else ''
    return bool(re.search(left+re.escape(term)+right,text))

with (ROOT/'data/vocabulary.csv').open(encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
syllabus = PdfReader(ROOT/'tmp/ipa-official/syllabus_fe_ver9_2.pdf')
sections = []
current = None
category = None
for page_no, page in enumerate(syllabus.pages, 1):
    if page_no < 8: # cover, contents and introduction are not term evidence
        continue
    for line in (page.extract_text() or '').splitlines():
        if 'Copyright(c)' in line or re.fullmatch(r'\s*-\d+-\s*',line):
            continue
        m = re.search(r'中分類\s*(\d+)\s*[：:]\s*(.+)', line)
        if m:
            category = (int(m[1]), m[2].strip())
            current = None
        m = re.match(r'^\s*(\d+)[.．]\s+(.+?)\s*$', line)
        if m and category:
            current = {'category_id':category[0], 'category':category[1],
                       'order':int(m[1]), 'section':m[2].strip(), 'pages':{}}
            sections.append(current)
        if current:
            current['pages'][page_no] = current['pages'].get(page_no, '') + line + '\n'
for section in sections:
    section['pages'] = {str(p):norm(t) for p,t in section['pages'].items()}

exam_pages = []
for pdf in sorted((ROOT/'tmp/ipa-subject-a').glob('*.pdf')):
    txt = pdf.with_suffix('.txt')
    if txt.exists():
        pages = [(int(p),t) for p,t in re.findall(r'---PAGE (\d+)---(.*?)(?=---PAGE|\Z)',txt.read_text(encoding='utf-8'),re.S)]
    else:
        pages = [(i,p.extract_text() or '') for i,p in enumerate(PdfReader(pdf).pages,1)]
    exam_pages.extend((pdf.name,p,norm(t)) for p,t in pages if p > 2)

# Spelling variants, not inferred synonyms. OCR variants are tagged separately.
aliases = {
    'ガベージコレクション':['ガーベジコレクション'],
    'タイムクウォンタム':['タイムクォンタム'],
    'ユーザーモード':['ユーザモード'], 'ユーザーインタフェース':['ユーザインタフェース'],
    'JIS X0160':['JIS X 0160'], 'JIS Q9001':['JIS Q 9001'], 'JIS Q14001':['JIS Q 14001'],
    'ブラックボックステスト':['ブラックボックス'], 'Wi-Fi4/5/6/6E':['Wi-Fi'],
    'プロジェクトのステークホルダ':['プロジェクトのステークホルダー'],
    '学習データ':['学習（訓練）データ'],
    'プロンプトインジェクション攻撃':['プロンプトインジェクション'],
    '加法混色':['加法混合'],
    'オーバーヘッド':['オーバヘッド'],
}
ocr_aliases = {'パケット':['バケット'], 'サブネットマスク':['サプネットマスク'],
              'ファジング':['フアジング'], 'ブロッキング':['プロッキング']}
report = []
for row in rows:
    names = [row['name'], *aliases.get(row['name'],[])]
    syllabus_hits = []
    for section in sections:
        if row['name'] in {'C','R'} and section['section'] != 'プログラム言語':
            continue
        hits = [int(p) for p,text in section['pages'].items() if any(contains(n,text) for n in names)]
        if not hits and any(contains(n,''.join(section['pages'].values())) for n in names):
            hits = [int(p) for p in section['pages']]
        if hits:
            syllabus_hits.append({k:section[k] for k in ['category_id','category','section','order']} | {'pages':hits})
    # Prefer the subject area matching the meaning of an existing card.
    syllabus_hits.sort(key=lambda h:(h['category_id'] != int(row['category_id']), norm(h['section']) != norm(row['section']),h['category_id'],h['order']))
    exam_hits = [{'document':f,'page':p,'match':'literal'} for f,p,text in exam_pages if len(row['name']) > 1 and any(contains(n,text) for n in names)]
    exam_hits += [{'document':f,'page':p,'match':'OCR variant'} for f,p,text in exam_pages
                  if not any(contains(n,text) for n in names) and any(contains(n,text) for n in ocr_aliases.get(row['name'],[]))]
    report.append({'id':row['id'],'name':row['name'],'category_id':int(row['category_id']),
                   'section':row['section'],'syllabus':syllabus_hits,'exams':exam_hits})
(ROOT/'tmp/ipa-official/audit.json').write_text(json.dumps({'sections':sections,'terms':report},ensure_ascii=False,indent=2),encoding='utf-8')
unmatched = [t for t in report if not t['syllabus'] and not t['exams']]
print(json.dumps({'terms':len(report),'sections':len(sections),'literal_syllabus':sum(bool(t['syllabus']) for t in report),
                  'literal_exam':sum(bool(t['exams']) for t in report),'unmatched':[{'name':t['name'],'category':t['category_id'],'section':t['section']} for t in unmatched]},ensure_ascii=False,indent=2))
