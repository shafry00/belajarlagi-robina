(function(){
'use strict';
var KEY='s3-praktik-v2',DL=null,MCP=null;
function $(id){return document.getElementById(id);}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function rowsCSV(a){return a.map(function(r){return r.join(',');}).join('\n');}

var CASES=[
{id:'pengingat',name:'Pengingat laporan harian divisi',desc:'Temukan divisi yang belum mengirim laporan hari ini, lalu ingatkan.',tag:'ok',
 canvas:{nama:'Pengingat laporan harian divisi',masalah:'Aku mengingatkan dan memeriksa laporan tiap divisi secara manual setiap hari, dan ada yang terlewat.',pengguna:'Koordinator tim',input:'Daftar divisi dengan kolom divisi, penanggung_jawab, status (Sudah atau Belum)',l1:'Baca daftar status laporan',l2:'Saring divisi yang statusnya Belum',l3:'Siapkan daftar divisi yang perlu diingatkan',output:'Daftar divisi yang belum melapor beserta jumlahnya',aturan:'Status hanya Sudah atau Belum. Penulisan status harus seragam. Sel kosong ditandai, tidak ditebak.'},
 rows:[['divisi','penanggung_jawab','status'],['Housekeeping','Rina','Sudah'],['Front Office','Budi','Belum'],['F&B','Sari','Belum']],
 dirty:{col:2,row:2,nodup:true},
 cfg:{group:'divisi',fcol:'status',fval:'Belum',m1:{col:'divisi',agg:'count'},rel:'none'},key:2,keyLabel:'Jumlah divisi yang perlu diingatkan (status Belum)',unit:'num',
 nodes:['Daftar status laporan tiap divisi','Disaring: status Belum','Daftar divisi yang perlu diingatkan'],dash:'Divisi yang belum melapor',dsub:'Data contoh fiktif'},
{id:'reservasi',name:'Rekap reservasi per tipe kamar',desc:'Jumlahkan pendapatan tiap tipe kamar dari daftar reservasi.',tag:'ok',
 canvas:{nama:'Rekap reservasi per tipe kamar',masalah:'Tiap hari aku menjumlah reservasi per tipe kamar secara manual dan sering salah hitung.',pengguna:'Supervisor front office',input:'Daftar reservasi dengan kolom kode, tipe_kamar, malam, total',l1:'Baca daftar reservasi',l2:'Kelompokkan menurut tipe kamar',l3:'Jumlahkan total tiap tipe',output:'Tabel total pendapatan per tipe kamar dan total keseluruhan',aturan:'Penulisan tipe kamar harus seragam. Baris dobel dibuang. Total harus cocok dengan hitungan manual.'},
 rows:[['kode','tipe_kamar','malam','total'],['R001','Deluxe','2','1100000'],['R002','Deluxe','1','550000'],['R003','Deluxe','1','550000'],['R004','Superior','1','650000'],['R005','Suite','1','1800000']],
 dirty:{col:1,row:2,nodup:false},
 cfg:{group:'tipe_kamar',m1:{col:'total',agg:'sum'},rel:'none'},key:4650000,keyLabel:'Total pendapatan semua reservasi (Rp)',unit:'rp',
 nodes:['Daftar reservasi','Dikelompokkan per tipe kamar','Total per tipe + total semua'],dash:'Pendapatan per tipe kamar',dsub:'Data contoh fiktif'},
{id:'okupansi',name:'Laporan omzet bulanan',desc:'Ringkas omzet Januari sampai Juni untuk 50 kamar.',tag:'ok',
 canvas:{nama:'Laporan omzet bulanan',masalah:'Angka omzet tiap bulan tersebar di beberapa file dan aku menyatukannya manual.',pengguna:'Revenue dan manajemen',input:'Tabel bulanan dengan kolom bulan, kamar_tersedia, kamar_terjual, omzet_juta',l1:'Baca tabel bulanan',l2:'Kelompokkan menurut bulan',l3:'Jumlahkan omzet per bulan',output:'Tabel omzet per bulan dan total enam bulan',aturan:'Satuan omzet dalam juta rupiah. Setiap bulan muncul satu kali.'},
 rows:[['bulan','kamar_tersedia','kamar_terjual','omzet_juta'],['Jan','1550','940','611'],['Feb','1400','980','637'],['Mar','1550','1080','756'],['Apr','1500','1060','742'],['Mei','1550','1240','868'],['Jun','1500','1280','960']],
 dirty:{col:0,row:2,nodup:false},
 cfg:{group:'bulan',m1:{col:'omzet_juta',agg:'sum'},rel:'none'},key:4574,keyLabel:'Total omzet enam bulan (juta Rp)',unit:'num',
 nodes:['Tabel bulanan','Dikelompokkan per bulan','Omzet per bulan + total'],dash:'Omzet per bulan (juta Rp)',dsub:'Data contoh fiktif, 50 kamar'},
{id:'rekon',name:'Cek tagihan vs pembayaran',desc:'Bandingkan tagihan dengan yang sudah dibayar tiap departemen.',tag:'ok',
 canvas:{nama:'Cek tagihan vs pembayaran',masalah:'Mencocokkan tagihan dan pembayaran tiap departemen memakan waktu dan rawan terlewat.',pengguna:'Tim finance dan audit',input:'Daftar tagihan dengan kolom kode, departemen, tagihan, dibayar',l1:'Baca daftar tagihan',l2:'Kelompokkan menurut departemen',l3:'Hitung selisih tagihan dan pembayaran',output:'Tabel selisih per departemen dan total selisih',aturan:'Selisih = tagihan dikurangi dibayar. Departemen dengan selisih di atas nol ditandai untuk dicek.'},
 rows:[['kode','departemen','tagihan','dibayar'],['T01','Restoran','2400000','2400000'],['T02','Restoran','1800000','1500000'],['T03','Laundry','600000','600000'],['T04','Spa','1200000','900000'],['T05','Laundry','450000','450000'],['T06','Spa','800000','800000']],
 dirty:{col:1,row:2,nodup:false},
 cfg:{group:'departemen',m1:{col:'tagihan',agg:'sum'},m2:{col:'dibayar',agg:'sum'},rel:'minus'},key:600000,keyLabel:'Total selisih yang belum dibayar (Rp)',unit:'rp',
 nodes:['Daftar tagihan','Dikelompokkan per departemen','Selisih per departemen'],dash:'Selisih tagihan per departemen',dsub:'Data contoh fiktif'},
{id:'forecast',name:'Forecast vs realisasi kamar',desc:'Seberapa meleset perkiraan kamar terjual dari kenyataan. Versi kecil: satu minggu.',tag:'small',
 canvas:{nama:'Forecast vs realisasi kamar',masalah:'Aku ingin tahu seberapa meleset perkiraan kamar terjual dibanding kenyataan.',pengguna:'Revenue manager',input:'Tabel harian dengan kolom hari, forecast_kamar, realisasi_kamar',l1:'Baca tabel harian',l2:'Jumlahkan forecast dan realisasi',l3:'Hitung selisih dalam persen',output:'Tabel selisih persen per hari dan selisih persen keseluruhan',aturan:'Selisih persen = (forecast dikurangi realisasi) dibagi realisasi.'},
 rows:[['hari','forecast_kamar','realisasi_kamar'],['Sen','40','36'],['Sel','38','40'],['Rab','42','41'],['Kam','45','47'],['Jum','50','52'],['Sab','55','50'],['Min','48','49']],
 dirty:{col:0,row:2,nodup:false},
 cfg:{group:'hari',m1:{col:'forecast_kamar',agg:'sum'},m2:{col:'realisasi_kamar',agg:'sum'},rel:'pct'},key:0.95,keyLabel:'Selisih keseluruhan dalam persen (isi 0,95 kalau hitunganmu 0,95%)',unit:'num',
 nodes:['Tabel harian','Forecast dan realisasi dijumlah','Selisih persen'],dash:'Selisih forecast vs realisasi (%)',dsub:'Data contoh fiktif, satu minggu'},
{id:'keluhan',name:'Rekap keluhan tamu',desc:'Hitung keluhan per kategori dan rata-rata lama penyelesaiannya. Versi kecil.',tag:'small',
 canvas:{nama:'Rekap keluhan tamu',masalah:'Catatan keluhan tamu menumpuk dan aku susah melihat kategori yang paling sering muncul.',pengguna:'Guest relation',input:'Log keluhan dengan kolom kode, kategori, menit_selesai',l1:'Baca log keluhan',l2:'Kelompokkan menurut kategori',l3:'Hitung banyaknya dan rata-rata menit',output:'Tabel kategori dengan jumlah keluhan dan rata-rata menit penyelesaian',aturan:'Satu baris satu keluhan. Nama tamu tidak dimasukkan.'},
 rows:[['kode','kategori','menit_selesai'],['K01','Kebersihan','20'],['K02','AC','45'],['K03','Kebersihan','15'],['K04','Wifi','30'],['K05','AC','60'],['K06','Kebersihan','25'],['K07','Wifi','10']],
 dirty:{col:1,row:2,nodup:false},
 cfg:{group:'kategori',m1:{col:'kode',agg:'count'},m2:{col:'menit_selesai',agg:'avg'},rel:'none'},key:7,keyLabel:'Jumlah seluruh keluhan',unit:'num',
 nodes:['Log keluhan','Dikelompokkan per kategori','Jumlah dan rata-rata menit'],dash:'Keluhan per kategori',dsub:'Data contoh fiktif'}
];
var STEPS=[['mulai','Mulai','Anggapan dan studi kasus'],['alur','Alur','Susun alur kerja'],['data','Data','Siapkan data'],['tes','Jalankan','Jalankan dan tes'],['dashboard','Dashboard','Bikin dashboard'],['kumpulkan','Kumpulkan','Kumpulkan hasil']];
var HOMECARDS=[['sparkles','Mulai','Anggapan dan pilih studi kasus yang mirip pekerjaanmu.'],['route','Alur','Susun alur kerja: data masuk, diolah, hasil keluar.'],['database','Data','Siapkan data contoh, atau datamu sendiri.'],['play','Jalankan','Jalankan workflow lalu cocokkan dengan jawaban yang kamu tahu.'],['layout-dashboard','Dashboard','Opsional: bikin papan angka sederhana dari hasilmu.'],['send','Kumpulkan','Susun ringkasan, lalu kirim ke Workflow Canvas.']];
var CARDGRAD=['linear-gradient(135deg,#6C63D8,#8B7FF0)','linear-gradient(135deg,#4F8EF0,#7FB3F5)','linear-gradient(135deg,#2FB6A3,#6FD6C4)','linear-gradient(135deg,#9A5BD6,#C08BE8)','linear-gradient(135deg,#F0A64F,#F5C878)','linear-gradient(135deg,#D6478F,#F0A0C8)'];
function ic(){try{if(window.lucide)lucide.createIcons();}catch(e){}}
var KPIS=[['total','Total keseluruhan'],['avg','Rata-rata per kelompok'],['max','Tertinggi'],['min','Terendah'],['n','Jumlah kelompok'],['rows','Baris data dipakai']];
var CF=['nama','masalah','pengguna','input','l1','l2','l3','output','aturan'];

function fresh(){return {v:2,i:0,caseId:'',canvas:{},src:'sample',dirty:false,ds:null,srcInfo:'',clean:{trim:false,casefix:false,dropEmpty:false,dropDup:false},cfg:null,unit:'auto',expected:'',tested:null,notes:{n1:'',n2:'',n3:''},dash:{title:'',sub:'',chart:'bar',accent:'#1F5FD6',kpis:['total','max','n'],raw:false,note:''},flags:{},ranAt:'',dashAt:''};}
var S=fresh();
function save(){lsSet(KEY,JSON.stringify(Object.assign({},S,{ds:null})));
  if(S.ds){if(!lsSet(KEY+'-ds',JSON.stringify(S.ds))){$('msgData').textContent='Data terlalu besar untuk disimpan di browser. Tetap bisa dipakai selama halaman ini terbuka.';$('msgData').className='msg bad';}}else lsDel(KEY+'-ds');}
function load(){try{var a=lsGet(KEY);if(a){var o=JSON.parse(a);if(o&&o.v===2){S=Object.assign(fresh(),o);S.clean=Object.assign(fresh().clean,o.clean||{});S.dash=Object.assign(fresh().dash,o.dash||{});S.notes=Object.assign(fresh().notes,o.notes||{});S.flags=o.flags||{};}}
  var d=lsGet(KEY+'-ds');if(d){var x=JSON.parse(d);if(x&&x.headers&&x.rows)S.ds=x;}}catch(e){S=fresh();}}
function CASE(){for(var i=0;i<CASES.length;i++)if(CASES[i].id===S.caseId)return CASES[i];return null;}
function T(x){return esc(x);}
function say(id,t,k){var e=$(id);e.textContent=t||'';e.className='msg'+(k?' '+k:'');}
function stamp(){return new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}).replace('.',':');}
function tbl(h,rows,o){o=o||{};return '<div class="tw"><table><thead><tr>'+h.map(function(x,j){return '<th'+(j>0&&o.num!==false?' class="r"':'')+'>'+T(x)+'</th>';}).join('')+'</tr></thead><tbody>'+
  rows.map(function(r,i){return '<tr'+(o.cls&&o.cls[i]?' class="'+o.cls[i]+'"':'')+'>'+r.map(function(c,j){return '<td'+(j>0&&o.num!==false?' class="r"':'')+'>'+T(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody>'+
  (o.foot?'<tfoot><tr>'+o.foot.map(function(c,j){return '<td'+(j>0?' class="r"':'')+'>'+T(c)+'</td>';}).join('')+'</tr></tfoot>':'')+'</table></div>';}
function show(el,on){el.hidden=!on;}

/* splash + home hub */
function drawHomeMenu(){$('homeMenu').innerHTML=HOMECARDS.map(function(c,i){return '<button type="button" class="mcard" data-i="'+i+'"><span class="ico" style="background:'+CARDGRAD[i]+'"><i data-lucide="'+c[0]+'"></i></span><span class="no">LANGKAH '+(i+1)+' DARI 6</span><b>'+T(c[1])+'</b><span>'+T(c[2])+'</span></button>';}).join('');ic();}
function enterApp(i){$('home').classList.remove('in');setTimeout(function(){show($('home'),false);show($('appview'),true);show($('navbar'),true);go(i);},180);}
function showHome(){show($('appview'),false);show($('navbar'),false);show($('home'),true);requestAnimationFrame(function(){requestAnimationFrame(function(){$('home').classList.add('in');});});}
function splash(){var h=location.hash.replace('#',''),i=-1;for(var k=0;k<6;k++)if(STEPS[k][0]===h)i=k;
  setTimeout(function(){$('loading').classList.add('hide');if(i>-1){show($('home'),false);show($('appview'),true);show($('navbar'),true);go(i,true);}else showHome();},i>-1?500:1100);}

/* stepper */
function drawStepper(){var h='';STEPS.forEach(function(s,i){var done=doneStep(i);h+='<button type="button" class="st'+(done?' done':'')+'" data-i="'+i+'"'+(i===S.i?' aria-current="step"':'')+'><span class="n">'+(done?'✓':(i+1))+'</span><span class="t">'+T(s[1])+'</span></button>';});$('stepper').innerHTML=h;
  $('stepname').textContent='Langkah '+(S.i+1)+' dari 6: '+STEPS[S.i][2];
  $('prev').disabled=S.i===0;$('next').hidden=S.i===5;}
function doneStep(i){var f=S.flags;return [!!f.case,!!f.flow,!!S.ds,!!f.run,!!f.dash,!!f.sum][i];}
function go(i,noscroll){S.i=Math.max(0,Math.min(5,i));qa('.panel').forEach(function(p){p.hidden=+p.getAttribute('data-i')!==S.i;});drawStepper();
  try{history.replaceState(null,'','#'+STEPS[S.i][0]);}catch(e){}
  if(S.i===3)fillRunForm();if(S.i===4)fillDashForm();if(S.i===5)drawDone();
  save();if(!noscroll)try{window.scrollTo(0,0);}catch(e){}}

/* step 1 */
function drawCases(){$('caseGrid').innerHTML=CASES.map(function(c){return '<label class="case"><input type="radio" name="case" value="'+c.id+'"'+((S.caseId===c.id||(!S.caseId&&c===CASES[0]))?' checked':'')+'><b>'+T(c.name)+'</b><small>'+T(c.desc)+'</small><span class="tag '+c.tag+'">'+(c.tag==='ok'?'Cocok hari ini':'Mulai dari versi kecil')+'</span></label>';}).join('');}
function renderCase(){var c=CASE(),r=$('resCase');if(!c||!S.flags.case){show(r,false);return;}
  r.innerHTML='<div class="reshead"><span class="pill">Studi kasus terpilih</span><span class="stamp">'+T(c.name)+'</span></div>'+
  '<div class="flow"><div class="node"><div class="c">Data masuk</div><p>'+T(c.nodes[0])+'</p></div><span class="arrow">➜</span><div class="node a"><div class="c">Diolah</div><p>'+T(c.nodes[1])+'</p></div><span class="arrow">➜</span><div class="node"><div class="c">Hasil</div><p>'+T(c.nodes[2])+'</p></div></div>'+
  '<div><h3>Data contoh untuk kasus ini</h3>'+tbl(c.rows[0],c.rows.slice(1,6),{num:false})+'</div>'+
  '<p class="mut" style="margin:0">Target tes nanti: <b>'+T(c.keyLabel)+'</b>. Hitung sendiri di kertas dulu kalau mau menantang diri.</p>';
  show(r,true);}
function startCase(){var sel=document.querySelector('input[name="case"]:checked');if(!sel){say('msgCase','Pilih satu studi kasus dulu.','bad');return;}
  var changed=S.caseId!==sel.value;S.caseId=sel.value;var c=CASE();
  if(changed||!S.canvas.nama){S.canvas=Object.assign({},c.canvas);S.ds=null;S.cfg=null;S.unit=c.unit;S.expected='';S.tested=null;S.flags={case:true};S.dash.title=c.dash;S.dash.sub=c.dsub;S.dash.kpis=['total','max','n'];S.notes={n1:'',n2:'',n3:''};
    S.clean={trim:false,casefix:false,dropEmpty:false,dropDup:false};drawCanvas();clearResults();}
  S.flags.case=true;say('msgCase','Studi kasus siap. Canvas di langkah 2 sudah terisi.','ok');renderCase();drawStepper();save();}
function clearResults(){['resFlow','resData','resRun','resTest','resDash','resSum'].forEach(function(id){show($(id),false);});['cardTest','cardNotes'].forEach(function(id){show($(id),false);});}

/* step 2 */
function drawCanvas(){CF.forEach(function(k){$('c-'+k).value=S.canvas[k]||'';});}
function missingCanvas(){var m=[];['nama','masalah','input','l1','l2','l3','output','aturan'].forEach(function(k){if(!String(S.canvas[k]||'').trim())m.push(k);});return m;}
var LAB={nama:'Nama workflow',masalah:'Masalah',pengguna:'Pengguna',input:'Data masuk',l1:'Langkah 1',l2:'Langkah 2',l3:'Langkah 3',output:'Hasil',aturan:'Aturan'};
function promptWF(){var c=S.canvas;return 'Aku mau menyusun workflow bernama "'+(c.nama||'...')+'".\nMasalah: '+(c.masalah||'...')+'\n'+(c.pengguna?'Pemakai hasil: '+c.pengguna+'\n':'')+'Data masuk: '+(c.input||'...')+'\nLangkah:\n1. '+(c.l1||'...')+'\n2. '+(c.l2||'...')+'\n3. '+(c.l3||'...')+'\nHasil yang diharapkan: '+(c.output||'...')+'\nAturan: '+(c.aturan||'...')+'\n\nPakai data contoh saja, jangan data asli.\nKerjakan satu langkah per balasan dan tunjukkan hasil antaranya.\nKalau ada yang kurang jelas, tanya dulu sebelum mulai.';}
function renderFlow(){var r=$('resFlow');if(!S.flags.flow){show(r,false);return;}var c=S.canvas,m=missingCanvas();
  var steps=[['Data masuk',c.input],['Langkah 1',c.l1],['Langkah 2',c.l2],['Langkah 3',c.l3],['Hasil',c.output]];
  r.innerHTML='<div class="reshead"><span class="pill'+(m.length?' warn':'')+'">'+(m.length?m.length+' kolom belum terisi':'Alur lengkap')+'</span><span class="stamp">Dibuat '+T(S.flowAt||'')+'</span></div>'+
  '<div class="diag">'+steps.map(function(s,i){return '<div><span class="pill info">'+T(s[0])+'</span><span>'+(s[1]?T(s[1]):'<span class="mut">(kosong)</span>')+'</span></div>';}).join('')+'</div>'+
  (m.length?'<p class="msg bad">Belum terisi: '+T(m.map(function(k){return LAB[k];}).join(', '))+'. Versi kasar boleh, tapi tiap langkah perlu satu kalimat.</p>':'<p class="msg ok">Aturan yang harus dipenuhi: '+T(c.aturan)+'</p>')+
  '<h3>Prompt untuk Claude</h3><pre class="prompt" id="flowP">'+T(promptWF())+'</pre><div class="row"><button class="btn ghost sm" data-act="copy" data-src="flowP" type="button">Salin prompt</button></div>';
  show(r,true);}
function makeFlow(){CF.forEach(function(k){S.canvas[k]=$('c-'+k).value;});S.flags.flow=true;S.flowAt=stamp();renderFlow();say('msgFlow','Alur kerja terbentuk di bawah. Lanjut ke data kalau sudah cukup.','ok');drawStepper();save();}

/* step 3 */
function setSrc(s){S.src=s;qa('#srcSeg button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-src')===s?'true':'false');});['sample','upload','paste','sheets'].forEach(function(k){show($('src-'+k),k===s);});
  var c=CASE();$('sampleInfo').textContent=c?'Data contoh untuk "'+c.name+'": '+(c.rows.length-1)+' baris, kolom '+c.rows[0].join(', ')+'.':'Pilih studi kasus di langkah 1 supaya ada data contoh.';}
function dirtyRows(rows,d){if(d){var h0=rows[0],b0=rows.slice(1).map(function(r){return r.slice();});b0[d.row][d.col]=String(b0[d.row][d.col]).toLowerCase()+' ';if(!d.nodup)b0.push(b0[1].slice());return [h0].concat(b0);}
  var h=rows[0],b=rows.slice(1).map(function(r){return r.slice();});if(b.length>3){b[2][1>=h.length?0:(h[0]==='kode'?1:0)]=String(b[2][h[0]==='kode'?1:0]).toLowerCase()+' ';b.push(b[1].slice());}return [h].concat(b);}
function setData(ds,label){if(!ds.headers.length||!ds.rows.length){say('msgData','Tidak ada baris data. Pastikan baris pertama berisi nama kolom dan ada isinya.','bad');return;}
  S.ds=ds;S.srcInfo=label;S.flags.data=true;S.flags.run=false;S.flags.test=false;S.flags.dash=false;S.flags.sum=false;S.tested=null;S.cfg=defCfg(ds);
  say('msgData','Data masuk: '+ds.rows.length+' baris.'+(ds.truncated?' Dipotong di 20.000 baris.':''),'ok');['resRun','resTest','resDash','resSum'].forEach(function(id){show($(id),false);});show($('cardTest'),false);show($('cardNotes'),false);renderData();drawStepper();save();}
function defCfg(ds){var c=CASE(),ty=colTypes(ds),H=ds.headers;
  if(c&&H.indexOf(c.cfg.group)>-1&&H.indexOf(c.cfg.m1.col)>-1&&(!c.cfg.m2||H.indexOf(c.cfg.m2.col)>-1))return JSON.parse(JSON.stringify(Object.assign({fcol:'',fval:''},c.cfg)));
  var g=H[0],n=null;for(var i=0;i<H.length;i++){if(ty[i]==='txt'&&g===H[0]&&i>=0){g=H[i];break;}}for(var j=0;j<H.length;j++)if(ty[j]==='num'){n=H[j];break;}
  return {group:g,fcol:'',fval:'',m1:n?{col:n,agg:'sum'}:{col:H[0],agg:'count'},m2:null,rel:'none'};}
function diagHTML(q){var it=[];
  q.empties.forEach(function(e){it.push(['warn','Sel kosong','Kolom '+e.col+': '+e.count+' sel']);});
  if(q.spaces)it.push(['warn','Spasi nyasar',q.spaces+' sel punya spasi di depan, belakang, atau dobel (kolom '+q.spaceCols.join(', ')+')']);
  q.variants.forEach(function(v){it.push(['bad','Penulisan beda','Kolom '+v.col+': '+v.vals.map(function(x){return '"'+x+'"';}).join(' dan ')+' dianggap kelompok terpisah']);});
  q.nonnum.forEach(function(n){it.push(['bad','Bukan angka','Kolom '+n.col+': '+n.count+' sel, contoh '+n.examples.map(function(x){return '"'+x+'"';}).join(', ')]);});
  if(q.dups)it.push(['warn','Baris dobel',q.dups+' baris persis sama dengan baris lain']);
  if(!it.length)return '<div><span class="pill">Bersih</span><span>Tidak ada masalah yang terdeteksi.</span></div>';
  return it.map(function(x){return '<div><span class="pill '+x[0]+'">'+T(x[1])+'</span><span>'+T(x[2])+'</span></div>';}).join('');}
function renderData(){var r=$('resData'),ds=S.ds;if(!ds){show(r,false);return;}var q=quality(ds),ty=colTypes(ds),nn=ty.filter(function(t){return t==='num';}).length;
  r.innerHTML='<div class="reshead"><span class="pill">Data masuk</span><span class="stamp">'+T(S.srcInfo)+'</span></div>'+
  '<div class="stats"><div class="stat"><span>Baris</span><b>'+fmtNum(ds.rows.length,'num')+'</b></div><div class="stat"><span>Kolom</span><b>'+ds.headers.length+'</b></div><div class="stat"><span>Kolom angka</span><b>'+nn+'</b></div><div class="stat"><span>Hal yang perlu dicek</span><b>'+q.total+'</b></div></div>'+
  '<div><h3>Delapan baris pertama</h3>'+tbl(ds.headers,ds.rows.slice(0,8),{num:false})+'</div>'+
  '<div><h3>Pemeriksaan data</h3><div class="diag">'+diagHTML(q)+'</div><p class="hint" style="margin-top:8px">Masalah di atas bisa dibereskan lewat opsi Rapikan di langkah berikutnya. Coba jalankan tanpa merapikan dulu, lalu lihat apa yang terjadi.</p></div>';
  show(r,true);}
function parseExt(t){return toDataset(parseDelim(t));}
async function onFile(f){if(!f)return;say('msgData','Membaca '+f.name+'...','');try{var rows=await fileToRows(f);setData(toDataset(rows),'berkas '+f.name+' (hanya di browser ini)');}catch(e){say('msgData',e&&e.message?e.message:'Berkas tidak bisa dibaca.','bad');}}
function findValues(p,d){d=d||0;if(d>5||p==null)return null;if(typeof p==='string'){try{return findValues(JSON.parse(p),d+1);}catch(e){return null;}}
  if(Array.isArray(p)){if(p.length&&Array.isArray(p[0]))return p;for(var i=0;i<p.length;i++){var x=findValues(p[i],d+1);if(x)return x;}return null;}
  if(typeof p==='object'){if(Array.isArray(p.values))return p.values;for(var k in p){var y=findValues(p[k],d+1);if(y)return y;}}return null;}
async function loadSheets(){if(!MCP){say('msgData','Konektor Google Sheets tidak tersedia di sini. Pakai tab Tempel atau Unggah.','bad');return;}
  var u=$('sh-url').value.trim(),m=/\/d\/([\w-]+)/.exec(u),id=m?m[1]:(/^[\w-]{20,}$/.test(u)?u:''),rg=$('sh-range').value.trim()||'A1:Z1000';
  if(!id){say('msgData','Link atau ID spreadsheet belum benar.','bad');return;}
  say('msgData','Membaca dari Google Sheets...','');$('btnSheets').disabled=true;
  try{var res=await MCP.callTool('Google Sheets','get_values',{spreadsheetId:id,range:rg});var v=findValues(res&&res.payload);if(!v){say('msgData','Balasan dari Google Sheets tidak berisi tabel. Cek rentang selnya.','bad');}else setData(toDataset(v.map(function(r){return r.map(function(x){return x==null?'':String(x);});})),'Google Sheets (disalin ke browser ini)');}
  catch(e){var c=e&&e.code,M={server_not_connected:'Konektor Google Sheets belum tersambung di akunmu.',needs_reauth:'Masuk ulang ke konektor Google Sheets dulu.',approval_required:'Izin belum diberikan. Coba lagi dan setujui permintaannya.',blocked_by_policy:'Organisasimu memblokir konektor ini.',tool_error:'Google Sheets menolak permintaan. Cek link dan rentang sel.',upstream_error:'Google Sheets sedang bermasalah. Coba lagi sebentar.'};
    say('msgData',M[c]||('Gagal membaca Google Sheets'+(c?' ('+c+')':'')+'. Pakai tab Tempel sebagai gantinya.'),'bad');}
  $('btnSheets').disabled=false;}

/* step 4 */
function opts(sel,list,cur,blank){sel.innerHTML=(blank!==undefined?'<option value="">'+T(blank)+'</option>':'')+list.map(function(x){return '<option value="'+T(x[0])+'">'+T(x[1])+'</option>';}).join('');sel.value=cur==null?'':cur;if(sel.value!==String(cur==null?'':cur))sel.selectedIndex=0;}
var AGG=[['sum','Jumlah'],['avg','Rata-rata'],['min','Terkecil'],['max','Terbesar'],['count','Banyak baris']];
function fillRunForm(){var ds=S.ds,ok=!!ds;$('btnRun').disabled=!ok;
  $('wfInfo').textContent=ok?'Sudah terisi sesuai studi kasusmu. Ubah kalau perlu, lalu jalankan.':'Muat data dulu di langkah 3.';if(!ok)return;
  var H=ds.headers.map(function(h){return [h,h];}),cf=S.cfg||defCfg(ds);S.cfg=cf;
  opts($('w-group'),H,cf.group,'(semua baris jadi satu)');opts($('w-fcol'),H,cf.fcol,'(tanpa saringan)');fillFval();
  opts($('w-a1'),AGG,cf.m1.agg);opts($('w-c1'),H,cf.m1.col);opts($('w-a2'),AGG,cf.m2?cf.m2.agg:'','(tanpa ukuran 2)');opts($('w-c2'),H,cf.m2?cf.m2.col:'');
  opts($('w-rel'),[['none','Tampilkan ukuran 1 saja'],['minus','Selisih (1 dikurangi 2)'],['plus','Jumlah (1 ditambah 2)'],['pct','Selisih persen ((1 − 2) dibagi 2)']],cf.rel||'none');
  $('cl-trim').checked=S.clean.trim;$('cl-case').checked=S.clean.casefix;$('cl-empty').checked=S.clean.dropEmpty;$('cl-dup').checked=S.clean.dropDup;
  var c=CASE();$('btnKey').hidden=!(c&&S.src==='sample'&&!S.dirty===!S.dirty&&S.srcInfo.indexOf('contoh')>-1);
  $('expected').value=S.expected||'';
  renderRun();}
function fillFval(){var ds=S.ds,fc=$('w-fcol').value,sel=$('w-fval');if(!fc){sel.innerHTML='<option value="">-</option>';sel.disabled=true;return;}sel.disabled=false;
  var j=ds.headers.indexOf(fc),seen={},v=[];ds.rows.forEach(function(r){var x=String(r[j]);if(!seen[x]&&v.length<100){seen[x]=1;v.push([x,x===''?'(kosong)':x]);}});opts(sel,v,S.cfg&&S.cfg.fval);}
function readRun(){S.cfg={group:$('w-group').value,fcol:$('w-fcol').value,fval:$('w-fval').value,m1:{col:$('w-c1').value,agg:$('w-a1').value},m2:$('w-a2').value?{col:$('w-c2').value,agg:$('w-a2').value}:null,rel:$('w-rel').value};
  S.clean={trim:$('cl-trim').checked,casefix:$('cl-case').checked,dropEmpty:$('cl-empty').checked,dropDup:$('cl-dup').checked};}
function compute(){if(!S.ds||!S.cfg)return null;var d=cleanData(S.ds,S.clean),res=aggregate(d,S.cfg);return {d:d,res:res};}
function modeOf(res){return autoMode(res,S.unit);}
function renderRun(){var r=$('resRun');if(!S.flags.run||!S.ds){show(r,false);show($('cardTest'),false);show($('cardNotes'),false);return;}
  var o=compute();if(!o||o.res.error){show(r,false);return;}var res=o.res,d=o.d,base=modeOf(res),mm=res.mainIsPct?'pct':base,F=function(v){return fmtNum(v,mm);},B=function(v){return fmtNum(v,base);};
  var log=['Baca data: '+fmtNum(S.ds.rows.length,'num')+' baris'];
  var on=[];if(S.clean.trim)on.push('spasi');if(S.clean.casefix)on.push('huruf besar kecil');if(S.clean.dropEmpty)on.push('baris angka kosong');if(S.clean.dropDup)on.push('baris dobel');
  log.push(on.length?'Rapikan ('+on.join(', ')+'): '+fmtNum(d.rows.length,'num')+' baris tersisa':'Rapikan: dilewati');
  if(S.cfg.fcol)log.push('Saring: '+S.cfg.fcol+' = '+S.cfg.fval);
  log.push('Kelompokkan menurut '+(S.cfg.group||'semua baris')+': '+res.keys.length+' kelompok');
  log.push('Hitung '+res.l1+(res.hasM2?' dan '+res.l2:'')+(res.rel!=='none'?' lalu '+res.mainLabel:''));
  var body=res.keys.map(function(k,i){var x=[k,fmtNum(res.n[i],'num'),B(res.v1[i])];if(res.hasM2){x.push(B(res.v2[i]));x.push(F(res.main[i]));}return x;});
  var foot=['Total',fmtNum(res.totals.n,'num'),B(res.totals.v1)];if(res.hasM2){foot.push(B(res.totals.v2));foot.push(F(res.totals.main));}
  r.innerHTML='<div class="reshead"><span class="pill">Workflow selesai</span><span class="stamp">Dijalankan '+T(S.ranAt)+'</span></div>'+
  '<div class="diag">'+log.map(function(l,i){return '<div><span class="pill info">'+(i+1)+'</span><span>'+T(l)+'</span></div>';}).join('')+'</div>'+
  '<div class="stats"><div class="stat"><span>'+T(res.mainLabel)+' (total)</span><b>'+T(F(res.totals.main))+'</b></div><div class="stat"><span>Kelompok</span><b>'+res.keys.length+'</b></div></div>'+
  '<div class="dbx" style="--accent:#1F5FD6;padding:8px;background:#fff">'+chartSVG('bar',res.keys,res.main,F)+'</div>'+tbl(res.headers,body,{foot:foot});
  show(r,true);show($('cardTest'),true);
  $('testInfo').textContent='Hitung sendiri hasilnya dari data awal (bukan dari tabel di atas), lalu isi angkanya. Kalau cocok, workflow-mu benar untuk data ini.';
  show($('cardNotes'),!!S.flags.test);}
function runWF(){if(!S.ds){say('msgRun','Muat data dulu di langkah 3.','bad');return;}readRun();var o=compute();if(o.res.error){say('msgRun',o.res.error,'bad');return;}
  S.flags.run=true;S.flags.test=false;S.flags.dash=false;S.flags.sum=false;S.tested=null;S.ranAt=stamp();show($('resTest'),false);show($('resDash'),false);show($('resSum'),false);
  say('msgRun','Selesai. Hasil di bawah, lalu tes di kartu berikutnya.','ok');renderRun();renderTest();drawStepper();save();}
function tolFor(res){return res.mainIsPct?0.1:0.5;}
function renderTest(){var r=$('resTest'),t=S.tested;if(!t||!S.flags.test){show(r,false);return;}
  r.style.borderColor=t.ok?'':'var(--red)';
  r.innerHTML='<div class="reshead"><span class="pill'+(t.ok?'':' bad')+'">'+(t.ok?'Cocok':'Beda')+'</span><span class="stamp">Dites '+T(t.at)+'</span></div>'+
  tbl(['','Angka'],[['Hasil workflow',t.got],['Jawabanmu',t.exp],['Selisih',t.diff]],{})+'<p class="'+(t.ok?'msg ok':'msg bad')+'" style="margin:0">'+T(t.msg)+'</p>';
  show(r,true);}
function doTest(){var o=compute();if(!S.flags.run||!o||o.res.error){say('msgTest','Jalankan workflow dulu.','bad');return;}
  var raw=$('expected').value.trim();S.expected=raw;var e=parseNum(raw);if(isNaN(e)){say('msgTest','Isi angka jawabanmu dulu. Contoh: 4650000.','bad');return;}
  var res=o.res,g=res.totals.main,mm=res.mainIsPct?'pct':modeOf(res),diff=g-e,ok=Math.abs(diff)<=tolFor(res),q=quality(S.ds),msg;
  if(ok)msg='Hasil workflow sama dengan hitunganmu. Catat di bawah apa yang membuatnya cocok.';
  else{var left=[];if((q.spaces||q.variants.length)&&!(S.clean.trim&&S.clean.casefix))left.push('spasi atau penulisan beda (centang Buang spasi dan Samakan huruf)');if(q.dups&&!S.clean.dropDup)left.push('baris dobel (centang Buang baris dobel)');if(q.empties.length&&!S.clean.dropEmpty)left.push('sel kosong');
    msg=left.length?'Data awalmu masih punya: '+left.join('; ')+'. Centang opsi rapikan di atas, jalankan lagi, lalu tes ulang.':'Datanya tampak bersih, jadi cek kolom yang dipilih, jenis hitungan, dan aturan di canvas. Atau hitungan manualmu yang meleset.';}
  S.tested={ok:ok,got:fmtNum(g,mm),exp:fmtNum(e,mm),diff:fmtNum(diff,mm),msg:msg,at:stamp(),left:[]};S.flags.test=true;
  renderTest();say('msgTest','','');show($('cardNotes'),true);drawNotes();if(!S.notes.n1&&!S.notes.n2&&!S.notes.n3)fillNotes();drawStepper();save();}
function fillNotes(){var t=S.tested;if(!t)return;var c=S.canvas;S.notes.n1=t.ok?'Hasil workflow sama dengan hitungan manual ('+t.got+').':'Alur dan langkah sudah jalan sampai hasil akhir.';
  S.notes.n2=t.ok?(S.clean.trim||S.clean.casefix||S.clean.dropDup||S.clean.dropEmpty?'Awalnya data berantakan, hasil baru cocok setelah dirapikan.':'Belum ada yang beda pada data contoh.'):'Hasil workflow ('+t.got+') beda dari hitungan manual ('+t.exp+').';
  S.notes.n3=t.ok?'Tambahkan aturan tertulis supaya data baru yang berantakan tidak lolos begitu saja.':'Perbaiki dulu penyebab bedanya, lalu tes ulang dengan data yang sama.';drawNotes();save();}
function drawNotes(){var L=[['n1','Yang sudah cocok'],['n2','Yang masih beda'],['n3','Yang kuubah di versi berikutnya']];$('notes').innerHTML=L.map(function(l){return '<div class="field"><label for="'+l[0]+'">'+l[1]+'</label><textarea id="'+l[0]+'" data-n="'+l[0]+'" style="min-height:64px">'+T(S.notes[l[0]]||'')+'</textarea></div>';}).join('');
  $('stuckP').textContent=stuckP();}
function stuckP(){var c=S.canvas,t=S.tested;return 'Workflow-ku: '+(c.nama||'...')+'.\nLangkah: '+[c.l1,c.l2,c.l3].filter(Boolean).join(' > ')+'.\nHasil yang kuharapkan: '+(c.output||'...')+'.\nYang terjadi: '+(t?(t.ok?'hasilnya cocok, tapi aku mau tahu aturan apa yang perlu ditambah.':'hasil workflow '+t.got+' padahal hitunganku '+t.exp+'.'):'...')+'\nBantu cari penyebabnya satu per satu. Jangan langsung menulis ulang semuanya.';}

/* step 5 */
function fillDashForm(){var D=S.dash;$('d-title').value=D.title;$('d-sub').value=D.sub;$('d-note').value=D.note;$('d-unit').value=S.unit;$('d-raw').checked=!!D.raw;
  qa('#segChart button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-v')===D.chart?'true':'false');});qa('#segAcc button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-v')===D.accent?'true':'false');});
  $('kpiList').innerHTML=KPIS.map(function(k){return '<label class="chk"><input type="checkbox" data-k="'+k[0]+'"'+(D.kpis.indexOf(k[0])>-1?' checked':'')+'><span>'+T(k[1])+'</span></label>';}).join('');
  $('btnDash').disabled=!S.flags.run;if(!S.flags.run)say('msgDash','Jalankan workflow di langkah 4 dulu.','bad');else say('msgDash','','');
  $('ccP').textContent=ccP();renderDash();}
function ccP(){var o=compute(),r=o&&!o.res.error?o.res:null;return 'Ini file data hotelku (data.csv).\nBuatkan halaman dashboard sederhana:\n3 angka utama dan 1 grafik '+(r?r.mainLabel.toLowerCase():'hasil')+' per '+(S.cfg&&S.cfg.group?S.cfg.group:'kelompok')+'.\nPakai bahasa Indonesia.';}
function readDash(){var D=S.dash;D.title=$('d-title').value;D.sub=$('d-sub').value;D.note=$('d-note').value;D.raw=$('d-raw').checked;S.unit=$('d-unit').value;
  D.kpis=qa('#kpiList input').filter(function(x){return x.checked;}).map(function(x){return x.getAttribute('data-k');});
  qa('#segChart button').forEach(function(b){if(b.getAttribute('aria-pressed')==='true')D.chart=b.getAttribute('data-v');});qa('#segAcc button').forEach(function(b){if(b.getAttribute('aria-pressed')==='true')D.accent=b.getAttribute('data-v');});}
function dashModel(){var o=compute();if(!o||o.res.error)return null;var D=S.dash;return {m:buildModel(o.res,{title:D.title||'Dashboard',sub:D.sub,chart:D.chart,accent:D.accent,kpis:D.kpis,unit:S.unit,note:D.note,raw:D.raw?{headers:o.d.headers,rows:o.d.rows.slice(0,200)}:null}),o:o};}
var LASTHTML='';
function renderDash(){var r=$('resDash');if(!S.flags.dash||!S.flags.run){show(r,false);return;}var x=dashModel();if(!x){show(r,false);return;}
  LASTHTML=offlineHTML();var kb=Math.max(1,Math.round(LASTHTML.length/1024));
  r.innerHTML='<div class="reshead"><span class="pill">Dashboard jadi</span><span class="stamp">Dibuat '+T(S.dashAt)+'</span></div><div class="prev" id="prevBox">'+dashBody(x.m)+'</div>'+
  '<div class="row">'+(DL?'<button class="btn" id="btnDl" type="button">Unduh dashboard (.html)</button>':'')+'<button class="btn '+(DL?'ghost':'')+'" data-act="copyhtml" type="button">Salin kode HTML</button></div>'+
  '<p class="msg" id="msgDl" role="status"></p><p class="hint">Berkas ±'+kb+' KB, satu file, jalan tanpa internet. Di dalamnya ada kotak "Pakai data baru" untuk CSV atau Excel, tetap di komputermu.'+(DL?'':' Tombol unduh tidak tersedia di sini, jadi salin kodenya lalu simpan sebagai dashboard.html.')+'</p><textarea class="mono" id="htmlOut" hidden readonly aria-label="Kode HTML dashboard"></textarea>';
  show(r,true);}
function makeDash(){if(!S.flags.run){say('msgDash','Jalankan workflow di langkah 4 dulu.','bad');return;}readDash();if(!dashModel()){say('msgDash','Hasil workflow belum bisa dibaca. Jalankan ulang di langkah 4.','bad');return;}
  S.flags.dash=true;S.flags.sum=false;S.dashAt=stamp();renderDash();say('msgDash','Dashboard dibuat. Unduh di bawahnya.','ok');drawStepper();save();}
function offlineMain(){var C=window.__CFG,cur=C.ds,app=document.getElementById('app'),msg=document.getElementById('msg'),src=document.getElementById('src');
  function render(){try{var d=cleanData(cur,C.clean),res=aggregate(d,C.cfg);if(res.error){msg.textContent=res.error+' Pastikan nama kolom sama dengan data awal.';msg.className='msg bad';return false;}
    var o={};for(var k in C.opts)o[k]=C.opts[k];o.raw=C.opts.raw?{headers:d.headers,rows:d.rows.slice(0,200)}:null;app.innerHTML=dashBody(buildModel(res,o));msg.textContent='';msg.className='msg';return true;}catch(e){msg.textContent='Data tidak bisa diproses: '+(e&&e.message?e.message:e);msg.className='msg bad';return false;}}
  function use(ds,label){if(!ds.headers.length||!ds.rows.length){msg.textContent='Tidak ada baris data.';msg.className='msg bad';return;}var prev=cur;cur=ds;if(render())src.textContent='Sumber: '+label+' ('+ds.rows.length+' baris)';else cur=prev;}
  document.getElementById('f').addEventListener('change',async function(e){var f=e.target.files[0];if(!f)return;try{use(toDataset(await fileToRows(f)),f.name);}catch(x){msg.textContent=x.message;msg.className='msg bad';}});
  document.getElementById('go').addEventListener('click',function(){var t=document.getElementById('p').value;if(t.trim())use(toDataset(parseDelim(t)),'data tempelan');});
  document.getElementById('rs').addEventListener('click',function(){cur=C.ds;render();src.textContent='Sumber: data awal ('+C.ds.rows.length+' baris)';msg.textContent='';});
  render();src.textContent='Sumber: data awal ('+C.ds.rows.length+' baris)';}
var ENG=['esc','detectDelim','parseDelim','toDataset','parseNum','colTypes','cleanData','aggName','aggLabel','aggregate','fmtNum','autoMode','chartSVG','dashCSS','buildModel','dashBody','inflateRaw','xlsxToRows','fileToRows'];
function offlineHTML(){var x=dashModel();if(!x)return '';var D=S.dash,cfg=JSON.parse(JSON.stringify(S.cfg)),ds=S.ds;
  var C={ds:{headers:ds.headers,rows:ds.rows,truncated:false},cfg:cfg,clean:S.clean,opts:{title:D.title||'Dashboard',sub:D.sub,chart:D.chart,accent:D.accent,kpis:D.kpis,unit:S.unit,note:D.note,raw:!!D.raw}};
  var json=JSON.stringify(C).replace(/</g,'\\u003c').split(String.fromCharCode(8232)).join('\\u2028').split(String.fromCharCode(8233)).join('\\u2029');
  var fns=ENG.map(function(n){return window[n].toString();}).join('\n');
  return '<!DOCTYPE html>\n<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(D.title||'Dashboard')+'</title><style>body{margin:0;padding:16px;background:#E9EEF7;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0F1B33}main{max-width:900px;margin:0 auto}'+dashCSS()+
  '.tools{margin-top:14px;background:#fff;border:1px solid #D6DFEE;border-radius:12px;padding:10px 14px}.tools summary{cursor:pointer;font-weight:700}.tools textarea{width:100%;min-height:80px;font:13px ui-monospace,Menlo,Consolas,monospace;border:1px solid #D6DFEE;border-radius:8px;padding:8px;margin:8px 0}.tools button,.tools input{font:inherit;margin:4px 6px 4px 0}.tools button{border:0;background:#1F5FD6;color:#fff;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}.tools button.g{background:#fff;color:#0B2A6F;border:1px solid #D6DFEE}.msg{font-size:14px;margin:6px 0 0}.msg.bad{color:#C62828}.small{font-size:12px;color:#52627A;margin:12px 2px 0}</style></head><body><main><div id="app"></div>'+
  '<details class="tools"><summary>Pakai data baru</summary><p class="small" style="margin-top:8px">Kolom harus bernama sama dengan data awal. Data hanya diproses di komputer ini dan tidak dikirim ke mana pun. Muat ulang halaman untuk kembali ke data awal.</p><input type="file" id="f" accept=".xlsx,.xlsm,.csv,.tsv,.txt" aria-label="Berkas data"><textarea id="p" placeholder="Atau tempel sel dari Google Sheets atau Excel (dengan baris nama kolom)"></textarea><div><button type="button" id="go">Pakai data tempelan</button><button type="button" class="g" id="rs">Kembali ke data awal</button></div><p class="msg" id="msg" role="status"></p></details><p class="small" id="src"></p><p class="small">Dibuat dari Praktik Versi Pertama, belajarlagi x Robina. Cek angkanya dengan hitungan manual sebelum dipakai.</p></main>'+
  '<script>window.__CFG='+json+';<\/script><script>\n'+fns+'\n'+offlineMain.toString()+'\noffline'+'Main();\n<\/script></body></html>';}
function slug(s){return String(s||'dashboard').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'dashboard';}
async function doDl(){var m=$('msgDl');if(!DL||!LASTHTML)return;m.textContent='Menunggu persetujuan unduh...';m.className='msg';
  try{var r=await DL.save({filename:'dashboard-'+slug(S.dash.title)+'.html',data:LASTHTML});m.textContent=r&&r.status==='delivered'?'Terkirim. Cek unduhan di perangkatmu.':'Tersimpan. Buka berkas itu di browser, tidak perlu internet.';m.className='msg ok';S.flags.downloaded=true;save();}
  catch(e){var c=e&&e.code,M={declined:'Unduhan dibatalkan.',rate_limited:'Terlalu sering mengunduh. Coba lagi sebentar.',too_large:'Berkas terlalu besar. Matikan data mentah atau kurangi data.',rejected_extension:'Jenis berkas ditolak.'};m.textContent=(M[c]||'Unduhan gagal'+(c?' ('+c+')':''))+' Kamu bisa pakai Salin kode HTML.';m.className='msg bad';}}
async function copyEl(btn){var t=btn.getAttribute('data-act')==='copyhtml'?LASTHTML:$(btn.getAttribute('data-src')).textContent,old=btn.textContent;
  try{await navigator.clipboard.writeText(t);btn.textContent='Tersalin';setTimeout(function(){btn.textContent=old;},1500);}
  catch(e){var o=$('htmlOut');if(btn.getAttribute('data-act')==='copyhtml'&&o){o.hidden=false;o.value=t;o.focus();o.select();btn.textContent='Pilih lalu Ctrl+C';}else{btn.textContent='Blok teks lalu Ctrl+C';}setTimeout(function(){btn.textContent=old;},3000);}}

/* step 6 */
function summary(){var c=S.canvas,cs=CASE(),t=S.tested,o=compute(),res=o&&!o.res.error?o.res:null,mm=res?(res.mainIsPct?'pct':modeOf(res)):'num',L=[];
  L.push('WORKFLOW CANVAS','Nama: '+(c.nama||'-'),'Masalah: '+(c.masalah||'-'),'Pemakai: '+(c.pengguna||'-'),'Data masuk: '+(c.input||'-'),'Langkah: 1) '+(c.l1||'-')+' 2) '+(c.l2||'-')+' 3) '+(c.l3||'-'),'Hasil: '+(c.output||'-'),'Aturan: '+(c.aturan||'-'),'');
  L.push('HASIL VERSI PERTAMA','Studi kasus: '+(cs?cs.name:'-'),'Data: '+(S.ds?S.srcInfo+', '+S.ds.rows.length+' baris':'belum dimuat'));
  if(res){L.push('Hasil workflow: '+res.mainLabel+' = '+fmtNum(res.totals.main,mm)+' ('+res.keys.length+' kelompok)');var on=[];if(S.clean.trim)on.push('buang spasi');if(S.clean.casefix)on.push('samakan huruf');if(S.clean.dropEmpty)on.push('buang angka kosong');if(S.clean.dropDup)on.push('buang baris dobel');L.push('Perapian data: '+(on.length?on.join(', '):'tidak ada'));}
  L.push('Tes: '+(t?(t.ok?'cocok':'beda')+' (workflow '+t.got+', jawabanku '+t.exp+')':'belum dites'),'Dashboard: '+(S.flags.dash?'sudah dibuat'+(S.flags.downloaded?' dan diunduh':''):'belum dibuat'),'');
  L.push('CATATAN TES','Sudah cocok: '+(S.notes.n1||'-'),'Masih beda: '+(S.notes.n2||'-'),'Perbaikan berikutnya: '+(S.notes.n3||'-'));return L.join('\n');}
function renderSum(){var r=$('resSum');if(!S.flags.sum){show(r,false);return;}
  r.innerHTML='<div class="reshead"><span class="pill">Ringkasan siap</span><span class="stamp">Disusun '+T(S.sumAt||'')+'</span></div><pre class="prompt" id="sumP">'+T(summary())+'</pre><div class="row"><button class="btn" data-act="copy" data-src="sumP" type="button">Salin ringkasan</button></div><p class="hint">Tempel ke Workflow Canvas-mu lalu kirim hari ini. Datamu tidak ikut terkirim, hanya teks ringkasan ini.</p>';show(r,true);}
function makeSum(){if(!S.flags.flow&&!S.flags.run){say('msgSum','Isi alur di langkah 2 dulu, minimal itu.','bad');return;}S.flags.sum=true;S.sumAt=stamp();renderSum();say('msgSum','Ringkasan tersusun di bawah.','ok');drawStepper();drawDone();save();}
function drawDone(){var L=[[!!S.flags.case,'Studi kasus dipilih'],[!!S.flags.flow,'Alur kerja ditulis'],[!!S.ds,'Data dimuat'],[!!S.flags.run,'Workflow dijalankan'],[!!(S.tested&&S.tested.ok),'Hasil dites dan cocok'],[!!S.flags.dash,'Dashboard dibuat'],[!!S.flags.downloaded,'Dashboard diunduh'],[!!S.flags.sum,'Ringkasan disalin ke canvas']];
  $('doneList').innerHTML=L.map(function(x){return '<div class="chk" style="padding:4px 0"><span class="pill'+(x[0]?'':' warn')+'" style="flex:none">'+(x[0]?'Sudah':'Belum')+'</span><span>'+T(x[1])+'</span></div>';}).join('');}
var rst=0;
function doReset(){var b=$('btnReset');if(!rst){rst=1;b.textContent='Klik lagi untuk menghapus';say('msgReset','','');setTimeout(function(){rst=0;b.textContent='Hapus semua';},4000);return;}
  rst=0;b.textContent='Hapus semua';lsDel(KEY);lsDel(KEY+'-ds');S=fresh();drawCases();drawCanvas();clearResults();say('msgCase','');say('msgFlow','');say('msgData','');say('msgRun','');say('msgTest','');say('msgDash','');say('msgSum','');setSrc('sample');go(0);say('msgReset','Sudah dihapus dari browser ini.','ok');}

function bind(){
  document.addEventListener('click',function(e){var b=e.target.closest('button,[data-act]');if(!b)return;
    if(b.classList.contains('st')){go(+b.getAttribute('data-i'));return;}
    var a=b.getAttribute('data-act');if(a==='copy'||a==='copyhtml'){copyEl(b);return;}
    switch(b.id){case 'prev':go(S.i-1);break;case 'next':go(S.i+1);break;case 'btnCase':startCase();break;case 'btnFlow':makeFlow();break;
      case 'btnFill':{var c=CASE();if(c){S.canvas=Object.assign({},c.canvas);drawCanvas();save();say('msgFlow','Terisi ulang dari studi kasus.','ok');}else say('msgFlow','Pilih studi kasus di langkah 1 dulu.','bad');break;}
      case 'btnClear':S.canvas={};drawCanvas();S.flags.flow=false;renderFlow();save();break;
      case 'btnSample':{var cs=CASE();if(!cs){say('msgData','Pilih studi kasus di langkah 1 dulu.','bad');break;}S.dirty=$('dirty').checked;var rows=S.dirty?dirtyRows(cs.rows,cs.dirty):cs.rows;setData(toDataset(rows),'data contoh'+(S.dirty?' (sengaja berantakan)':''));break;}
      case 'btnPaste':{var t=$('paste').value;if(!t.trim()){say('msgData','Kotaknya masih kosong. Tempel sel dulu.','bad');break;}setData(toDataset(parseDelim(t)),'tempelan dari spreadsheet');break;}
      case 'btnSheets':loadSheets();break;case 'btnRun':runWF();break;case 'btnTest':doTest();break;
      case 'btnKey':{var cc=CASE();if(cc){$('expected').value=String(cc.key);S.expected=String(cc.key);save();}break;}
      case 'btnNote':fillNotes();break;case 'btnDash':makeDash();break;case 'btnDl':doDl();break;case 'btnSum':makeSum();break;case 'btnReset':doReset();break;
      case 'btnStart':enterApp(0);break;}
    var mc=b.closest('.mcard');if(mc)enterApp(+mc.getAttribute('data-i'));
    var sg=b.closest('#srcSeg');if(sg&&b.getAttribute('data-src')){setSrc(b.getAttribute('data-src'));save();}
    var cg=b.closest('#segChart,#segAcc');if(cg){qa('button',cg).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});}});
  CF.forEach(function(k){$('c-'+k).addEventListener('input',function(){S.canvas[k]=this.value;save();});});
  $('file').addEventListener('change',function(){onFile(this.files[0]);this.value='';});
  var dp=$('drop');['dragenter','dragover'].forEach(function(n){dp.addEventListener(n,function(e){e.preventDefault();dp.classList.add('over');});});
  ['dragleave','drop'].forEach(function(n){dp.addEventListener(n,function(e){e.preventDefault();dp.classList.remove('over');});});dp.addEventListener('drop',function(e){var f=e.dataTransfer&&e.dataTransfer.files[0];if(f)onFile(f);});
  $('w-fcol').addEventListener('change',function(){S.cfg.fcol=this.value;S.cfg.fval='';fillFval();});
  $('expected').addEventListener('input',function(){S.expected=this.value;});
  $('notes').addEventListener('input',function(e){var k=e.target.getAttribute('data-n');if(k){S.notes[k]=e.target.value;save();}});
  window.addEventListener('hashchange',function(){var h=location.hash.replace('#','');for(var i=0;i<6;i++)if(STEPS[i][0]===h&&i!==S.i){go(i,true);return;}});
}
window.addEventListener('load',ic);window.addEventListener('DOMContentLoaded',ic);
async function init(){load();
  var st=document.createElement('style');st.textContent=dashCSS();document.head.appendChild(st);
  try{if(typeof claude!=='undefined'&&claude&&claude.use){try{DL=await claude.use('downloads');}catch(e){DL=null;}try{MCP=await claude.use('mcp');}catch(e){MCP=null;}}}catch(e){}
  if(MCP)$('segSheets').hidden=false;
  drawCases();drawCanvas();drawHomeMenu();bind();setSrc(S.src==='sheets'&&!MCP?'sample':S.src);$('dirty').checked=!!S.dirty;
  renderCase();renderFlow();renderData();renderRun();renderTest();renderSum();if(S.tested){drawNotes();}
  var h=location.hash.replace('#',''),i=S.i;for(var k=0;k<6;k++)if(STEPS[k][0]===h)i=k;S.i=i;ic();splash();}
init();
})();
