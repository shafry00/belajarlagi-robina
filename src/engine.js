function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function detectDelim(t){var l=String(t).split(/\r?\n/).filter(function(x){return x.trim()!=='';})[0]||'';var c={'\t':0,';':0,',':0},q=false;for(var i=0;i<l.length;i++){var ch=l.charAt(i);if(ch==='"')q=!q;else if(!q&&c[ch]!==undefined)c[ch]++;}if(c['\t']>0)return '\t';return c[';']>c[',']?';':',';}
function parseDelim(t,d){t=String(t).replace(/^﻿/,'');d=d||detectDelim(t);var rows=[],row=[],f='',q=false,i=0,n=t.length;
  while(i<n){var ch=t.charAt(i);
    if(q){if(ch==='"'){if(t.charAt(i+1)==='"'){f+='"';i+=2;continue;}q=false;i++;continue;}f+=ch;i++;continue;}
    if(ch==='"'&&f===''){q=true;i++;continue;}
    if(ch===d){row.push(f);f='';i++;continue;}
    if(ch==='\r'){i++;continue;}
    if(ch==='\n'){row.push(f);rows.push(row);row=[];f='';i++;continue;}
    f+=ch;i++;}
  if(f!==''||row.length){row.push(f);rows.push(row);}
  return rows.filter(function(r){return r.some(function(x){return String(x).trim()!=='';});});}
function toDataset(rows){if(!rows.length)return {headers:[],rows:[],truncated:false};
  var h=rows[0].map(function(x,i){x=String(x).trim();return x||('kolom '+(i+1));});var seen={};
  h=h.map(function(x){var b=x,k=2;while(seen[x]){x=b+'_'+k;k++;}seen[x]=1;return x;});
  var body=rows.slice(1),tr=body.length>20000;if(tr)body=body.slice(0,20000);
  body=body.map(function(r){var o=[];for(var i=0;i<h.length;i++)o.push(r[i]==null?'':String(r[i]));return o;});
  return {headers:h,rows:body,truncated:tr};}
