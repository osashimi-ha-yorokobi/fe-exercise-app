const fs = require('node:fs');
const path = require('node:path');
const { readCSV } = require('./csv');
const specs = require('./diagram-specs');

const root = path.resolve(__dirname, '..');
const rows = readCSV(path.join(root, 'data', 'vocabulary.csv'));
const output = path.join(root, 'diagrams');
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const text = (x, y, value, size = 22, fill = '#153b34', weight = 700, anchor = 'middle') =>
  '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" font-family="Arial, Yu Gothic, Meiryo, sans-serif" font-size="' + size + '" font-weight="' + weight + '" fill="' + fill + '">' + esc(value) + '</text>';
const rect = (x, y, w, h, fill = '#e8f5ee', stroke = '#8cc8a7', radius = 18) =>
  '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + radius + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>';
const line = (x1, y1, x2, y2, color = '#39866b', width = 3, dash = '') =>
  '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + width + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
const arrow = (x1, y1, x2, y2, color = '#39866b') => line(x1, y1, x2, y2, color) +
  '<path d="M' + x2 + ' ' + y2 + ' l-11 -7 m11 7 l-11 7" fill="none" stroke="' + color + '" stroke-width="3" transform="rotate(' + Math.atan2(y2-y1,x2-x1)*180/Math.PI + ' ' + x2 + ' ' + y2 + ')"/>';
function wrapped(x, y, value, max = 13, size = 22, fill = '#153b34') {
  const chars = Array.from(String(value));
  const chunks = [];
  for (let i = 0; i < chars.length; i += max) chunks.push(chars.slice(i, i + max).join(''));
  const start = y - (chunks.length - 1) * (size * 1.25) / 2;
  return chunks.map((chunk, i) => text(x, start + i * size * 1.25, chunk, size, fill)).join('');
}
function flow(spec) {
  const parts = spec.items;
  const gap = 18, left = 28, w = (720 - left * 2 - gap * (parts.length - 1)) / parts.length;
  return parts.map((item, i) => {
    const x = left + i * (w + gap);
    const box = rect(x, 76, w, 125, i % 2 ? '#eef2ff' : '#e7f5ed', i % 2 ? '#a6b7e8' : '#8cc8a7');
    return box + wrapped(x + w / 2, 145, item, Math.max(5, Math.floor(w / 22)), 21) +
      (i < parts.length - 1 ? text(x + w + gap / 2, 149, '→', 28, '#39866b') : '');
  }).join('');
}
function compare(spec) {
  const items = spec.items;
  return items.map((item, i) => {
    const x = 26 + i * 344;
    return rect(x, 63, 324, 168, i ? '#fff2e7' : '#e7f5ed', i ? '#efb982' : '#8cc8a7') +
      wrapped(x + 162, 119, item[0], 15, 23) +
      line(x + 37, 141, x + 287, 141, '#cbd9d1', 2) +
      wrapped(x + 162, 186, item[1], 18, 20, '#405851');
  }).join('');
}
function cycle(spec) {
  const pos = [[360,81],[558,152],[360,225],[162,152]];
  const n = spec.items.length;
  let body = '';
  for(let i=0;i<n;i++){
    const [x,y]=pos[i];
    body += rect(x-92,y-35,184,70,i%2?'#eef2ff':'#e7f5ed',i%2?'#a6b7e8':'#8cc8a7',15);
    body += wrapped(x,y+7,spec.items[i],9,19);
    const [nx,ny]=pos[(i+1)%n];
    body += arrow(x+(nx>x?92:nx<x?-92:0),y+(ny>y?35:ny<y?-35:0),nx+(nx>x?-102:nx<x?102:0),ny+(ny>y?-42:ny<y?42:0));
  }
  return body;
}
function tree(spec) {
  const items = spec.items;
  let body = rect(261,51,198,65,'#dff1e6') + wrapped(360,91,items[0],10,21);
  const leaves = items.slice(1), w = Math.min(205,(674-(leaves.length-1)*18)/leaves.length);
  leaves.forEach((item,i)=>{
    const x=23+i*(w+18);
    body+=line(360,116,x+w/2,171);
    body+=rect(x,171,w,73,i%2?'#eef2ff':'#fff2e7',i%2?'#a6b7e8':'#efb982',15);
    body+=wrapped(x+w/2,214,item,Math.max(6,Math.floor(w/21)),19);
  });
  return body;
}
function matrix(spec) {
  const rows = spec.items, cols = rows[0].length, cw = 640/cols, ch = Math.min(50,190/rows.length);
  let body='';
  rows.forEach((row,r)=>row.forEach((cell,c)=>{
    const x=40+c*cw,y=50+r*ch;
    body+=rect(x,y,cw-4,ch-4,(r===0||c===0)?'#dcefe5':(r+c)%2?'#f2f5ff':'#fff4e9','#d4e3d8',7);
    body+=wrapped(x+(cw-4)/2,y+ch/2+6,cell,Math.max(6,Math.floor(cw/18)),17);
  }));
  return body;
}
function bars(spec) {
  const vals=spec.values || [2,5,8,5,2], labels=spec.items || vals.map((_,i)=>String(i));
  let body=line(70,224,665,224,'#587b70',2)+line(70,224,70,55,'#587b70',2);
  const max=Math.max(...vals), step=550/vals.length;
  vals.forEach((v,i)=>{
    const h=145*v/max,x=90+i*step;
    body+=rect(x,224-h,step-24,h,i%2?'#7d9edf':'#53ad81','none',5);
    body+=text(x+(step-24)/2,253,labels[i],16,'#405851',600);
  });
  return body;
}
function plot(spec) {
  const kind=spec.variant;
  let body=['mosaic','scatterMatrix','join','precision','dendro','addMix','subtractMix'].includes(kind)?'':line(70,228,665,228,'#587b70',2)+line(70,228,70,52,'#587b70',2);
  if(kind==='bell'||kind==='tail'){
    const points=[];for(let i=0;i<=120;i++){const x=75+i*4.8,z=(x-365)/118,y=217-152*Math.exp(-z*z/2);points.push(x.toFixed(1)+','+y.toFixed(1));}
    body+='<polyline points="'+points.join(' ')+'" fill="none" stroke="#347f6b" stroke-width="4"/>';
    if(kind==='tail') body+='<path d="M515 175 L515 228 L650 228 L650 226 Q590 223 515 175" fill="#f8c38a" opacity=".8"/>'+line(515,228,515,143,'#d8764f',2,'6 5')+text(574,118,'めずらしい結果',18,'#a45d39');
    else body+=line(365,228,365,68,'#7d9edf',2,'6 5')+text(365,48,'中心',17,'#5d6f97');
  }else if(kind==='roc'){
    body+=line(80,218,645,60,'#a8b5aa',2,'6 6');
    body+='<path d="M80 218 C135 105 210 77 320 68 S530 58 645 57" fill="none" stroke="#347f6b" stroke-width="4"/>';
    body+=text(380,250,'誤って警告する割合 →',17,'#405851')+text(83,43,'見つける割合 ↑',17,'#405851','700','start');
  }else if(kind==='scatter'||kind==='regression'){
    const pts=[[115,193],[151,176],[188,182],[216,147],[260,155],[290,131],[335,142],[367,107],[406,121],[444,88],[495,93],[532,72],[581,80]];
    pts.forEach(([x,y])=>body+='<circle cx="'+x+'" cy="'+y+'" r="6" fill="#438d73"/>');
    if(kind==='regression')body+=line(105,199,597,67,'#d67850',3);
  }else if(kind==='overfit'){
    body+='<path d="M90 72 Q290 201 640 215" fill="none" stroke="#347f6b" stroke-width="4"/>';
    body+='<path d="M90 179 Q275 80 440 135 Q545 175 640 192" fill="none" stroke="#d67850" stroke-width="4"/>';
    body+=text(570,209,'練習',17,'#347f6b')+text(562,160,'初見',17,'#b95e40');
  }else if(kind==='time'||kind==='period'){
    const points=[];for(let i=0;i<12;i++){const x=91+i*48,y=kind==='period'?150-55*Math.sin(i*Math.PI/2):204-i*9+(i%3)*12;points.push(x+','+y);}
    body+='<polyline points="'+points.join(' ')+'" fill="none" stroke="#347f6b" stroke-width="4"/>';
    points.forEach(p=>{const [x,y]=p.split(',');body+='<circle cx="'+x+'" cy="'+y+'" r="5" fill="#347f6b"/>';});
    body+=text(370,255,'時間 →',17,'#405851');
  }else if(kind==='box'){
    body+=line(112,140,603,140,'#347f6b',4)+line(112,120,112,160,'#347f6b',3)+line(603,120,603,160,'#347f6b',3);
    body+=rect(230,105,260,70,'#e7f5ed','#347f6b',3)+line(357,105,357,175,'#d67850',4);
    body+=text(112,205,'最小',16)+text(230,205,'25%',16)+text(357,205,'中央',16)+text(490,205,'75%',16)+text(603,205,'最大',16);
  }else if(kind==='heat'){
    const colors=['#e5f3e8','#addac3','#69bb91','#2f8869'];
    for(let r=0;r<4;r++)for(let c=0;c<6;c++)body+=rect(126+c*75,56+r*39,69,33,colors[(r*3+c*2)%4],'#fff',3);
    body+=text(360,251,'色が濃いほど値が大きい',17,'#405851');
  }else if(kind==='dual'){
    body+=bars({values:[4,7,5,8],items:['1月','2月','3月','4月']});
    body+='<polyline points="140,160 270,122 400,140 530,78" fill="none" stroke="#d67850" stroke-width="4"/>';
    body+=line(665,228,665,52,'#d67850',2)+text(92,45,'左：売上',16,'#347f6b','700','start')+text(545,45,'右：割合',16,'#b95e40','700','start');
  }else if(kind==='timing'){
    body+=text(80,90,'入力',17,'#405851','700','start')+text(80,174,'出力',17,'#405851','700','start');
    body+='<path d="M155 111 H265 V72 H380 V111 H505 V72 H635" fill="none" stroke="#347f6b" stroke-width="4"/>';
    body+='<path d="M155 196 H325 V157 H445 V196 H565 V157 H635" fill="none" stroke="#d67850" stroke-width="4"/>';
    body+=text(370,255,'時間 →',17,'#405851');
  }else if(kind==='oc'){
    body+='<path d="M80 70 C185 72 270 88 345 126 S510 205 645 217" fill="none" stroke="#347f6b" stroke-width="4"/>';
    body+=text(370,255,'不良品の割合 →',17,'#405851')+text(83,43,'合格する確率 ↑',17,'#405851','700','start');
  }else if(kind==='mosaic'){
    body+=rect(112,65,180,155,'#8bc6a3','#fff',2);
    body+=rect(112,174,180,46,'#e8b08a','#fff',2);
    body+=rect(299,65,308,86,'#8bc6a3','#fff',2);
    body+=rect(299,157,308,63,'#e8b08a','#fff',2);
    body+=text(202,247,'グループA',17,'#405851')+text(453,247,'グループB',17,'#405851');
    body+=text(200,116,'項目1',17,'#153b34')+text(450,114,'項目1',17,'#153b34');
    body+=text(200,204,'項目2',16,'#153b34')+text(450,196,'項目2',16,'#153b34');
  }else if(kind==='scatterMatrix'){
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){
      const bx=145+c*240,by=48+r*98;
      body+=rect(bx,by,222,89,'#fff','#d4e3d8',3);
      if(r===c)body+=text(bx+111,by+53,r?'体重':'身長',19);
      else for(const [i,j] of [[20,66],[45,58],[71,51],[93,49],[120,35],[142,31],[166,22],[190,19]])body+='<circle cx="'+(bx+i)+'" cy="'+(by+j)+'" r="4" fill="#438d73"/>';
    }
  }else if(kind==='join'){
    body+=text(175,44,'顧客表',20)+text(545,44,'注文表',20);
    body+=rect(48,60,255,158,'#fff','#8cc8a7',8)+rect(417,60,255,158,'#fff','#a6b7e8',8);
    body+=rect(48,60,255,48,'#e7f5ed','#8cc8a7',8)+rect(417,60,255,48,'#eef2ff','#a6b7e8',8);
    body+=text(103,91,'顧客ID',17)+text(246,91,'名前',17)+text(473,91,'顧客ID',17)+text(617,91,'注文',17);
    body+=line(175,108,175,218,'#d4e3d8',2)+line(545,108,545,218,'#d4e3d8',2);
    body+=text(103,151,'101',18)+text(246,151,'田中',18)+text(473,151,'101',18)+text(617,151,'A01',18);
    body+=text(103,193,'102',18)+text(246,193,'佐藤',18)+text(473,193,'102',18)+text(617,193,'A02',18);
    body+=arrow(308,148,406,148)+text(358,131,'同じID',16,'#347f6b');
  }else if(kind==='precision'){
    for(const [cx,label] of [[210,'中心に集まる'],[510,'右へ偏る']]){
      body+='<circle cx="'+cx+'" cy="139" r="81" fill="#fff" stroke="#adcbbb" stroke-width="2"/>';
      body+='<circle cx="'+cx+'" cy="139" r="49" fill="none" stroke="#adcbbb" stroke-width="2"/>';
      body+='<circle cx="'+cx+'" cy="139" r="16" fill="none" stroke="#adcbbb" stroke-width="2"/>';
      body+=line(cx-9,139,cx+9,139,'#7fa995',2)+line(cx,130,cx,148,'#7fa995',2)+text(cx,251,label,18);
    }
    for(const [x,y] of [[201,134],[219,145],[211,151],[205,124],[222,131],[195,144],[214,137],[206,142],[560,116],[571,124],[556,130],[566,133],[575,117],[561,139],[579,126],[568,112]])body+='<circle cx="'+x+'" cy="'+y+'" r="4.5" fill="#d67850"/>';
  }else if(kind==='dendro'){
    const xs=[140,270,450,580];
    xs.forEach((x,i)=>body+=text(x,242,'ABCD'[i],20));
    body+=line(140,220,140,168)+line(270,220,270,168)+line(140,168,270,168);
    body+=line(450,220,450,144)+line(580,220,580,144)+line(450,144,580,144);
    body+=line(205,168,205,69)+line(515,144,515,69)+line(205,69,515,69);
    body+=text(360,47,'離れた集まりが最後につながる',18,'#405851');
  }else if(kind==='addMix'||kind==='subtractMix'){
    const additive=kind==='addMix';
    const colors=additive?['#f05050','#45bd70','#5489e9']:['#30c5ca','#d969ba','#e7cb3e'];
    const labels=additive?['赤の光','緑の光','青の光']:['シアン','マゼンタ','イエロー'];
    for(let i=0;i<3;i++){
      const x=35+i*160;
      body+=rect(x,75,135,105,colors[i],colors[i],16);
      body+=text(x+67,209,labels[i],18,'#405851');
      if(i<2)body+=text(x+146,140,'＋',25,'#587b70');
    }
    body+=text(536,140,'→',31,'#587b70');
    body+=rect(581,76,100,104,additive?'#fff':'#263b38',additive?'#becdc3':'#263b38',16);
    body+=text(632,209,additive?'白':'暗い色',18,'#405851');
  }
  return body;
}
const renderers={flow,compare,cycle,tree,matrix,bars,plot};
function svg(name,spec){
  const body=renderers[spec.type](spec);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" role="img" aria-labelledby="title desc"><title id="title">'+esc(name)+'</title><desc id="desc">'+esc(spec.caption)+'</desc><rect width="720" height="280" rx="20" fill="#fbfdfa"/><rect x="1" y="1" width="718" height="278" rx="19" fill="none" stroke="#d6e6d9"/>'+body+'</svg>\n';
}
function build(){
  fs.mkdirSync(output,{recursive:true});
  const names=new Set(rows.map(row=>row.name)), ids=new Set();
  for(const [name,spec] of Object.entries(specs)){
    if(!names.has(name))throw new Error('図の対象語がCSVにありません: '+name);
    if(!spec.caption||!renderers[spec.type])throw new Error('図の設定が不正です: '+name);
  }
  const manifest={};
  for(const row of rows){
    const spec=specs[row.name];
    if(!spec)continue;
    const filename=row.id+'.svg';
    ids.add(filename);
    fs.writeFileSync(path.join(output,filename),svg(row.name,spec),'utf8');
    manifest[row.id]={src:'diagrams/'+filename,caption:spec.caption};
  }
  for(const file of fs.readdirSync(output))if(file.endsWith('.svg')&&!ids.has(file))fs.unlinkSync(path.join(output,file));
  fs.writeFileSync(path.join(root,'data','diagrams.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  fs.writeFileSync(path.join(root,'data','diagrams.js'),'window.FE_DIAGRAMS = '+JSON.stringify(manifest)+';\n','utf8');
  console.log('Diagrams: '+Object.keys(manifest).length+' terms, '+Object.keys(specs).length+' concepts');
}
if(require.main===module)build();
module.exports=build;
