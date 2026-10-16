const assert=require('node:assert/strict');
const path=require('node:path');
const {readCSV}=require('./csv');
module.exports=async function({send,evaluate,waitFor}){
 const rows=readCSV(path.join(__dirname,'../data/vocabulary.csv'));
 const dram=rows.find(row=>row.name==='DRAM');
 const saved=await evaluate("localStorage.getItem('fe-kotoba-note-v1')");
 const term={id:'custom-legacy-test',name:'外部追記テスト',categoryId:11,description:'旧データの保存確認'};
 const payload={app:'fe-kotoba-note',version:1,profile:{name:'旧記録の確認',flags:{[dram.id]:{at:new Date().toISOString()},[term.id]:{at:new Date().toISOString()}},notes:{[dram.id]:'保存してあるメモ'},history:[],customTerms:[term]}};
 try{
  await evaluate(`localStorage.setItem('fe-kotoba-note-v1',JSON.stringify({version:1,activeProfileId:'legacy',profiles:[{id:'legacy',...${JSON.stringify(payload.profile)}}]}))`);
  await send('Page.reload');await waitFor("document.querySelector('#home-search')");
  assert.equal(await evaluate("document.querySelectorAll('[data-action=custom-terms],#custom-term-form').length"),0);
  await evaluate("document.querySelector('[data-action=select-all-categories]').click()");
  assert.ok((await evaluate("document.querySelector('.selection-bar p').textContent")).includes(`${rows.length}語`));
  await evaluate("document.querySelector('[data-action=nav][data-screen=search]').click();document.querySelector('#global-search').value='外部追記テスト';document.querySelector('#global-search').dispatchEvent(new Event('input',{bubbles:true}))");
  assert.equal(await evaluate("document.querySelectorAll('#search-results .word-item').length"),0,'Legacy browser terms must not be added to the CSV catalog');
  await evaluate("document.querySelector('[data-action=nav][data-screen=records]').click()");
  assert.equal(await evaluate("document.querySelectorAll('[data-action=custom-terms],#custom-term-form').length"),0);
  await evaluate("window.backupCreateURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.checkedBackup=blob;return window.backupCreateURL(blob)};window.backupAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(!this.download)return window.backupAnchorClick.call(this)};document.querySelector('[data-action=export]').click()");
  const exported=await evaluate("window.checkedBackup.text().then(JSON.parse)");
  assert.equal(exported.profile.notes[dram.id],'保存してあるメモ');
  assert.equal(exported.profile.customTerms[0].name,term.name,'Historical data must remain recoverable in backups');
  await evaluate(`(()=>{const data=new DataTransfer();data.items.add(new File([JSON.stringify(${JSON.stringify(payload)})],'legacy.json',{type:'application/json'}));document.querySelector('#import-file').files=data.files;document.querySelector('#import-file').dispatchEvent(new Event('change',{bubbles:true}))})()`);
  await waitFor("document.querySelector('#toast').textContent==='記録を読み込みました'");
  await evaluate("document.querySelector('[data-action=nav][data-screen=genres]').click();document.querySelector('[data-action=select-all-categories]').click()");
  assert.ok((await evaluate("document.querySelector('.selection-bar p').textContent")).includes(`${rows.length}語`),'Record imports must not append vocabulary');
  await evaluate("document.querySelector('[data-action=nav][data-screen=checked]').click()");
  assert.equal(await evaluate("document.querySelector('#checked-total-count').textContent"),'1');
  assert.equal(await evaluate("document.querySelector('.word-name').textContent"),'DRAM');
  console.log('Verified: no Web vocabulary editor, CSV-only catalog after legacy storage/import, and preserved check/note backup compatibility.');
 }finally{
  await evaluate(`localStorage.setItem('fe-kotoba-note-v1',${JSON.stringify(saved)})`);
  await send('Page.reload');await waitFor("document.querySelector('#home-search')");
 }
};