function toCSV(ds){function q(v){v=String(v);return /[",\n\r;\t]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
  return [ds.headers.map(q).join(',')].concat(ds.rows.map(function(r){return r.map(q).join(',');})).join('\n');}
function parseNum(s){if(typeof s==='number')return s;s=String(s==null?'':s).trim();if(s==='')return NaN;
  s=s.replace(/^rp\.?\s*/i,'').replace(/\s*%$/,'').replace(/\s/g,'');var neg=false;
  if(/^\(.*\)$/.test(s)){neg=true;s=s.slice(1,-1);}
  if(!/^[-+]?[\d.,]+$/.test(s))return NaN;
  var hasD=s.indexOf('.')>-1,hasC=s.indexOf(',')>-1,v;
  if(hasD&&hasC){if(s.lastIndexOf(',')>s.lastIndexOf('.'))v=s.replace(/\./g,'').replace(',','.');else v=s.replace(/,/g,'');}
  else if(hasD){if(/^[-+]?\d{1,3}(\.\d{3})+$/.test(s))v=s.replace(/\./g,'');else v=s;}
  else if(hasC){if(/^[-+]?\d{1,3}(,\d{3})+$/.test(s))v=s.replace(/,/g,'');else v=s.replace(',','.');}
  else v=s;
  var x=parseFloat(v);if(!isFinite(x))return NaN;return neg?-x:x;}
function colTypes(ds){return ds.headers.map(function(h,j){var ne=0,nn=0;ds.rows.forEach(function(r){var v=String(r[j]).trim();if(v!==''){ne++;if(!isNaN(parseNum(v)))nn++;}});return (ne>0&&nn/ne>=0.8)?'num':'txt';});}
function quality(ds){var ty=colTypes(ds),out={rows:ds.rows.length,cols:ds.headers.length,types:ty,empties:[],spaces:0,spaceCols:[],variants:[],dups:0,nonnum:[]};
  ds.headers.forEach(function(h,j){var emp=0,sp=0,nn=0,ex=[],g={},nk=0;
    ds.rows.forEach(function(r){var raw=String(r[j]),t=raw.trim();
      if(t===''){emp++;return;}
      if(raw!==t||/\s{2,}/.test(t))sp++;
      if(ty[j]==='num'){if(isNaN(parseNum(t))){nn++;if(ex.length<3)ex.push(t);}}
      else{var k=t.replace(/\s+/g,' ').toLowerCase();if(!g[k]){g[k]={};nk++;}g[k][raw]=1;}});
    if(emp)out.empties.push({col:h,count:emp});
    if(sp){out.spaces+=sp;out.spaceCols.push(h);}
    if(nn)out.nonnum.push({col:h,count:nn,examples:ex});
    if(nk<=50)Object.keys(g).forEach(function(k){var v=Object.keys(g[k]);if(v.length>1)out.variants.push({col:h,vals:v});});});
  var seen={};ds.rows.forEach(function(r){var k=r.join('\u0001');if(seen[k])out.dups++;else seen[k]=1;});
  out.total=out.empties.reduce(function(a,b){return a+b.count;},0)+out.spaces+out.variants.length+out.nonnum.reduce(function(a,b){return a+b.count;},0)+out.dups;
  return out;}
function cleanData(ds,o){o=o||{};var ty=colTypes(ds),rows=ds.rows.map(function(r){return r.slice();});
  if(o.trim)rows.forEach(function(r){r.forEach(function(v,j){r[j]=String(v).trim().replace(/\s{2,}/g,' ');});});
  if(o.casefix)ds.headers.forEach(function(h,j){if(ty[j]!=='txt')return;var g={},order=[];
    rows.forEach(function(r){var t=String(r[j]).trim();if(t==='')return;var k=t.replace(/\s+/g,' ').toLowerCase();if(!g[k]){g[k]={};order.push(k);}g[k][t]=(g[k][t]||0)+1;});
    if(order.length>50)return;var best={};
    order.forEach(function(k){var bv=null,bc=-1;Object.keys(g[k]).forEach(function(v){if(g[k][v]>bc){bc=g[k][v];bv=v;}});best[k]=bv;});
    rows.forEach(function(r){var t=String(r[j]).trim();if(t==='')return;r[j]=best[t.replace(/\s+/g,' ').toLowerCase()];});});
  if(o.dropEmpty)rows=rows.filter(function(r){return !ds.headers.some(function(h,j){return ty[j]==='num'&&String(r[j]).trim()==='';});});
  if(o.dropDup){var seen={};rows=rows.filter(function(r){var k=r.join('\u0001');if(seen[k])return false;seen[k]=1;return true;});}
  return {headers:ds.headers.slice(),rows:rows,truncated:ds.truncated};}
function aggName(m){return {sum:'Jumlah',avg:'Rata-rata',min:'Terkecil',max:'Terbesar',count:'Banyak baris'}[m.agg]||m.agg;}
function aggLabel(m){return m.agg==='count'?'Banyak baris':aggName(m)+' '+m.col;}
function aggregate(ds,cfg){var H=ds.headers,gi=cfg.group?H.indexOf(cfg.group):-1,fi=cfg.fcol?H.indexOf(cfg.fcol):-1;
  if(cfg.group&&gi<0)return {error:'Kolom kelompok "'+cfg.group+'" tidak ada di data.'};
  if(cfg.fcol&&fi<0)return {error:'Kolom saringan "'+cfg.fcol+'" tidak ada di data.'};
  var m1=cfg.m1,m2=cfg.m2&&cfg.m2.agg?cfg.m2:null;
  if(!m1||!m1.agg)return {error:'Pilih ukuran pertama.'};
  function ix(m){if(!m||m.agg==='count')return -1;return H.indexOf(m.col);}
  var i1=ix(m1),i2=ix(m2);
  if(m1.agg!=='count'&&i1<0)return {error:'Kolom angka "'+m1.col+'" tidak ada di data.'};
  if(m2&&m2.agg!=='count'&&i2<0)return {error:'Kolom angka "'+m2.col+'" tidak ada di data.'};
  var rows=ds.rows.filter(function(r){return fi<0||String(r[fi])===String(cfg.fval);});
  function ag(list,m,i){if(m.agg==='count')return list.length;var v=[];list.forEach(function(r){var x=parseNum(r[i]);if(!isNaN(x))v.push(x);});
    if(!v.length)return m.agg==='sum'?0:NaN;
    if(m.agg==='sum')return v.reduce(function(a,b){return a+b;},0);
    if(m.agg==='avg')return v.reduce(function(a,b){return a+b;},0)/v.length;
    if(m.agg==='min')return Math.min.apply(null,v);
    return Math.max.apply(null,v);}
  var rel=m2?(cfg.rel||'none'):'none';
  function rv(a,b){if(rel==='minus')return a-b;if(rel==='plus')return a+b;if(rel==='pct')return b?(a-b)/b*100:NaN;return a;}
  var order=[],map={};
  rows.forEach(function(r){var k=gi<0?'Semua':(String(r[gi]).trim()===''?'(kosong)':String(r[gi]));if(!map[k]){map[k]=[];order.push(k);}map[k].push(r);});
  var res={keys:order,n:[],v1:[],v2:[],main:[],rel:rel,hasM2:!!m2,group:cfg.group||'',m1:m1,m2:m2,
    mainLabel:rel==='minus'?'Selisih (1 − 2)':rel==='plus'?'Total (1 + 2)':rel==='pct'?'Selisih % ((1 − 2) ÷ 2)':aggLabel(m1),
    l1:aggLabel(m1),l2:m2?aggLabel(m2):'',mainIsPct:rel==='pct'};
  order.forEach(function(k){var l=map[k],a=ag(l,m1,i1),b=m2?ag(l,m2,i2):NaN;res.n.push(l.length);res.v1.push(a);res.v2.push(b);res.main.push(m2?rv(a,b):a);});
  var ta=ag(rows,m1,i1),tb=m2?ag(rows,m2,i2):NaN;
  res.totals={n:rows.length,v1:ta,v2:tb,main:m2?rv(ta,tb):ta};
  res.headers=[cfg.group||'Semua','Baris',res.l1].concat(m2?[res.l2,res.mainLabel]:[]);
  return res;}
function fmtNum(n,mode){if(n==null||isNaN(n))return '–';var neg=n<0,a=Math.abs(n);
  var d=mode==='pct'?2:(Math.abs(a-Math.round(a))<1e-9?0:2);
  var s=new Intl.NumberFormat('id-ID',{maximumFractionDigits:d,minimumFractionDigits:0}).format(a);
  if(mode==='rp')s='Rp'+s;if(mode==='pct')s=s+'%';return (neg?'−':'')+s;}
function autoMode(res,pref){if(pref&&pref!=='auto')return pref;if(res.m1&&res.m1.agg==='count')return 'num';
  return /biaya|total|omzet|harga|penjualan|setoran|rp|rupiah|bayar|gaji|payroll|tagihan|revenue|pendapatan/i.test(res.m1.col||'')?'rp':'num';}
function chartSVG(type,labels,values,fmt){var n=values.length;if(!n)return '<p class="mut">Belum ada data untuk digambar.</p>';
  var W=640,H=300,pl=62,pr=16,pt=22,pb=n>6?74:46,pw=W-pl-pr,ph=H-pt-pb;
  var vv=values.map(function(x){return isNaN(x)?0:x;}),mx=Math.max.apply(null,vv.concat([0])),mn=Math.min.apply(null,vv.concat([0]));
  if(mx===mn)mx=mn+1;
  var raw=(mx-mn)/4,pw10=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)),f=raw/pw10,st=(f<=1?1:f<=2?2:f<=5?5:10)*pw10;
  var top=Math.ceil(mx/st)*st,bot=Math.floor(mn/st)*st;if(top===bot)top=bot+st;
  function Y(v){return pt+ph-(v-bot)/(top-bot)*ph;}
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" class="chart" xmlns="http://www.w3.org/2000/svg">',t;
  for(t=bot;t<=top+st/2;t+=st){var y=Y(t);s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" class="grid"/><text x="'+(pl-8)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" class="ax">'+esc(fmt(t))+'</text>';}
  var zy=Y(0);s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+zy.toFixed(1)+'" y2="'+zy.toFixed(1)+'" class="zero"/>';
  var slot=pw/n,i,cx,lab;
  if(type==='line'){var pts=vv.map(function(v,i){return [pl+slot*(i+0.5),Y(v)];});
    var d=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
    s+='<path d="'+d+' L'+pts[n-1][0].toFixed(1)+' '+zy.toFixed(1)+' L'+pts[0][0].toFixed(1)+' '+zy.toFixed(1)+' Z" class="area"/><path d="'+d+'" class="line"/>';
    pts.forEach(function(p,i){s+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.5" class="dot"/>';
      if(n<=10||i===n-1||vv[i]===mx)s+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]-9).toFixed(1)+'" text-anchor="middle" class="val">'+esc(fmt(vv[i]))+'</text>';});}
  else{var bw=Math.min(54,slot*0.62);
    vv.forEach(function(v,i){var x=pl+slot*(i+0.5)-bw/2,y1=Y(Math.max(v,0)),h=Math.abs(Y(v)-zy);
      s+='<rect x="'+x.toFixed(1)+'" y="'+y1.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(h,1).toFixed(1)+'" rx="3" class="bar'+(v<0?' neg':'')+'"/>';
      if(n<=12)s+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(v>=0?y1-6:y1+h+13).toFixed(1)+'" text-anchor="middle" class="val">'+esc(fmt(v))+'</text>';});}
  var rot=n>6;
  labels.forEach(function(l,i){cx=pl+slot*(i+0.5);lab=String(l);if(lab.length>12)lab=lab.slice(0,11)+'…';
    if(n>16&&i%2)return;
    s+=rot?'<text transform="translate('+cx.toFixed(1)+' '+(H-pb+16)+') rotate(-35)" text-anchor="end" class="ax">'+esc(lab)+'</text>':'<text x="'+cx.toFixed(1)+'" y="'+(H-pb+20)+'" text-anchor="middle" class="ax">'+esc(lab)+'</text>';});
  return s+'</svg>';}
function dashCSS(){return '.dbx{--bg:#F3F6FB;--card:#FFFFFF;--ink:#0F1B33;--mut:#52627A;--line:#D6DFEE;--neg:#C62828;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);padding:20px;border-radius:14px;line-height:1.45}'+
 '.dbx *{box-sizing:border-box}.dbx h1{font-size:24px;margin:0 0 4px}.dbx h2{font-size:15px;margin:0 0 10px}.dbx .sub{margin:0 0 16px;color:var(--mut);font-size:14px}'+
 '.dbx .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:14px}.dbx .kpi{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:10px;padding:12px 14px}'+
 '.dbx .kpi span{display:block;font-size:12px;color:var(--mut)}.dbx .kpi b{display:block;font-size:22px;margin-top:2px;font-variant-numeric:tabular-nums}'+
 '.dbx .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:14px}.dbx .chart{width:100%;height:auto;display:block}'+
 '.dbx .grid{stroke:var(--line);stroke-width:1}.dbx .zero{stroke:var(--mut);stroke-width:1}.dbx .ax{fill:var(--mut);font-size:11px}.dbx .val{fill:var(--ink);font-size:11px;font-weight:700}'+
 '.dbx .bar,.dbx .dot{fill:var(--accent)}.dbx .bar.neg{fill:var(--neg)}.dbx .line{fill:none;stroke:var(--accent);stroke-width:2.5}.dbx .area{fill:var(--accent);opacity:.14}'+
 '.dbx .tw{overflow-x:auto}.dbx table{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums}.dbx th,.dbx td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}'+
 '.dbx th:first-child,.dbx td:first-child{text-align:left}.dbx th{color:var(--mut);font-weight:700;font-size:12px}.dbx tfoot td{font-weight:800;border-top:2px solid var(--line)}.dbx td.neg{color:var(--neg)}'+
 '.dbx footer{font-size:12px;color:var(--mut)}.dbx .mut{color:var(--mut)}';}
