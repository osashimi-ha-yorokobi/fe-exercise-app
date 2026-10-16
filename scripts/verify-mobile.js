const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const {readCSV}=require('./csv');

const root = path.resolve(__dirname, '..');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = path.join(root, `.chrome-ui-verify-${process.pid}`);
const output = path.join(root, 'mobile-test.png');
const vocabularyRows=readCSV(path.join(root,'data/vocabulary.csv'));
const expectedTotal=vocabularyRows.length;
const expectedAddedCount=vocabularyRows.filter(row=>row.added_in_version).length;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  await fs.mkdir(profile, { recursive: true });
  const chrome = spawn(chromePath, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'
  ], { windowsHide: true, stdio: 'ignore' });

  try {
    let port;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { port = Number((await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
      catch { await sleep(100); }
    }
    if (!port) throw new Error('Chrome debugging port was not available');
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = pages.find(item => item.type === 'page');
    if (!page) throw new Error('Chrome page was not available');
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let nextId = 1;
    const pending = new Map();
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 70; i++) { if (await evaluate(expression)) return; await sleep(100); }
      throw new Error(`Timed out: ${expression}`);
    };
    const screenshot = async file => {
      const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await fs.writeFile(path.join(root, file), Buffer.from(result.data, 'base64'));
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `file:///${path.join(root, 'index.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    const genres = await evaluate("document.querySelectorAll('[data-action=toggle-category]').length");
    await screenshot('mobile-test.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    const narrowOverflow = await evaluate('document.documentElement.scrollWidth > innerWidth');
    await screenshot('mobile-320-test.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate("document.querySelectorAll('[data-action=toggle-category]')[0].click();document.querySelectorAll('[data-action=toggle-category]')[1].click();document.querySelector('[data-action=start-study]').click()");
    await waitFor("document.querySelector('.flashcard') !== null");
    const initial = await evaluate("({ term:document.querySelector('.card-term').textContent, context:document.querySelector('.card-context')?.textContent, total:document.querySelector('.study-progress span').textContent, overflow:document.documentElement.scrollWidth > innerWidth })");
    await screenshot('mobile-card-front-test.png');
    await evaluate("document.querySelector('[data-action=flip-card]').click()");
    const back = await evaluate("({ reading:!!document.querySelector('.card-info'), externalLink:!!document.querySelector('.flashcard a[href^=http]') })");
    const explanation = await evaluate("document.querySelector('.card-explanation p')?.textContent");
    await screenshot('mobile-card-back-test.png');
    await evaluate("document.querySelector('#study-note').value='自分の説明';document.querySelector('#study-note').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.study-check').click()");
    const checked = await evaluate("document.querySelector('.study-check').getAttribute('aria-pressed')");
    await evaluate("document.querySelector('#study-note').click()");
    const noteDidNotAdvance = await evaluate("document.querySelector('.study-progress span').textContent.startsWith('1 / ')");
    await evaluate("document.querySelector('.card-explanation').click()");
    const cardAdvanced = await evaluate("({ progress:document.querySelector('.study-progress span').textContent, front:!!document.querySelector('.card-face'), oldButtons:document.querySelectorAll('[data-action=prev-study],[data-action=next-study]').length })");
    if (!noteDidNotAdvance || !cardAdvanced.progress.startsWith('2 / ') || !cardAdvanced.front || cardAdvanced.oldButtons) throw new Error('Card tap navigation or memo interaction failed');
    await evaluate("document.querySelector('[data-action=back-study]').click();document.querySelector('[data-action=shuffle-study]').click()");
    const shuffleOn = await evaluate("document.querySelector('.shuffle-picker').getAttribute('aria-pressed')");
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    const shuffleNarrowOverflow = await evaluate('document.documentElement.scrollWidth > innerWidth');
    await screenshot('mobile-shuffle-picker-test.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate("document.querySelector('[data-action=start-study]').click();document.querySelector('.card-face').click();document.querySelector('.flashcard.is-back').click()");
    const shuffled = { on: shuffleOn, index: await evaluate("document.querySelector('.study-progress span').textContent"), narrowOverflow: shuffleNarrowOverflow };
    if (shuffled.on !== 'true' || shuffled.narrowOverflow) throw new Error('Shuffle picker failed on narrow mobile screen');
    await send('Page.reload');
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelector('[data-screen=checked]').click()");
    const review = await evaluate("({ count:document.querySelectorAll('.word-item').length, title:document.querySelector('h1').textContent })");
    await evaluate("document.querySelector('[data-action=study-checked]').click();document.querySelector('[data-action=flip-card]').click()");
    const persisted = await evaluate("({ checked:document.querySelector('.study-check').getAttribute('aria-pressed'), note:document.querySelector('#study-note').value })");
    await screenshot('mobile-review-card-test.png');
    await evaluate("document.querySelector('.flashcard.is-back').click()");
    const lastCardStayed = await evaluate("document.querySelector('.study-progress span').textContent==='1 / 1 語' && !!document.querySelector('.flashcard.is-back')");
    if (!lastCardStayed) throw new Error('Last card did not stay visible');
    await evaluate("document.querySelector('[data-action=back-study]').click()");
    await evaluate("document.querySelector('[data-screen=records]').click()");
    const history = await evaluate("document.querySelectorAll('.history-item').length");
    await evaluate("document.querySelector('[data-action=add-profile]').click()");
    await evaluate("document.querySelector('#modal-input').value='別の人';document.querySelector('[data-submit]').click()");
    const switchedCount = await evaluate("document.querySelector('.stats-card strong').textContent");
    await send('Page.navigate', { url: `file:///${path.join(root, 'index.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelectorAll('[data-action=toggle-category]')[9].click();document.querySelector('[data-action=start-study]').click()");
    const duplicateDeckCount = await evaluate("document.querySelector('.study-progress span').textContent");
    await evaluate("document.querySelector('[data-action=start-list]').click();document.querySelector('#search-input').value='DNS';document.querySelector('#search-input').dispatchEvent(new Event('input',{bubbles:true}))");
    const duplicateRows = await evaluate("[...document.querySelectorAll('.word-name')].filter(x=>x.textContent==='DNS').length");
    await evaluate("[...document.querySelectorAll('.word-item')].find(x=>x.querySelector('.word-name').textContent==='DNS').querySelector('.check-button').click()");
    const duplicateIndependent = await evaluate("[...document.querySelectorAll('.word-item')].filter(x=>x.querySelector('.word-name').textContent==='DNS').map(x=>x.querySelector('.check-button').getAttribute('aria-pressed')).join(',')");
    if (!/^1 \/ \d+ 語$/.test(duplicateDeckCount) || duplicateRows !== 2 || duplicateIndependent !== 'true,false') throw new Error('Duplicate-name cards were merged or shared their check state');
    await evaluate("localStorage.setItem('fe-kotoba-note-v1',JSON.stringify({version:1,activeProfileId:'default',profiles:[{id:'default',name:'自分用',flags:{DNS:{at:'2026-01-01T00:00:00.000Z'}},history:[],notes:{DNS:'旧メモ'}}]}))");
    await send('Page.reload');
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelector('[data-screen=checked]').click()");
    const migratedDuplicateRows = await evaluate("document.querySelectorAll('.word-item').length");
    if (migratedDuplicateRows !== 2) throw new Error('Legacy check state was not migrated to both duplicate-name cards');
    await send('Page.navigate', { url: `file:///${path.join(root, 'database.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelectorAll('.row').length === 50");
    const database = await evaluate("({ genres:document.querySelectorAll('#category option').length-1, first:document.querySelector('.row h2').textContent, count:document.querySelector('#status').textContent, externalLinks:document.querySelectorAll('.row a[href^=http]').length })");
    await evaluate("document.querySelector('#version').value='9.0';document.querySelector('#version').dispatchEvent(new Event('change'))");
    const versionFilter = await evaluate("({ count:document.querySelector('#status').textContent, badges:document.querySelectorAll('.row .added-tag').length })");
    await screenshot('mobile-database-test.png');
    if (back.externalLink || database.externalLinks || !versionFilter.count.startsWith('444件') || versionFilter.badges !== 50) throw new Error('Source link removal or added-version filter failed');
    await send('Page.navigate', { url: `file:///${path.join(root, 'index.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelectorAll('[data-action=toggle-category]')[0].click();document.querySelectorAll('[data-action=toggle-category]')[1].click();document.querySelector('[data-action=start-study]').click()");
    const compilerContext = await evaluate(`(()=>{for(let i=0;i<${expectedTotal};i++){if(document.querySelector('.card-term')?.textContent==='構文解析'&&document.querySelector('.card-context')?.textContent.includes('コンパイラ'))return document.querySelector('.card-context').textContent;document.querySelector('.card-face')?.click();document.querySelector('.flashcard.is-back')?.click()}return null})()`);
    if (!compilerContext) throw new Error('Compiler syntax analysis card has no readable context');
    await screenshot('mobile-compiler-front-test.png');
    await evaluate("document.querySelector('[data-action=flip-card]').click()");
    const compilerExplanation = await evaluate("({ text:document.querySelector('.card-explanation p').textContent, size:getComputedStyle(document.querySelector('.card-explanation p')).fontSize, color:getComputedStyle(document.querySelector('.card-explanation p')).color, overflow:document.documentElement.scrollWidth>innerWidth })");
    await screenshot('mobile-compiler-back-test.png');
    if (!compilerExplanation.text.includes('コンパイラ') || compilerExplanation.size !== '16px' || compilerExplanation.overflow) throw new Error('Compiler explanation is missing or too small');
    await send('Page.reload');
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelectorAll('[data-action=toggle-category]')[0].click();document.querySelector('[data-action=start-study]').click()");
    const samplingContext = await evaluate(`(()=>{for(let i=0;i<${expectedTotal};i++){if(document.querySelector('.card-term')?.textContent==='標本化')return document.querySelector('.card-context')?.textContent;document.querySelector('.card-face')?.click();document.querySelector('.flashcard.is-back')?.click()}return null})()`);
    if (!samplingContext?.includes('アナログ信号')) throw new Error('Sampling card has no A/D context');
    await evaluate("document.querySelector('.card-face').click()");
    const samplingExplanation = await evaluate("document.querySelector('.card-explanation p')?.textContent");
    if (!samplingExplanation?.includes('一定間隔')) throw new Error('Sampling explanation is not shown from the CSV');
    await screenshot('mobile-sampling-back-test.png');
    await send('Page.reload');
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelectorAll('[data-action=toggle-category]')[2].click();document.querySelector('[data-action=start-study]').click()");
    const dramFound = await evaluate("(()=>{for(let i=0;i<70;i++){if(document.querySelector('.card-term')?.textContent==='DRAM')return true;document.querySelector('.card-face')?.click();document.querySelector('.flashcard.is-back')?.click()}return false})()");
    if (!dramFound) throw new Error('DRAM card is missing');
    await evaluate("document.querySelector('.card-face').click()");
    const dramExplanation = await evaluate("({text:document.querySelector('.card-explanation p')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth})");
    if (!dramExplanation.text?.includes('安価') || !dramExplanation.text.includes('リフレッシュ') || dramExplanation.overflow) throw new Error('DRAM explanation is missing or overflows on mobile');
    await screenshot('mobile-dram-back-test.png');
    await send('Page.navigate', { url: `file:///${path.join(root, 'database.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelectorAll('.row').length === 50");
    if (!(await evaluate("document.querySelector('#status').textContent")).includes(`全${expectedTotal}件`)) throw new Error('Database total differs from the CSV');
    const requestedExamples={};
    for(const [name,expected] of [['ポアソン分布','平均と分散'],['油圧シリンダ','建設機械'],['空気圧シリンダ','工場'],['スワッピング','主記憶'],['Wi-Fi4/5/6/6E','9.6Gbps']]){
      await evaluate(`document.querySelector('#query').value=${JSON.stringify(name)};document.querySelector('#query').dispatchEvent(new Event('input',{bubbles:true}))`);
      const text=await evaluate(`(()=>{const row=[...document.querySelectorAll('.row')].find(x=>x.querySelector('h2').textContent.trim().startsWith(${JSON.stringify(name)}));return row?.querySelector('.description').textContent})()`);
      if(!text?.includes(expected))throw new Error(`Updated explanation not visible: ${name}`);
      requestedExamples[name]=text;
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw new Error('Long communication explanation overflows on 320px mobile');
    await screenshot('mobile-full-review-test.png');
    await send('Page.navigate', { url: `file:///${path.join(root, 'index.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelectorAll('[data-action=toggle-category]').length === 23");
    await evaluate("document.querySelector('[data-action=toggle-new-syllabus]').click()");
    const noAutoSelection=await evaluate("document.querySelectorAll('.genre-button.selected').length===0 && document.querySelector('[data-action=start-study]').disabled");
    if(!noAutoSelection)throw new Error('New syllabus toggle must not select unrelated genres automatically');
    await evaluate("document.querySelector('[data-action=toggle-category][data-id=\"11\"]').click()");
    await send('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:1,mobile:true});
    const selectedSecurityOnly=await evaluate("({ids:[...document.querySelectorAll('.genre-button.selected')].map(button=>button.dataset.id),summary:document.querySelector('.genre-selection-summary').textContent,count:document.querySelector('.selection-bar p').textContent,overflow:document.documentElement.scrollWidth>innerWidth})");
    if(selectedSecurityOnly.ids.join(',')!=='11'||!selectedSecurityOnly.summary.includes('セキュリティ')||!selectedSecurityOnly.count.includes(`${vocabularyRows.filter(row=>row.category_id==='11'&&row.added_in_version).length}語`)||selectedSecurityOnly.overflow)throw new Error('Selected genre and added-only filter are not intersected');
    await screenshot('mobile-new-syllabus-genre-test.png');
    await evaluate("document.querySelector('[data-action=clear-categories]').click()");
    if(!(await evaluate("document.querySelector('[data-action=start-study]').disabled && document.querySelector('[data-action=toggle-new-syllabus]').getAttribute('aria-pressed')==='true'")))throw new Error('Clearing genres must retain the syllabus filter');
    await evaluate("document.querySelector('[data-action=select-all-categories]').click()");
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    const syllabusPicker=await evaluate("({on:document.querySelector('[data-action=toggle-new-syllabus]').getAttribute('aria-pressed'),selection:document.querySelector('.selection-bar p').textContent,overflow:document.documentElement.scrollWidth>innerWidth})");
    if(syllabusPicker.on!=='true'||!syllabusPicker.selection.includes(`${expectedAddedCount}語`)||syllabusPicker.overflow)throw new Error('New syllabus preset has wrong count or mobile layout');
    await screenshot('mobile-new-syllabus-picker-test.png');
    await evaluate("document.querySelector('[data-action=start-study]').click()");
    const syllabusDeck=await evaluate("({count:document.querySelector('.study-progress span').textContent,badge:document.querySelector('.flashcard .added-tag')?.textContent})");
    if(!syllabusDeck.count.includes(`/ ${expectedAddedCount} 語`)||!syllabusDeck.badge)throw new Error('New syllabus deck includes unmarked cards or wrong total');
    await evaluate("document.querySelector('[data-action=start-list]').click()");
    const addedList=await evaluate("({rows:document.querySelectorAll('.word-item').length,badges:document.querySelectorAll('.word-item .added-tag').length})");
    if(!addedList.rows||addedList.rows!==addedList.badges)throw new Error('New syllabus list includes unmarked terms');
    await evaluate("document.querySelector('#search-input').value='DRAM';document.querySelector('#search-input').dispatchEvent(new Event('input',{bubbles:true}))");
    if(await evaluate("document.querySelectorAll('.word-item').length"))throw new Error('Normal syllabus DRAM appeared in the added-only list');
    await evaluate("document.querySelector('[data-action=return-study]').click();document.querySelector('[data-action=back-study]').click();while(document.querySelector('.genre-button.selected'))document.querySelector('.genre-button.selected').click();document.querySelector('[data-action=toggle-category][data-id=\"11\"]').click();document.querySelector('[data-action=shuffle-study]').click();document.querySelector('[data-action=start-study]').click()");
    const addedSecurityCount=vocabularyRows.filter(row=>row.category_id==='11'&&row.added_in_version).length;
    const syllabusByGenre=await evaluate("({count:document.querySelector('.study-progress span').textContent,badge:document.querySelector('.flashcard .added-tag')?.textContent,category:document.querySelector('.study-section').textContent})");
    if(!syllabusByGenre.count.includes(`/ ${addedSecurityCount} 語`)||!syllabusByGenre.badge||!syllabusByGenre.category.includes('セキュリティ'))throw new Error('New syllabus genre selection or shuffle failed');
    await evaluate("document.querySelector('[data-action=back-study]').click();document.querySelector('[data-action=toggle-new-syllabus]').click();document.querySelector('[data-action=start-study]').click()");
    const normalSecurityCount=vocabularyRows.filter(row=>row.category_id==='11').length;
    if(!(await evaluate("document.querySelector('.study-progress span').textContent")).includes(`/ ${normalSecurityCount} 語`))throw new Error('Turning the syllabus filter off did not restore ordinary terms');
    await send('Page.navigate', { url: `file:///${path.join(root, 'index.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelector('#home-search')");
    if(await evaluate("!!document.querySelector('[data-action=custom-terms],#custom-term-form')"))throw new Error('Web vocabulary editing must be removed');
    await require('./verify-search-review')({send,evaluate,waitFor,screenshot});
    await require('./verify-no-web-additions')({send,evaluate,waitFor});
    await send('Page.navigate', { url: `file:///${path.join(root, 'sources.html').replaceAll('\\', '/')}` });
    await waitFor("document.querySelector('h1')?.textContent==='参照資料・収録方針'");
    await send('Emulation.setDeviceMetricsOverride', { width:320,height:700,deviceScaleFactor:1,mobile:true });
    await evaluate("document.querySelectorAll('details').forEach(detail=>detail.open=true)");
    const sourceCredits=await evaluate("({overflow:document.documentElement.scrollWidth>innerWidth,documents:document.querySelectorAll('details a').length,nonIPAlinks:[...document.querySelectorAll('a[href^=http]')].filter(a=>new URL(a.href).hostname!=='www.ipa.go.jp').length,hasEvidence:!!document.querySelector('a.download'),font:getComputedStyle(document.querySelector('.panel p')).fontSize})");
    if(sourceCredits.overflow||sourceCredits.documents!==28||sourceCredits.nonIPAlinks||!sourceCredits.hasEvidence||sourceCredits.font!=='16px')throw new Error('Source credits are incomplete or overflow on mobile');
    await screenshot('mobile-sources-test.png');
    console.log(JSON.stringify({ genres, narrowOverflow, initial, back, explanation, checked, noteDidNotAdvance, cardAdvanced, shuffled, persisted, lastCardStayed, review, history, switchedCount, duplicateDeckCount, duplicateRows, duplicateIndependent, migratedDuplicateRows, database, versionFilter, compilerContext, compilerExplanation, samplingContext, samplingExplanation, dramExplanation, requestedExamples, syllabusPicker, syllabusDeck, syllabusByGenre, sourceCredits, screenshot: output }));
    socket.close();
  } finally {
    chrome.kill();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });

