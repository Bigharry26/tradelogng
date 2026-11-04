const sb=supabase.createClient('https://eroiisvhptcizpxnmeup.supabase.co','sb_publishable_nz83rTMAUIKiN2gx3h1Rww_LS_aPxG1',{global:{fetch:(u,o)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),15000);return fetch(u,{...o,signal:c.signal}).finally(()=>clearTimeout(t))}}});
const $=i=>document.getElementById(i);
const naira=n=>'₦'+Number(n).toLocaleString('en-NG');
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayD=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const off=n=>{const d=todayD();d.setDate(d.getDate()+n);return iso(d)};
const dayDiff=s=>Math.round((new Date(s+'T00:00:00')-todayD())/864e5);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const waNum=s=>{const d=String(s||'').replace(/\D/g,'');if(d.indexOf('234')==0)return d;if(d[0]=='0')return '234'+d.slice(1);if(d.length==10)return '234'+d;return d};
const fmtD=s=>new Date(s+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const fmtK=n=>n>=1000?Math.round(n/1000)+'k':String(n);
const S={user:null,shop:'',owner:'',phone:'',debts:[],pays:[],sales:[],q:[],map:{},uid:null,offline:false,syncing:false,again:false,recovery:false,day:null,fd:'',fs:'',ff:'all',sent:{},tab:0,sheet:null,mode:'in',busy:false,d:{method:'Cash'},rp:'day',rsel:0,remId:null};
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2200)}
function ok(r){if(r.error)throw r.error;return r.data}
async function fetchAll(build){let out=[],from=0;for(;;){const data=ok(await build().range(from,from+999));out=out.concat(data);if(data.length<1000)break;from+=1000}return out}
const isNet=e=>{const m=String((e&&e.message)||e||'');return !navigator.onLine||/fetch|network|abort|timeout|timed out|offline|load failed|failed to connect/i.test(m)};
const isTmp=id=>typeof id=='string'&&id.charAt(0)=='n';
const newCid=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const tmpId=()=>'n'+newCid();
function persist(){try{if(S.user)S.uid=S.user.id;localStorage.setItem('tl_cache',JSON.stringify({uid:S.uid,shop:S.shop,owner:S.owner,phone:S.phone,debts:S.debts,pays:S.pays,sales:S.sales,q:S.q,map:S.map}))}catch(e){}}
function enqueue(it){S.q.push(it);persist()}
function useCache(c,uid){if(c&&c.uid&&c.uid==uid){S.uid=uid;S.shop=c.shop||'';S.owner=c.owner||'';S.phone=c.phone||'';S.debts=c.debts||[];S.pays=c.pays||[];S.sales=c.sales||[];S.q=c.q||[];S.map=c.map||{};return true}return false}
function switchUser(uid){let c=null;try{c=JSON.parse(localStorage.getItem('tl_cache')||'null')}catch(e){}if(!useCache(c,uid)){S.uid=uid;S.shop='';S.owner='';S.phone='';S.debts=[];S.pays=[];S.sales=[];S.q=[];S.map={}}}
function banner(){const n=S.q.length;if(!n&&!S.offline)return '';return `<button class="sync" data-act="sync">${n?n+(n==1?' entry is':' entries are')+' saved on this phone and waiting to send. Tap to retry.':'No network. Showing records saved on this phone.'}</button>`}
function softRender(){const a=document.activeElement;if(a&&a.tagName=='INPUT')return;render()}
async function insIdem(t,row){const r=await sb.from(t).insert(row).select().single();
 if(r.error&&r.error.code=='23505'){const g=await sb.from(t).select('*').eq('cid',row.cid).single();if(g.error)throw g.error;return g.data}
 if(r.error)throw r.error;return r.data}
async function runItem(it){const R=id=>S.map[id]||id;
 if(it.k=='debt'){const r=await insIdem('debts',{...it.row,cid:it.cid});S.map[it.tmp]=r.id}
 else if(it.k=='sale'){const r=await insIdem('sales',{...it.row,cid:it.cid});S.map[it.tmp]=r.id}
 else if(it.k=='pay'){await insIdem('payments',{debt_id:R(it.debt),amount:it.row.amount,cid:it.cid})}
 else if(it.k=='upd'){ok(await sb.from('debts').update(it.row).eq('id',R(it.debt)))}
 else if(it.k=='del'){ok(await sb.from('debts').delete().eq('id',R(it.debt)))}
 else if(it.k=='delsale'){ok(await sb.from('sales').delete().eq('id',R(it.id)))}
 else if(it.k=='prof'){ok(await sb.from('shops').upsert({user_id:S.uid,...it.row}))}}
async function sync(){
 if(!S.user)return;
 if(S.syncing){S.again=true;return}
 S.syncing=true;
 try{
  const g=await sb.auth.getSession();
  if(!g.data.session){
   const down=!navigator.onLine||(g.error&&(isNet(g.error)||g.error.name=='AuthRetryableFetchError'));
   if(down)S.offline=true;else{S.user=null;toast('Please sign in again. Your saved entries will be sent.')}
  }else{
   while(S.q.length){
    const it=S.q[0];
    try{await runItem(it);S.q=S.q.filter(i=>i!==it);persist()}
    catch(err){
     if(isNet(err))throw err;
     it.n=(it.n||0)+1;persist();
     if(/^(22|23)/.test(String(err.code||''))||it.n>=3){S.q=S.q.filter(i=>i!==it);persist();toast('One entry could not be saved')}
     else throw err}
   }
   if(await loadAll()){S.map={};persist()}
   S.offline=false;
  }
 }catch(err){console.error(err);S.offline=true}
 const again=S.again;S.again=false;S.syncing=false;
 if(!S.user){render();return}
 if(again&&S.q.length&&!S.offline){return sync()}
 softRender()}
async function loadAll(){
 const sh=await sb.from('shops').select('name,owner_name,phone').maybeSingle();if(sh.error)throw sh.error;
 const d=await fetchAll(()=>sb.from('debts').select('*').order('id'));
 const p=await fetchAll(()=>sb.from('payments').select('*').order('id'));
 const sl=await fetchAll(()=>sb.from('sales').select('*').gte('sale_date',off(-730)).order('id'));
 if(S.q.length)return false;
 S.shop=sh.data?sh.data.name:'';S.owner=sh.data?(sh.data.owner_name||''):'';S.phone=sh.data?(sh.data.phone||''):'';S.debts=d;S.pays=p;S.sales=sl;persist();return true}
async function loadAllOld(){
 const sh=await sb.from('shops').select('name').maybeSingle();
 S.shop=sh.data?sh.data.name:'';
 S.debts=await fetchAll(()=>sb.from('debts').select('*').order('id'));
 S.pays=await fetchAll(()=>sb.from('payments').select('*').order('id'));
 S.sales=await fetchAll(()=>sb.from('sales').select('*').gte('sale_date',off(-200)).order('id'));
}
const sumS=(m,date)=>S.sales.filter(s=>s.sale_date==(date||off(0))&&(!m||s.method==m)).reduce((t,s)=>t+Number(s.amount),0);
const paidOf=x=>S.pays.filter(p=>p.debt_id==x.id).reduce((t,p)=>t+Number(p.amount),0);
const balOf=x=>Math.max(0,Number(x.amount)-paidOf(x));
const openD=()=>S.debts.filter(x=>!x.paid).sort((a,b)=>a.due_date<b.due_date?-1:1);
function tagFor(x){const k=dayDiff(x.due_date);
 if(k<0)return['late',-k+(k==-1?' day late':' days late')];
 if(k==0)return['soon','Due today'];
 if(k<=7)return['soon','Due in '+k+(k==1?' day':' days')];
 return['ok','Due in '+k+' days']}
function bucketsFor(p){const out=[];let i;
 if(p=='day'){for(i=0;i<7;i++){const d=off(-i);out.push({label:i==0?'Today':new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short'}),from:d,to:d})}}
 else if(p=='week'){const ws=-((todayD().getDay()+6)%7);for(i=0;i<6;i++){const f=ws-7*i;out.push({label:i==0?'This week':i==1?'Last week':fmtD(off(f)),from:off(f),to:off(f+6)})}}
 else{const t=todayD();for(i=0;i<6;i++){const a=new Date(t.getFullYear(),t.getMonth()-i,1),z=new Date(t.getFullYear(),t.getMonth()-i+1,0);out.push({label:i==0?'This month':a.toLocaleDateString('en-GB',{month:'short'}),from:iso(a),to:iso(z)})}}
 return out}
function authView(){const up=S.mode=='up';
 return `<div class="auth"><div class="brand">TradeLog NG</div><h1>${up?'Create your account':'Welcome back'}</h1><div class="shop">Record sales and debts in one place</div>`+
 (up?`<label>Your full name</label><input data-d="owner" placeholder="Chidi Okafor" value="${esc(S.d.owner)}"><label>Shop name</label><input data-d="shop" placeholder="Mama Chidi Provisions" value="${esc(S.d.shop)}">`:'')+
 `<label>Email</label><input data-d="email" type="email" autocomplete="email" value="${esc(S.d.email)}">
 <label>Password (6 or more characters)</label><input data-d="password" type="password" autocomplete="${up?'new-password':'current-password'}" value="${esc(S.d.password)}">
 <button class="full" data-act="${up?'signup':'signin'}">${up?'Create account':'Sign in'}</button>
 <button class="full alt" data-act="mode">${up?'I already have an account':'Create a new account'}</button>${up?'':'<button class="full alt" data-act="forgot">Forgot password?</button>'}</div>`}
function dayOf(){return S.day||off(0)}
function dayLabel(d){return d==off(0)?'Today':d==off(-1)?'Yesterday':new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
const payDay=p=>iso(new Date(p.created_at));
const debtOf=id=>S.debts.find(z=>z.id==id);
const colOf=d=>S.pays.filter(p=>payDay(p)==d).reduce((t,p)=>t+Number(p.amount),0);
function balText(){const am=Number(S.d.amount)||0,pn=Number(S.d.pn)||0;if(!(am>0))return '';if(pn>=am&&pn>0)return 'Paid now must be less than the total price';return 'Customer will owe '+naira(am-(pn>0?pn:0))}
function collectedHtml(d){const ps=S.pays.filter(p=>payDay(p)==d).slice().reverse();
 if(!ps.length)return '<div class="empty">No debts collected '+(d==off(0)?'today':'on this day')+'.</div>';
 return ps.map(p=>{const x=debtOf(p.debt_id);return `<div class="item"><div class="l1">${x?`<button class="name linkn" data-act="cust" data-v="${esc(ck(x.customer_name))}">${esc(x.customer_name)} ›</button>`:'<span class="name">Customer</span>'}<span class="amt">${naira(p.amount)}</span></div><div class="m">${new Date(p.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}${x&&balOf(x)>0?' · still owes '+naira(balOf(x)):' · fully paid'}</div></div>`}).join('')}
function debtsList(){const q=(S.fd||'').trim().toLowerCase(),qd=q.replace(/\D/g,'');
 const list=openD().filter(dueFilter).filter(x=>!q||String(x.customer_name).toLowerCase().includes(q)||(qd.length>2&&String(x.phone||'').replace(/\D/g,'').includes(qd)));
 let h='';
 if(!list.length)h+=`<div class="empty">${q?'No open debt found for “'+esc(S.fd)+'”.':'Nobody owes you. Tap “Add debt” when someone takes goods on credit.'}</div>`;
 list.forEach(x=>{const t=tagFor(x);h+=`<div class="item"><div class="l1"><button class="name linkn" data-act="cust" data-v="${esc(ck(x.customer_name))}">${esc(x.customer_name)} ›</button><span class="amt">${naira(balOf(x))}</span></div>${paidOf(x)>0?`<div class="m">Owed ${naira(x.amount)}, paid ${naira(paidOf(x))}</div>`:''}<span class="tag ${t[0]}">${t[1]}</span><div class="acts"><button class="b1" data-act="remind" data-v="${x.id}">Remind</button><button class="b2" data-act="pay" data-v="${x.id}">Payment</button><button class="b2" data-act="edit" data-v="${x.id}">Edit</button></div></div>`});
 return h}
function debtsView(){const list=openD(),total=list.reduce((s,x)=>s+balOf(x),0),late=list.filter(x=>dayDiff(x.due_date)<0).reduce((s,x)=>s+balOf(x),0);
 let h=`<div class="top"><div><div class="brand">TradeLog NG</div><h1>${esc(S.shop||'My shop')}</h1></div></div>`;
 h+=`<div class="hero"><small>Total owed to you</small><div class="big">${naira(total)}</div><div class="row"><span>${list.length} customers</span><span>${naira(late)} overdue</span></div></div>`;
 h+=`<input class="search" data-s="fd" type="search" placeholder="Search customer name or number" value="${esc(S.fd)}">`;
 h+=`${chipsBar()}<div id="dlist">${debtsAll()}</div>`;
 return h+'<button class="fab" data-act="adddebt">+ Add debt</button>'}
function salesList(){const q=(S.fs||'').trim().toLowerCase(),d=dayOf();let h='';
 const row=(s,sd)=>`<div class="item"><div class="l1"><span class="name">${esc(s.item)}</span><span class="amt">${naira(s.amount)}</span></div><div class="l1"><span class="m">${sd?dayLabel(s.sale_date)+' · ':''}${s.method}${s.method=='Credit'?' (added to debts)':''}</span><button class="del" data-act="delsale" data-v="${s.id}">Remove</button></div></div>`;
 if(q){const r=S.sales.filter(s=>String(s.item).toLowerCase().includes(q)).reverse().sort((a,b)=>a.sale_date<b.sale_date?1:a.sale_date>b.sale_date?-1:0);
  h+=`<h2 class="sec">Search results (${r.length})</h2>`;
  if(!r.length)h+=`<div class="empty">No sale found for “${esc(S.fs)}”.</div>`;
  h+=r.map(s=>row(s,true)).join('')}
 else{const ts=S.sales.filter(s=>s.sale_date==d).reverse();
  h+=`<h2 class="sec">Sales (${ts.length})</h2>`;
  if(!ts.length)h+=`<div class="empty">No sales recorded ${d==off(0)?'yet today':'on this day'}.</div>`;
  h+=ts.map(s=>row(s,false)).join('');
  h+=`<h2 class="sec">Debts collected</h2>`+collectedHtml(d)}
 return h}
function salesView(){const d=dayOf(),m=S.d.method||'Cash',pm=S.d.pm||'Cash',isT=d==off(0);
 let h=`<div class="top"><div><h1>Sales record</h1><div class="shop">${isT?'Add each sale as it happens':'Adding to '+dayLabel(d)}</div></div></div>`;
 h+=`<div class="daybar"><button data-act="dayprev" aria-label="Previous day">‹</button><label class="dpick">📅 <b>${dayLabel(d)}</b><input type="date" data-day="1" max="${off(0)}" value="${d}"></label><button data-act="daynext" aria-label="Next day"${isT?' disabled':''}>›</button></div>`;
 h+=`<div class="hero"><small>Total sales ${isT?'today':'on '+dayLabel(d)}</small><div class="big">${naira(sumS(null,d))}</div><div class="row"><span>Cash ${naira(sumS('Cash',d))}</span><span>Transfer ${naira(sumS('Transfer',d))}</span><span>Credit ${naira(sumS('Credit',d))}</span></div><div class="row"><span>Debts collected ${naira(colOf(d))}</span></div></div><button class="full alt" style="margin-top:10px" data-act="share" data-v="${d}">Share this day on WhatsApp</button>`;
 h+=`<div class="item"><label style="margin-top:0">What was sold</label><input data-d="item" placeholder="e.g. Garri 2 paints" value="${esc(S.d.item)}"><label>Total price (₦)</label><input data-d="amount" type="number" inputmode="numeric" value="${esc(S.d.amount)}"><label>Paid by</label><div class="chips">`+['Cash','Transfer','Credit'].map(x=>`<button class="chip" data-act="method" data-v="${x}" aria-pressed="${m==x}">${x}</button>`).join('')+'</div>';
 if(m=='Credit')h+=`<label>Customer who owes</label><input data-d="cust" placeholder="e.g. Mrs. Bisi" value="${esc(S.d.cust)}"><label>Their WhatsApp number (optional)</label><input data-d="sph" type="tel" placeholder="0803 123 4567" value="${esc(S.d.sph)}"><label>Paid now (₦). Leave empty if nothing yet</label><input data-d="pn" type="number" inputmode="numeric" placeholder="0" value="${esc(S.d.pn)}"><label>Paid now by</label><div class="chips">`+['Cash','Transfer'].map(x=>`<button class="chip" data-act="pmethod" data-v="${x}" aria-pressed="${pm==x}">${x}</button>`).join('')+`</div><div class="m" id="bal" style="margin-top:8px">${balText()}</div>`;
 h+='<button class="full" data-act="addsale">Add sale</button></div>';
 h+=`<input class="search" data-s="fs" type="search" placeholder="Search all sales by item or customer" value="${esc(S.fs)}">`;
 h+=`<div id="slist">${salesList()}</div>`;
 return h}
function tonightView(){const t=off(0),owed=openD().reduce((s,x)=>s+balOf(x),0);
 return `<div class="top"><div><h1>Tonight’s summary</h1><div class="shop">Your numbers for today</div></div></div><div class="sum"><p><b>Good evening, ${esc(S.shop||'trader')}.</b></p><div class="r"><span>Sales today</span><b>${naira(sumS(null,t))}</b></div><div class="r"><span>Paid in cash</span><b>${naira(sumS('Cash',t))}</b></div><div class="r"><span>Paid by transfer</span><b>${naira(sumS('Transfer',t))}</b></div><div class="r"><span>New debts (credit sales)</span><b>${naira(sumS('Credit',t))}</b></div><div class="r"><span>Debts collected</span><b>${naira(colOf(t))}</b></div><div class="r"><span>Total owed to you</span><b>${naira(owed)}</b></div></div><button class="full" style="background:var(--wa);color:#06260f" data-act="share" data-v="${t}">Share summary on WhatsApp</button><h2 class="sec">Debts collected today</h2>${collectedHtml(t)}`}
function reportsView(){const m={};S.sales.forEach(s=>{(m[s.sale_date]=m[s.sale_date]||{date:s.sale_date,Cash:0,Transfer:0,Credit:0})[s.method]+=Number(s.amount)});
 const days=Object.values(m),tot=x=>x.Cash+x.Transfer+x.Credit,t0=off(0);
 const dd=bucketsFor(S.rp).map(b=>{const r=days.filter(x=>x.date>=b.from&&x.date<=b.to&&x.date<=t0);return{b,r,t:r.reduce((s,x)=>s+tot(x),0)}});
 const mx=Math.max(...dd.map(x=>x.t))||1,cur=dd[Math.min(S.rsel,dd.length-1)],sm=k=>cur.r.reduce((s,x)=>s+x[k],0),best=cur.r.reduce((a,x)=>!a||tot(x)>tot(a)?x:a,null);
 let h='<div class="top"><div><h1>Sales reports</h1><div class="shop">Daily, weekly and monthly totals</div></div></div><div class="chips">'+[['day','Daily'],['week','Weekly'],['month','Monthly']].map(p=>`<button class="chip" data-act="rp" data-v="${p[0]}" aria-pressed="${S.rp==p[0]}">${p[1]}</button>`).join('')+'</div>';
 h+='<div class="bars">'+dd.slice().reverse().map(x=>{const i=dd.indexOf(x);return `<button class="bar1" data-act="rb" data-v="${i}" aria-pressed="${i==S.rsel}"><span>${fmtK(x.t)}</span><i style="height:${Math.max(4,Math.round(x.t/mx*100))}px"></i><span>${x.b.label}</span></button>`}).join('')+'</div>';
 h+=`<div class="sum"><p><b>${cur.b.label}</b>${S.rp!='day'?` <span class="m">${fmtD(cur.b.from)} to ${fmtD(cur.b.to)}</span>`:''}</p><div class="r"><span>Total sales</span><b>${naira(cur.t)}</b></div><div class="r"><span>Cash</span><b>${naira(sm('Cash'))}</b></div><div class="r"><span>Transfer</span><b>${naira(sm('Transfer'))}</b></div><div class="r"><span>Credit (new debts)</span><b>${naira(sm('Credit'))}</b></div>`+(cur.r.length>1?`<div class="r"><span>Average per selling day</span><b>${naira(Math.round(cur.t/cur.r.length))}</b></div><div class="r"><span>Best day</span><b>${fmtD(best.date)}, ${naira(tot(best))}</b></div>`:'')+'</div>';
 return h+'<p class="m">Tap any bar to see that day, week or month.</p><h2 class="sec">Backup your records</h2><p class="m">Save your records as files that open in Excel or Google Sheets. Sales cover the last 2 years.</p><button class="full alt" data-act="exp" data-v="sales">Download all sales</button><button class="full alt" data-act="exp" data-v="debts">Download all debts</button><button class="full alt" data-act="exp" data-v="pays">Download payments received</button>'}
const ck=n=>String(n||'').trim().toLowerCase().replace(/\s+/g,' ');
const fmtY=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
function pastCust(){const q=(S.fd||'').trim().toLowerCase();if(!q)return '';
 const seen={};openD().forEach(x=>{seen[ck(x.customer_name)]=1});const past=[];
 S.debts.forEach(x=>{const k=ck(x.customer_name);if(!seen[k]&&k.includes(q)){seen[k]=1;past.push(x)}});
 if(!past.length)return '';
 return '<h2 class="sec">Fully paid customers</h2>'+past.map(x=>`<div class="item"><button class="name linkn" data-act="cust" data-v="${esc(ck(x.customer_name))}">${esc(x.customer_name)} ›</button> <span class="m">Fully paid</span></div>`).join('')}
function initials(n){const w=String(n||'').trim().split(/\s+/).filter(Boolean);return ((w[0]||'T').charAt(0)+(w[1]?w[1].charAt(0):'')).toUpperCase()}
function homeView(){const t=off(0),hr=new Date().getHours(),g=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening',first=(S.owner||'').trim().split(' ')[0],o=openD(),late=o.filter(x=>dayDiff(x.due_date)<0),owed=o.reduce((a,x)=>a+balOf(x),0);
 let h=`<div class="top"><div><div class="brand">TradeLog NG</div><h1>${g}${first?', '+esc(first):''}</h1></div></div>`;
 h+=`<div class="item"><div class="prof"><div class="avatar">${esc(initials(S.shop||S.owner))}</div><div><div class="name">${esc(S.shop||'My shop')}</div><div class="m">${esc(S.owner||'Add your full name')}</div>${S.phone?`<div class="m">${esc(S.phone)}</div>`:''}<div class="m">${esc((S.user&&S.user.email)||'')}</div></div></div><button class="full alt" data-act="editprof">Edit profile</button></div>`;
 h+=`<div class="hero"><small>Sales today</small><div class="big">${naira(sumS(null,t))}</div><div class="row"><span>Cash ${naira(sumS('Cash',t))}</span><span>Transfer ${naira(sumS('Transfer',t))}</span><span>Credit ${naira(sumS('Credit',t))}</span></div><div class="row"><span>Collected ${naira(colOf(t))}</span></div></div>`;
 h+=`<div class="sum"><div class="r"><span>Total owed to you</span><b>${naira(owed)}</b></div><div class="r"><span>Customers owing</span><b>${o.length}</b></div><div class="r"><span>Overdue customers</span><b>${late.length}</b></div></div>`;
 h+=`<button class="full" data-act="go" data-v="2">Record a sale</button><button class="full alt" data-act="adddebt">Add a debt</button>`;
 if(late.length)h+=`<button class="full" style="background:var(--wa);color:#06260f" data-act="rall">Remind overdue (${late.length})</button>`;
 h+=`<button class="full alt" style="margin-top:28px" data-act="out">Sign out</button>`;
 return h}
function profSheet(){return `<div class="panel"><h1>Edit profile</h1><label>Your full name</label><input data-d="po" placeholder="Chidi Okafor" value="${esc(S.d.po)}"><label>Shop or business name</label><input data-d="ps" value="${esc(S.d.ps)}"><label>Phone number</label><input data-d="pp" type="tel" placeholder="0803 123 4567" value="${esc(S.d.pp)}"><button class="full" data-act="saveprof">Save profile</button><button class="full alt" data-act="close">Cancel</button></div>`}
const dueFilter=x=>{const k=dayDiff(x.due_date);return S.ff=='late'?k<0:S.ff=='soon'?(k>=0&&k<=7):true};
function chipsBar(){const l=openD().filter(x=>dayDiff(x.due_date)<0).length,sn=openD().filter(x=>{const k=dayDiff(x.due_date);return k>=0&&k<=7}).length;
 let h='<div class="chips" style="margin-top:12px">'+[['all','All'],['late','Overdue ('+l+')'],['soon','Due soon ('+sn+')']].map(c=>`<button class="chip" data-act="ff" data-v="${c[0]}" aria-pressed="${S.ff==c[0]}">${c[1]}</button>`).join('')+'</div>';
 if(S.ff=='late'&&l)h+=`<button class="full" style="background:var(--wa);color:#06260f" data-act="rall">Remind all overdue (${l})</button>`;
 return h}
function debtsAll(){const h=debtsList();
 if(S.ff&&S.ff!='all'&&h.indexOf('class="empty"')>-1&&!(S.fd||'').trim())return '<div class="empty">'+(S.ff=='late'?'No overdue debts. Well done.':'Nothing due in the next 7 days.')+'</div>';
 return h+pastCust()}
function rallSheet(){const l=openD().filter(x=>dayDiff(x.due_date)<0);
 let h='<div class="panel"><h1>Remind overdue customers</h1><div class="shop">Tap Send for each one. WhatsApp opens with the message ready.</div>';
 if(!l.length)h+='<div class="empty">No overdue debts.</div>';
 l.forEach(x=>{const good=waNum(x.phone).length==13,done=S.sent[x.id];
  h+=`<div class="item"><div class="l1"><span class="name">${esc(x.customer_name)}</span><span class="amt">${naira(balOf(x))}</span></div><div class="l1"><span class="m">${-dayDiff(x.due_date)} days late${done?' · sent ✓':''}</span>`+(good?`<button class="b1" style="flex:none" data-act="sendone" data-v="${x.id}">${done?'Send again':'Send'}</button>`:`<button class="b2" style="flex:none" data-act="remind" data-v="${x.id}">Add number</button>`)+'</div></div>'});
 return h+'<button class="full alt" data-act="close">Close</button></div>'}
function csvCell(v){v=String(v==null?'':v);if(/^[=+\-@]/.test(v))v="'"+v;return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function downloadCsv(name,rows){const txt='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const b=new Blob([txt],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function custSheet(){
 const key=S.cust,ds=S.debts.filter(x=>ck(x.customer_name)==key);
 if(!ds.length)return '';
 const name=ds[ds.length-1].customer_name,ids=ds.map(x=>x.id),ps=S.pays.filter(p=>ids.includes(p.debt_id));
 const taken=ds.reduce((t,x)=>t+Number(x.amount),0),paid=ps.reduce((t,p)=>t+Number(p.amount),0),bal=ds.reduce((t,x)=>t+balOf(x),0);
 const phone=ds.map(x=>x.phone).filter(Boolean).pop();
 const ev=[];
 ds.forEach(x=>ev.push({t:x.created_at,k:'debt',a:x.amount,due:x.due_date}));
 ps.forEach(p=>ev.push({t:p.created_at,k:'pay',a:p.amount}));
 ev.sort((a,b)=>a.t<b.t?1:a.t>b.t?-1:0);
 let h=`<div class="panel"><h1>${esc(name)}</h1><div class="shop">${phone?esc(phone):'No phone number saved'}</div>`;
 h+=`<div class="sum"><div class="r"><span>Total taken on credit</span><b>${naira(taken)}</b></div><div class="r"><span>Total paid</span><b>${naira(paid)}</b></div><div class="r"><span>Still owes</span><b>${naira(bal)}</b></div></div>`;
 ds.filter(x=>!x.paid&&balOf(x)>0).forEach(x=>{h+=`<div class="item"><div class="l1"><span class="name">Owes ${naira(balOf(x))}</span><button class="b2" style="flex:none" data-act="pay" data-v="${x.id}">Payment</button></div><div class="m">Due ${fmtD(x.due_date)}</div></div>`});
 h+='<h2 class="sec">History</h2>';
 h+=ev.map(e=>`<div class="item"><div class="l1"><span class="name">${e.k=='pay'?'Paid':'Took on credit'}</span><span class="amt">${naira(e.a)}</span></div><div class="m">${fmtY(e.t)}${e.k=='debt'?' · due '+fmtD(e.due):''}</div></div>`).join('');
 h+='<button class="full alt" data-act="close">Close</button></div>';
 return h}
function summaryText(d){const L=[];
 L.push('*'+(S.shop||'My shop')+'*');
 L.push(new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
 L.push('');
 L.push('Sales: '+naira(sumS(null,d)));
 L.push('Cash: '+naira(sumS('Cash',d)));
 L.push('Transfer: '+naira(sumS('Transfer',d)));
 L.push('Credit (new debts): '+naira(sumS('Credit',d)));
 L.push('Debts collected: '+naira(colOf(d)));
 const ps=S.pays.filter(p=>payDay(p)==d);
 if(ps.length){L.push('');L.push('Paid by:');ps.slice(0,15).forEach(p=>{const x=debtOf(p.debt_id);L.push('- '+(x?x.customer_name:'Customer')+': '+naira(p.amount))});if(ps.length>15)L.push('and '+(ps.length-15)+' more')}
 L.push('');
 L.push('Total owed to you now: '+naira(openD().reduce((t,x)=>t+balOf(x),0)));
 L.push('Sent from TradeLog NG');
 return L.join('\n')}
function sheetView(){
 if(S.sheet=='cust')return custSheet();
 if(S.sheet=='profile')return profSheet();
 if(S.sheet=='rall')return rallSheet();
 if(S.sheet=='pay'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Record payment</h1><div class="shop">${esc(x.customer_name)} still owes ${naira(balOf(x))}</div><label>Amount paid (₦)</label><input data-d="pa" type="number" inputmode="numeric" value="${esc(S.d.pa)}"><button class="full" data-act="savepay">Save payment</button><button class="full alt" data-act="close">Cancel</button></div>`}
 if(S.sheet=='edit'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Edit debt</h1><label>Customer name</label><input data-d="en" value="${esc(S.d.en)}"><label>WhatsApp number</label><input data-d="ep" type="tel" value="${esc(S.d.ep)}"><label>Total amount (₦)</label><input data-d="ea" type="number" inputmode="numeric" value="${esc(S.d.ea)}"><label>Due date</label><input data-d="ed" type="date" value="${esc(S.d.ed)}"><button class="full" data-act="saveedit">Save changes</button><button class="full alt" data-act="close">Cancel</button><button class="full" style="background:var(--redbg);color:var(--red)" data-act="deldebt">Delete this debt</button></div>`}
 if(S.sheet=='debt')return `<div class="panel"><h1>Add debt</h1><label>Customer name</label><input data-d="dn" value="${esc(S.d.dn)}"><label>Customer WhatsApp number</label><input data-d="dp" type="tel" placeholder="0803 123 4567" value="${esc(S.d.dp)}"><label>Amount owed (₦)</label><input data-d="da" type="number" inputmode="numeric" value="${esc(S.d.da)}"><label>Due date</label><input data-d="dd" type="date" value="${esc(S.d.dd)}"><button class="full" data-act="savedebt">Save debt</button><button class="full alt" data-act="close">Cancel</button></div>`;
 if(S.sheet=='remind'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Send reminder</h1><div class="wa">Hello ${esc(x.customer_name.split(' (')[0])}, this is a reminder of ${naira(balOf(x))} owed to ${esc(S.shop||'us')}. Thank you.</div><label>Customer WhatsApp number</label><input data-d="rph" type="tel" placeholder="0803 123 4567" value="${esc(S.d.rph)}"><button class="full" style="background:var(--wa);color:#06260f" data-act="send">Send on WhatsApp</button><button class="full alt" data-act="close">Close</button></div>`}
 return ''}
function recoveryView(){return `<div class="auth"><div class="brand">TradeLog NG</div><h1>Set a new password</h1><label>New password (6 or more characters)</label><input data-d="np" type="password" autocomplete="new-password" value="${esc(S.d.np)}"><button class="full" data-act="newpass">Save new password</button></div>`}
function render(){
 if(S.recovery){$('app').innerHTML=recoveryView();$('nav').innerHTML='';$('sheet').className='sheet';return}
 if(!S.user){$('app').innerHTML=authView();$('nav').innerHTML='';$('sheet').className='sheet';return}
 $('app').innerHTML=banner()+[homeView,debtsView,salesView,tonightView,reportsView][S.tab]();
 $('nav').innerHTML='<div>'+[['Home',0],['Debts',1],['Sales',2],['Tonight',3],['Reports',4]].map(t=>`<button data-act="tab" data-v="${t[1]}" aria-selected="${S.tab==t[1]}">${t[0]}</button>`).join('')+'</div>';
 $('sheet').innerHTML=sheetView();$('sheet').className='sheet'+(S.sheet?' on':'');
}
async function reload(){await sync()}
async function act(a,v){
 if(a=='mode'){S.mode=S.mode=='in'?'up':'in';render()}
 else if(a=='signin'){const r=ok(await sb.auth.signInWithPassword({email:(S.d.email||'').trim(),password:S.d.password||''}));S.user=r.user;switchUser(r.user.id);S.d={method:'Cash'};await reload()}
 else if(a=='signup'){const e=(S.d.email||'').trim(),p=S.d.password||'';if(!e||p.length<6){toast('Add your email and a password of 6 or more characters');return}
  const r=ok(await sb.auth.signUp({email:e,password:p}));
  if(!r.session){toast('Check your email to confirm, then sign in');S.mode='in';render();return}
  S.user=r.user;switchUser(r.user.id);ok(await sb.from('shops').upsert({user_id:S.user.id,name:(S.d.shop||'').trim()||'My shop',owner_name:(S.d.owner||'').trim()||null}));S.d={method:'Cash'};await reload()}
 else if(a=='sync'){sync();toast('Trying to send...')}
 else if(a=='out'){if(S.q.length&&!confirm(S.q.length+' entries have not been sent yet. Signing out will lose them. Sign out anyway?'))return;try{await sb.auth.signOut({scope:'local'})}catch(e){}S.user=null;S.debts=[];S.pays=[];S.sales=[];S.q=[];S.map={};S.uid=null;try{localStorage.removeItem('tl_cache')}catch(e){}S.d={method:'Cash'};render()}
 else if(a=='tab'){S.tab=Number(v);S.rsel=0;render()}
 else if(a=='rp'){S.rp=v;S.rsel=0;render()}
 else if(a=='rb'){S.rsel=Number(v);render()}
 else if(a=='method'){S.d.method=v;render()}
 else if(a=='adddebt'){S.d.dn='';S.d.dp='';S.d.da='';S.d.dd=off(7);S.sheet='debt';render()}
 else if(a=='close'){S.sheet=null;render()}
 else if(a=='savedebt'){const n=(S.d.dn||'').trim(),am=Number(S.d.da);if(!n||!(am>0)||!S.d.dd){toast('Add name, amount and due date');return}
  const tmp=tmpId(),row={customer_name:n,phone:(S.d.dp||'').trim()||null,amount:am,due_date:S.d.dd};S.debts.push({id:tmp,paid:false,paid_at:null,...row,created_at:new Date().toISOString()});enqueue({k:'debt',cid:newCid(),tmp,row});S.sheet=null;render();toast('Debt saved');sync()}
 else if(a=='cust'){S.cust=v;S.sheet='cust';render()}
 else if(a=='pay'){const x=S.debts.find(z=>z.id==v);S.remId=v;S.d.pa=String(balOf(x));S.sheet='pay';render()}
 else if(a=='savepay'){const x=S.debts.find(z=>z.id==S.remId),am=Number(S.d.pa),b=balOf(x);if(!(am>0)){toast('Enter the amount paid');return}if(am>b){toast('That is more than the '+naira(b)+' owed');return}
  S.pays.push({id:tmpId(),debt_id:x.id,amount:am,created_at:new Date().toISOString()});enqueue({k:'pay',cid:newCid(),debt:x.id,row:{amount:am}});
  if(am>=b){x.paid=true;x.paid_at=new Date().toISOString();enqueue({k:'upd',debt:x.id,row:{paid:true,paid_at:x.paid_at}})}
  S.sheet=null;render();toast(am>=b?'Fully paid':'Payment saved');sync()}
 else if(a=='edit'){const x=S.debts.find(z=>z.id==v);S.remId=v;S.d.en=x.customer_name;S.d.ep=x.phone||'';S.d.ea=String(x.amount);S.d.ed=x.due_date;S.sheet='edit';render()}
 else if(a=='saveedit'){const x=S.debts.find(z=>z.id==S.remId),n=(S.d.en||'').trim(),am=Number(S.d.ea);if(!n||!(am>0)||!S.d.ed){toast('Add name, amount and due date');return}
  if(am<paidOf(x)){toast('Amount cannot be less than the '+naira(paidOf(x))+' already paid');return}
  const row={customer_name:n,phone:(S.d.ep||'').trim()||null,amount:am,due_date:S.d.ed,paid:am<=paidOf(x)};Object.assign(x,row);enqueue({k:'upd',debt:x.id,row});S.sheet=null;render();toast('Changes saved');sync()}
 else if(a=='deldebt'){if(!confirm('Delete this debt and its payments?'))return;const id=S.remId;S.debts=S.debts.filter(z=>z.id!=id);S.pays=S.pays.filter(p=>p.debt_id!=id);if(isTmp(id)&&!S.map[id])S.q=S.q.filter(i=>i.tmp!=id&&i.debt!=id);else S.q.push({k:'del',debt:id});persist();S.sheet=null;render();toast('Debt deleted');sync()}
 else if(a=='forgot'){const e=(S.d.email||'').trim();if(!e){toast('Type your email above first');return}ok(await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname}));toast('Reset link sent. Check your email.')}
 else if(a=='newpass'){const p=S.d.np||'';if(p.length<6){toast('Use 6 or more characters');return}ok(await sb.auth.updateUser({password:p}));S.recovery=false;S.d={method:'Cash'};const g=await sb.auth.getSession();S.user=g.data.session?g.data.session.user:null;await reload();toast('Password changed')}
 else if(a=='remind'){const x=S.debts.find(z=>z.id==v);S.remId=v;S.d.rph=x.phone||'';S.sheet='remind';render()}
 else if(a=='send'){const n=waNum(S.d.rph),x=S.debts.find(z=>z.id==S.remId);if(n.length!=13){toast('Enter a valid Nigerian number');return}
  x.phone=S.d.rph.trim();enqueue({k:'upd',debt:x.id,row:{phone:x.phone}});sync();
  const msg='Hello '+x.customer_name.split(' (')[0]+', this is a reminder of '+naira(balOf(x))+' owed to '+(S.shop||'us')+'. Thank you.';
  S.sheet=null;render();window.open('https://wa.me/'+n+'?text='+encodeURIComponent(msg),'_blank')}
 else if(a=='share'){const d=v||off(0);window.open('https://wa.me/?text='+encodeURIComponent(summaryText(d)),'_blank')}
 else if(a=='dayprev'){const d=new Date(dayOf()+'T00:00:00');d.setDate(d.getDate()-1);S.day=iso(d);render()}
 else if(a=='daynext'){const d=new Date(dayOf()+'T00:00:00');d.setDate(d.getDate()+1);const n=iso(d);S.day=n>=off(0)?null:n;render()}
 else if(a=='go'){S.tab=Number(v);S.rsel=0;render()}
 else if(a=='editprof'){S.d.po=S.owner;S.d.ps=S.shop;S.d.pp=S.phone;S.sheet='profile';render()}
 else if(a=='saveprof'){const o=(S.d.po||'').trim(),sh=(S.d.ps||'').trim(),ph=(S.d.pp||'').trim();if(!sh){toast('Add your shop name');return}
  S.owner=o;S.shop=sh;S.phone=ph;enqueue({k:'prof',row:{name:sh,owner_name:o||null,phone:ph||null}});S.sheet=null;render();toast('Profile saved');sync()}
 else if(a=='ff'){S.ff=v;render()}
 else if(a=='rall'){S.sheet='rall';render()}
 else if(a=='sendone'){const x=debtOf(v);if(!x)return;S.sent[x.id]=true;const msg='Hello '+x.customer_name.split(' (')[0]+', this is a reminder of '+naira(balOf(x))+' owed to '+(S.shop||'us')+'. Thank you.';render();window.open('https://wa.me/'+waNum(x.phone)+'?text='+encodeURIComponent(msg),'_blank')}
 else if(a=='exp'){const t=off(0);
  if(v=='sales'){const r=S.sales.slice().sort((p,q)=>p.sale_date<q.sale_date?1:p.sale_date>q.sale_date?-1:0).map(z=>[z.sale_date,z.item,z.amount,z.method]);downloadCsv('tradelog-sales-'+t+'.csv',[['Date','Item','Amount (NGN)','Paid by']].concat(r))}
  else if(v=='debts'){const r=S.debts.map(x=>[x.customer_name,x.phone||'',x.created_at?iso(new Date(x.created_at)):'',x.due_date,x.amount,paidOf(x),balOf(x),balOf(x)==0?'Paid':dayDiff(x.due_date)<0?'Overdue':'Open']);downloadCsv('tradelog-debts-'+t+'.csv',[['Customer','Phone','Date recorded','Due date','Total owed (NGN)','Paid so far (NGN)','Balance (NGN)','Status']].concat(r))}
  else{const r=S.pays.slice().reverse().map(p=>{const x=debtOf(p.debt_id);return [payDay(p),x?x.customer_name:'Customer',p.amount]});downloadCsv('tradelog-payments-'+t+'.csv',[['Date','Customer','Amount (NGN)']].concat(r))}
  toast('File saved. Check your Downloads.')}
 else if(a=='pmethod'){S.d.pm=v;render()}
 else if(a=='addsale'){const it=(S.d.item||'').trim(),am=Number(S.d.amount),m=S.d.method||'Cash',day=dayOf();
  if(!it||!(am>0)){toast('Add what was sold and the total price');return}
  const addSale=(item,amt,meth)=>{const tmp=tmpId(),row={item:item,amount:amt,method:meth,sale_date:day};S.sales.push({id:tmp,...row,created_at:new Date().toISOString()});enqueue({k:'sale',cid:newCid(),tmp,row})};
  if(m=='Credit'){const c=(S.d.cust||'').trim(),pn=Number(S.d.pn)||0,pm=S.d.pm||'Cash';
   if(!c){toast('Add the customer who owes');return}
   if(pn<0||pn>=am){toast(pn>=am?'Paid now must be less than the total. Use Cash or Transfer instead.':'Enter a valid amount');return}
   const owe=am-pn,row={customer_name:c,phone:(S.d.sph||'').trim()||null,amount:owe,due_date:off(7)},tmp=tmpId();
   S.debts.push({id:tmp,paid:false,paid_at:null,...row,created_at:new Date().toISOString()});enqueue({k:'debt',cid:newCid(),tmp,row});
   if(pn>0)addSale(it+', '+c+' (part paid)',pn,pm);
   addSale(it+', '+c,owe,'Credit')}
  else addSale(it,am,m);
  S.d={method:m};render();toast(m=='Credit'?'Saved. The balance is in Debts.':'Sale added');sync()}
 else if(a=='delsale'){S.sales=S.sales.filter(s=>s.id!=v);if(isTmp(v)&&!S.map[v])S.q=S.q.filter(i=>i.tmp!=v);else S.q.push({k:'delsale',id:v});persist();render();toast('Sale removed');sync()}
}
document.addEventListener('input',e=>{const t=e.target,k=t.dataset.d,sk=t.dataset.s;
 if(k){S.d[k]=t.value;if(k=='pn'||k=='amount'){const b=$('bal');if(b)b.textContent=balText()}}
 else if(sk){S[sk]=t.value;const el=$(sk=='fd'?'dlist':'slist');if(el)el.innerHTML=sk=='fd'?debtsAll():salesList()}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.day&&t.value){S.day=t.value==off(0)?null:t.value;render()}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b||S.busy)return;S.busy=true;
 try{await act(b.dataset.act,b.dataset.v)}catch(err){console.error(err);toast(/fetch|network/i.test(err.message||'')?'No network. Try again.':(err.message||'Something went wrong').slice(0,60))}
 S.busy=false});
sb.auth.onAuthStateChange(ev=>{if(ev=='PASSWORD_RECOVERY'){S.recovery=true;render()}});
if(/type=recovery/.test(location.hash))S.recovery=true;
window.addEventListener('online',()=>sync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(()=>{if(S.user&&(S.q.length||S.offline))sync()},30000);
(async()=>{
 let c=null;try{c=JSON.parse(localStorage.getItem('tl_cache')||'null')}catch(e){}
 let sess=null,down=false;
 try{const g=await sb.auth.getSession();sess=g.data.session;if(!sess&&g.error&&(isNet(g.error)||g.error.name=='AuthRetryableFetchError'))down=true}catch(e){down=true}
 if(sess){S.user=sess.user;if(!useCache(c,sess.user.id)){try{await loadAll()}catch(e){S.offline=true}}}
 else if(c&&c.uid&&down){S.user={id:c.uid};useCache(c,c.uid);S.offline=true}
 render();
 if(S.user)sync();
})();