function buildModel(res,o){var base=autoMode(res,o.unit),mainMode=res.mainIsPct?'pct':(res.rel==='none'?base:base);
  var F=function(v){return fmtNum(v,mainMode);},B=function(v){return fmtNum(v,base);};
  var best=-1,low=-1;res.main.forEach(function(v,i){if(isNaN(v))return;if(best<0||v>res.main[best])best=i;if(low<0||v<res.main[low])low=i;});
  var avg=res.main.filter(function(v){return !isNaN(v);});avg=avg.length?avg.reduce(function(a,b){return a+b;},0)/avg.length:NaN;
  var all={total:{l:(res.rel==='none'?res.mainLabel:res.mainLabel)+' (keseluruhan)',v:F(res.totals.main)},
    avg:{l:'Rata-rata per '+(res.group||'kelompok'),v:F(avg)},
    max:{l:'Tertinggi'+(best>=0?': '+res.keys[best]:''),v:best>=0?F(res.main[best]):'–'},
    min:{l:'Terendah'+(low>=0?': '+res.keys[low]:''),v:low>=0?F(res.main[low]):'–'},
    n:{l:'Jumlah '+(res.group||'kelompok'),v:fmtNum(res.keys.length,'num')},
    rows:{l:'Baris data dipakai',v:fmtNum(res.totals.n,'num')}};
  var kp=(o.kpis||['total','max','n']).filter(function(k){return all[k];}).map(function(k){return all[k];});
  var head=res.headers.slice(),body=res.keys.map(function(k,i){var r=[k,fmtNum(res.n[i],'num'),B(res.v1[i])];if(res.hasM2){r.push(B(res.v2[i]));r.push(F(res.main[i]));}return r;});
  var foot=['Total',fmtNum(res.totals.n,'num'),B(res.totals.v1)];if(res.hasM2){foot.push(B(res.totals.v2));foot.push(F(res.totals.main));}
  return {title:o.title||'Dashboard',sub:o.sub||'',chart:o.chart==='line'?'line':'bar',kpis:kp,labels:res.keys,values:res.main,mainLabel:res.mainLabel,
    head:head,body:body,foot:foot,mainMode:mainMode,accent:o.accent||'#1F5FD6',note:o.note||'',negCol:res.hasM2?head.length-1:-1,raw:o.raw||null};}
function dashBody(m){var f=function(v){return fmtNum(v,m.mainMode);};
  var h='<div class="dbx" style="--accent:'+esc(m.accent)+'"><header><h1>'+esc(m.title)+'</h1>'+(m.sub?'<p class="sub">'+esc(m.sub)+'</p>':'')+'</header>';
  if(m.kpis.length)h+='<section class="kpis">'+m.kpis.map(function(k){return '<div class="kpi"><span>'+esc(k.l)+'</span><b>'+esc(k.v)+'</b></div>';}).join('')+'</section>';
  h+='<section class="card"><h2>'+esc(m.mainLabel)+' per '+esc(m.head[0])+'</h2>'+chartSVG(m.chart,m.labels,m.values,f)+'</section>';
  h+='<section class="card"><h2>Tabel hasil</h2><div class="tw"><table><thead><tr>'+m.head.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'</tr></thead><tbody>'+
    m.body.map(function(r){return '<tr>'+r.map(function(c,j){return '<td'+(j===m.negCol&&/^−/.test(c)?' class="neg"':'')+'>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+
    '</tbody><tfoot><tr>'+m.foot.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr></tfoot></table></div></section>';
  if(m.raw)h+='<section class="card"><h2>Data mentah (maks 200 baris)</h2><div class="tw"><table><thead><tr>'+m.raw.headers.map(function(x){return '<th>'+esc(x)+'</th>';}).join('')+'</tr></thead><tbody>'+
    m.raw.rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div></section>';
  if(m.note)h+='<footer>'+esc(m.note)+'</footer>';
  return h+'</div>';}
async function inflateRaw(u8){var ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer());}
async function xlsxToRows(buf){var u8=new Uint8Array(buf),dv=new DataView(buf),i,eocd=-1;
  for(i=u8.length-22;i>=Math.max(0,u8.length-70000);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw new Error('Berkas ini bukan .xlsx yang valid. Simpan ulang sebagai .xlsx atau .csv.');
  var cnt=dv.getUint16(eocd+10,true),off=dv.getUint32(eocd+16,true),files={},p=off,td=new TextDecoder('utf-8');
  for(i=0;i<cnt;i++){if(dv.getUint32(p,true)!==0x02014b50)break;var meth=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=td.decode(u8.subarray(p+46,p+46+nl));
    files[name]={meth:meth,cs:cs,lo:lo};p+=46+nl+el+cl;}
  async function read(name){var f=files[name];if(!f)return null;var l=f.lo,nl2=dv.getUint16(l+26,true),el2=dv.getUint16(l+28,true),s=l+30+nl2+el2,data=u8.subarray(s,s+f.cs);
    if(f.meth===0)return td.decode(data);if(f.meth===8)return td.decode(await inflateRaw(data));throw new Error('Format kompresi .xlsx tidak didukung.');}
  function xml(t){return new DOMParser().parseFromString(t,'text/xml');}
  var wbT=await read('xl/workbook.xml');if(!wbT)throw new Error('Isi .xlsx tidak lengkap. Coba simpan ulang dari Excel atau Google Sheets.');
  var sheetPath='xl/worksheets/sheet1.xml',wb=xml(wbT),sh=wb.getElementsByTagName('sheet')[0],relsT=await read('xl/_rels/workbook.xml.rels');
  if(sh&&relsT){var rid=sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),rels=xml(relsT).getElementsByTagName('Relationship');
    for(i=0;i<rels.length;i++){if(rels[i].getAttribute('Id')===rid){var tg=rels[i].getAttribute('Target');sheetPath=tg.charAt(0)==='/'?tg.slice(1):'xl/'+tg.replace(/^\.\//,'');}}}
  var shT=await read(sheetPath);if(!shT)throw new Error('Lembar pertama tidak ditemukan di berkas .xlsx.');
  var ss=[],ssT=await read('xl/sharedStrings.xml');
  if(ssT){var sis=xml(ssT).getElementsByTagName('si');for(i=0;i<sis.length;i++){var ts=sis[i].getElementsByTagName('t'),z='';for(var k=0;k<ts.length;k++)z+=ts[k].textContent;ss.push(z);}}
  var rowsEl=xml(shT).getElementsByTagName('row'),out=[];
  function colIdx(ref){var m=/^([A-Z]+)/.exec(ref||'');if(!m)return -1;var n=0;for(var q=0;q<m[1].length;q++)n=n*26+(m[1].charCodeAt(q)-64);return n-1;}
  for(i=0;i<rowsEl.length;i++){var cs2=rowsEl[i].getElementsByTagName('c'),row=[],last=-1;
    for(var c=0;c<cs2.length;c++){var ce=cs2[c],ci=colIdx(ce.getAttribute('r'));if(ci<0)ci=last+1;while(row.length<ci)row.push('');
      var t=ce.getAttribute('t'),v=ce.getElementsByTagName('v')[0],val='';
      if(t==='s'&&v)val=ss[parseInt(v.textContent,10)]||'';
      else if(t==='inlineStr'){var it=ce.getElementsByTagName('t');for(var u=0;u<it.length;u++)val+=it[u].textContent;}
      else if(v)val=v.textContent;
      if(t==='b')val=val==='1'?'TRUE':'FALSE';
      row[ci]=val;last=ci;}
    out.push(row);}
  if(out.length){var hd=out[0];for(i=1;i<out.length;i++)for(var j=0;j<hd.length;j++){if(/tanggal|tgl|date/i.test(hd[j])&&/^\d{5}(\.\d+)?$/.test(String(out[i][j]||''))){var sn=parseFloat(out[i][j]);if(sn>20000&&sn<80000){var dt=new Date(Math.round((sn-25569)*86400000));out[i][j]=dt.toISOString().slice(0,10);}}}}
  return out;}
async function fileToRows(file){var name=(file.name||'').toLowerCase();
  if(/\.xlsx$|\.xlsm$/.test(name))return xlsxToRows(await file.arrayBuffer());
  if(/\.xls$/.test(name))throw new Error('Format .xls lama tidak bisa dibaca. Simpan ulang sebagai .xlsx atau .csv.');
  return parseDelim(new TextDecoder('utf-8').decode(await file.arrayBuffer()));}
