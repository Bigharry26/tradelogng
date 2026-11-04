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
const S={user:null,shop:'',owner:'',phone:'',photo:'',debts:[],pays:[],sales:[],q:[],map:{},uid:null,offline:false,syncing:false,again:false,recovery:false,day:null,fd:'',fs:'',ff:'all',sent:{},ex:[],tab:0,sheet:null,mode:'start',show:false,busy:false,d:{method:'Cash'},rp:'day',rsel:0,remId:null};
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2200)}
function ok(r){if(r.error)throw r.error;return r.data}
async function fetchAll(build){let out=[],from=0;for(;;){const data=ok(await build().range(from,from+999));out=out.concat(data);if(data.length<1000)break;from+=1000}return out}
const isNet=e=>{const m=String((e&&e.message)||e||'');return !navigator.onLine||/fetch|network|abort|timeout|timed out|offline|load failed|failed to connect/i.test(m)};
const isTmp=id=>typeof id=='string'&&id.charAt(0)=='n';
const newCid=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const tmpId=()=>'n'+newCid();
function persist(){try{if(S.user)S.uid=S.user.id;localStorage.setItem('tl_cache',JSON.stringify({uid:S.uid,shop:S.shop,owner:S.owner,phone:S.phone,photo:S.photo,debts:S.debts,pays:S.pays,sales:S.sales,ex:S.ex,q:S.q,map:S.map}))}catch(e){}}
const AT=it=>it.at?{created_at:it.at}:{};
function enqueue(it){if(!it.at)it.at=new Date().toISOString();S.q.push(it);persist()}
function useCache(c,uid){if(c&&c.uid&&c.uid==uid){S.uid=uid;S.shop=c.shop||'';S.owner=c.owner||'';S.phone=c.phone||'';S.photo=c.photo||'';S.debts=c.debts||[];S.pays=c.pays||[];S.sales=c.sales||[];S.q=c.q||[];S.map=c.map||{};S.ex=c.ex||[];return true}return false}
function switchUser(uid){let c=null;try{c=JSON.parse(localStorage.getItem('tl_cache')||'null')}catch(e){}if(!useCache(c,uid)){S.uid=uid;S.shop='';S.owner='';S.phone='';S.photo='';S.debts=[];S.pays=[];S.sales=[];S.q=[];S.map={};S.ex=[]}}
function banner(){const n=S.q.length;if(!n&&!S.offline)return '';return `<button class="sync" data-act="sync">${n?n+(n==1?' entry is':' entries are')+' saved on this phone and waiting to send. Tap to retry.':'No network. Showing records saved on this phone.'}</button>`}
function softRender(){const a=document.activeElement;if(a&&a.tagName=='INPUT')return;render()}
async function insIdem(t,row){const r=await sb.from(t).insert(row).select().single();
 if(r.error&&r.error.code=='23505'){const g=await sb.from(t).select('*').eq('cid',row.cid).single();if(g.error)throw g.error;return g.data}
 if(r.error)throw r.error;return r.data}
async function runItem(it){const R=id=>S.map[id]||id;
 if(it.k=='debt'){const r=await insIdem('debts',{...it.row,cid:it.cid,...AT(it)});S.map[it.tmp]=r.id}
 else if(it.k=='sale'){const r=await insIdem('sales',{...it.row,cid:it.cid,...AT(it)});S.map[it.tmp]=r.id}
 else if(it.k=='pay'){S.map[it.tmp]=(await insIdem('payments',{debt_id:R(it.debt),amount:it.row.amount,cid:it.cid,...AT(it)})).id}
 else if(it.k=='upd'){ok(await sb.from('debts').update(it.row).eq('id',R(it.debt)))}
 else if(it.k=='del'){ok(await sb.from('debts').delete().eq('id',R(it.debt)))}
 else if(it.k=='delsale'){ok(await sb.from('sales').delete().eq('id',R(it.id)))}
 else if(it.k=='prof'){ok(await sb.from('shops').upsert({user_id:S.uid,...it.row}))}
 else if(it.k=='exp'){const r=await insIdem('expenses',{...it.row,cid:it.cid,...AT(it)});S.map[it.tmp]=r.id}
 else if(it.k=='delexp'){ok(await sb.from('expenses').delete().eq('id',R(it.id)))}
 else if(it.k=='updsale'){ok(await sb.from('sales').update(it.row).eq('id',R(it.id)))}
 else if(it.k=='delpay'){ok(await sb.from('payments').delete().eq('id',R(it.id)))}}
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
 const sh=await sb.from('shops').select('name,owner_name,phone,photo').maybeSingle();if(sh.error)throw sh.error;
 const d=await fetchAll(()=>sb.from('debts').select('*').order('id'));
 const p=await fetchAll(()=>sb.from('payments').select('*').order('id'));
 const sl=await fetchAll(()=>sb.from('sales').select('*').gte('sale_date',off(-730)).order('id'));
 const e=await fetchAll(()=>sb.from('expenses').select('*').gte('expense_date',off(-730)).order('id'));
 if(S.q.length)return false;
 S.shop=sh.data?sh.data.name:'';S.owner=sh.data?(sh.data.owner_name||''):'';S.phone=sh.data?(sh.data.phone||''):'';S.photo=sh.data?(sh.data.photo||''):'';S.debts=d;S.pays=p;S.sales=sl;S.ex=e;persist();return true}
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
const openD=()=>S.debts.filter(x=>!x.paid&&balOf(x)>0).sort((a,b)=>a.due_date<b.due_date?-1:1);
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
const eyeOn='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOff='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
function pwField(key,label,ac){return `<label>${label}</label><div class="pw"><input data-d="${key}" type="${S.show?'text':'password'}" autocomplete="${ac}" value="${esc(S.d[key])}"><button type="button" class="eye" data-act="eye" aria-label="Show or hide password">${S.show?eyeOff:eyeOn}</button></div>`}
function authView(){const m=S.mode;
 if(m=='start')return `<div class="auth" style="text-align:center"><img src="icon-192.png" width="88" height="88" style="border-radius:22px" alt=""><div class="brand" style="margin-top:14px">TradeLog NG</div><h1>Record sales. Track debts.</h1><div class="shop">Your shop records, safe on your phone</div><button class="full" data-act="mode" data-v="in">Log in</button><button class="full alt" data-act="mode" data-v="up">Create account</button><p class="m" style="margin-top:18px"><a href="privacy.html" target="_blank" style="color:var(--green)">Terms and Privacy Policy</a></p></div>`;
 const up=m=='up';
 return `<div class="auth"><button class="back" data-act="mode" data-v="start">${backSvg}Back</button><div class="brand">TradeLog NG</div><h1>${up?'Create your account':'Welcome back'}</h1><div class="shop">${up?'It takes about a minute':'Log in to see your records'}</div>`+
 (up?`<label>Your full name</label><input data-d="owner" placeholder="Chidi Okafor" autocomplete="name" value="${esc(S.d.owner)}"><label>Shop name</label><input data-d="shop" placeholder="Mama Chidi Provisions" value="${esc(S.d.shop)}">`:'')+
 `<label>Email</label><input data-d="email" type="email" autocomplete="email" value="${esc(S.d.email)}">`+
 pwField('password',up?'Password (6 or more characters)':'Password',up?'new-password':'current-password')+
 (up?pwField('password2','Verify your password','new-password'):'')+
 (up?`<label style="display:flex;gap:10px;align-items:flex-start;color:var(--ink);font-size:14px;margin-top:16px"><input type="checkbox" data-d="agree" style="width:22px;height:22px;flex:none;margin-top:2px" ${S.d.agree?'checked':''}><span>I agree to the <a href="privacy.html" target="_blank" style="color:var(--green)">Terms and Privacy Policy</a></span></label>`:'')+
 `<button class="full" data-act="${up?'signup':'signin'}">${up?'Create account':'Log in'}</button>`+
 (up?`<button class="full alt" data-act="mode" data-v="in">I already have an account</button>`:`<button class="full alt" data-act="forgot">Forgot password?</button><button class="full alt" data-act="mode" data-v="up">Create a new account</button>`)+'</div>'}
function dayOf(){return S.day||off(0)}
function dayLabel(d){return d==off(0)?'Today':d==off(-1)?'Yesterday':new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
const payDay=p=>iso(new Date(p.created_at));
const debtOf=id=>S.debts.find(z=>z.id==id);
const colOf=d=>S.pays.filter(p=>payDay(p)==d).reduce((t,p)=>t+Number(p.amount),0);
function balText(){const am=Number(S.d.amount)||0,pn=Number(S.d.pn)||0;if(!(am>0))return '';if(pn>=am&&pn>0)return 'Paid now must be less than the total price';return 'Customer will owe '+naira(am-(pn>0?pn:0))}
function collectedHtml(d){const ps=S.pays.filter(p=>payDay(p)==d).slice().reverse();
 if(!ps.length)return '<div class="empty">No debts collected '+(d==off(0)?'today':'on this day')+'.</div>';
 return ps.map(p=>{const x=debtOf(p.debt_id);return `<div class="item"><div class="l1">${x?`<button class="name linkn" data-act="cust" data-v="${esc(ck(x.customer_name))}">${esc(x.customer_name)} ›</button>`:'<span class="name">Customer</span>'}<span class="amt">${naira(p.amount)}</span></div><div class="m">${fmtT(p.created_at)}${x&&balOf(x)>0?' · still owes '+naira(balOf(x)):' · fully paid'}</div><div class="l1"><span></span><button class="del" data-act="delpay" data-v="${p.id}">Remove</button></div></div>`}).join('')}
function debtsList(){const q=(S.fd||'').trim().toLowerCase(),qd=q.replace(/\D/g,'');
 const list=openD().filter(dueFilter).filter(x=>!q||String(x.customer_name).toLowerCase().includes(q)||(qd.length>2&&String(x.phone||'').replace(/\D/g,'').includes(qd)));
 let h='';
 if(!list.length)h+=`<div class="empty">${q?'No open debt found for “'+esc(S.fd)+'”.':'Nobody owes you. Tap “Add debt” when someone takes goods on credit.'}</div>`;
 list.forEach(x=>{const t=tagFor(x);h+=`<div class="item"><div class="l1"><button class="name linkn" data-act="cust" data-v="${esc(ck(x.customer_name))}">${esc(x.customer_name)} ›</button><span class="amt">${naira(balOf(x))}</span></div>${paidOf(x)>0?`<div class="m">Owed ${naira(x.amount)}, paid ${naira(paidOf(x))}</div>`:''}${x.created_at?`<div class="m">Recorded ${fmtDT(x.created_at)}</div>`:''}<span class="tag ${t[0]}">${t[1]}</span><div class="acts"><button class="b1" data-act="remind" data-v="${x.id}">Remind</button><button class="b2" data-act="pay" data-v="${x.id}">Payment</button><button class="b2" data-act="edit" data-v="${x.id}">Edit</button></div></div>`});
 return h}
function debtsView(){const list=openD(),total=list.reduce((s,x)=>s+balOf(x),0),late=list.filter(x=>dayDiff(x.due_date)<0).reduce((s,x)=>s+balOf(x),0);
 let h=`<div class="top"><div><div class="brand">TradeLog NG</div><h1>${esc(S.shop||'My shop')}</h1></div>${bellBtn()}</div>`;
 h+=`<div class="hero"><small>Total owed to you</small><div class="big">${naira(total)}</div><div class="row"><span>${new Set(list.map(x=>ck(x.customer_name))).size} customers</span><span>${naira(late)} overdue</span></div></div>`;
 h+=`<input class="search" data-s="fd" type="search" placeholder="Search customer name or number" value="${esc(S.fd)}">`;
 h+=`${chipsBar()}<div id="dlist">${debtsAll()}</div>`;
 return h+'<button class="fab" data-act="adddebt">+ Add debt</button>'}
function salesList(){const q=(S.fs||'').trim().toLowerCase(),d=dayOf();let h='';
 const row=(s,sd)=>`<div class="item"><div class="l1"><span class="name">${esc(s.item)}</span><span class="amt">${naira(s.amount)}</span></div><div class="l1"><span class="m">${sd?dayLabel(s.sale_date)+' · ':''}${recT(s.created_at,s.sale_date)?recT(s.created_at,s.sale_date)+' · ':''}${s.method}${s.method=='Credit'?' (added to debts)':''}</span><span style="white-space:nowrap">${s.method!='Credit'?`<button class="del" data-act="editsale" data-v="${s.id}">Edit</button>`:''}<button class="del" data-act="rcpt" data-v="${s.id}">Receipt</button><button class="del" data-act="delsale" data-v="${s.id}">Remove</button></span></div></div>`;
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
 h+=`<div class="daybar"><button data-act="dayprev" aria-label="Previous day">${chevL}</button><label class="dpick">📅 <b>${dayLabel(d)}</b><input type="date" data-day="1" max="${off(0)}" value="${d}"></label><button data-act="daynext" aria-label="Next day"${isT?' disabled':''}>${chevR}</button></div>`;
 h+=`<div class="hero"><small>Total sales ${isT?'today':'on '+dayLabel(d)}</small><div class="big">${naira(sumS(null,d))}</div><div class="row"><span>Cash ${naira(sumS('Cash',d))}</span><span>Transfer ${naira(sumS('Transfer',d))}</span><span>Credit ${naira(sumS('Credit',d))}</span></div><div class="row"><span>Debts collected ${naira(colOf(d))}</span></div></div><button class="full alt" style="margin-top:10px" data-act="share" data-v="${d}">Share this day on WhatsApp</button>`;
 h+=`<div class="item"><label style="margin-top:0">What was sold</label><input data-d="item" placeholder="e.g. Garri 2 paints" value="${esc(S.d.item)}"><label>Total price (₦)</label><input data-d="amount" type="number" inputmode="numeric" value="${esc(S.d.amount)}"><label>Paid by</label><div class="chips">`+['Cash','Transfer','Credit'].map(x=>`<button class="chip" data-act="method" data-v="${x}" aria-pressed="${m==x}">${x}</button>`).join('')+'</div>';
 if(m=='Credit')h+=`<label>Customer who owes</label><input data-d="cust" placeholder="e.g. Mrs. Bisi" value="${esc(S.d.cust)}"><label>Their WhatsApp number (optional)</label><input data-d="sph" type="tel" placeholder="0803 123 4567" value="${esc(S.d.sph)}"><label>Paid now (₦). Leave empty if nothing yet</label><input data-d="pn" type="number" inputmode="numeric" placeholder="0" value="${esc(S.d.pn)}"><label>Paid now by</label><div class="chips">`+['Cash','Transfer'].map(x=>`<button class="chip" data-act="pmethod" data-v="${x}" aria-pressed="${pm==x}">${x}</button>`).join('')+`</div><div class="m" id="bal" style="margin-top:8px">${balText()}</div>`;
 h+='<button class="full" data-act="addsale">Add sale</button></div>';
 h+=`<input class="search" data-s="fs" type="search" placeholder="Search all sales by item or customer" value="${esc(S.fs)}">`;
 h+=`<div id="slist">${salesList()}</div>`;
 return h}
function tonightView(){const t=off(0),owed=openD().reduce((s,x)=>s+balOf(x),0);
 return `<div class="top"><div><h1>Tonight’s summary</h1><div class="shop">Your numbers for today</div></div></div><div class="sum"><p><b>Good evening, ${esc(S.shop||'trader')}.</b></p><div class="r"><span>Sales today</span><b>${naira(sumS(null,t))}</b></div><div class="r"><span>Paid in cash</span><b>${naira(sumS('Cash',t))}</b></div><div class="r"><span>Paid by transfer</span><b>${naira(sumS('Transfer',t))}</b></div><div class="r"><span>New debts (credit sales)</span><b>${naira(sumS('Credit',t))}</b></div><div class="r"><span>Debts collected</span><b>${naira(colOf(t))}</b></div><div class="r"><span>Money received today</span><b>${naira(recvOn(t))}</b></div><div class="r"><span>Spent today</span><b>${naira(expSum(t))}</b></div><div class="r"><span>Money remaining today</span><b class="${remOn(t)<0?'neg':''}">${nm(remOn(t))}</b></div><div class="r"><span>Profit today (sales − spent)</span><b class="${sumS(null,t)-expSum(t)<0?'neg':''}">${nm(sumS(null,t)-expSum(t))}</b></div><div class="r"><span>Total owed to you</span><b>${naira(owed)}</b></div></div><button class="full" style="background:var(--wa);color:#06260f" data-act="share" data-v="${t}">Share summary on WhatsApp</button><h2 class="sec">Debts collected today</h2>${collectedHtml(t)}`}
function reportsView(){const m={};S.sales.forEach(s=>{(m[s.sale_date]=m[s.sale_date]||{date:s.sale_date,Cash:0,Transfer:0,Credit:0})[s.method]+=Number(s.amount)});
 const days=Object.values(m),tot=x=>x.Cash+x.Transfer+x.Credit,t0=off(0);
 const dd=bucketsFor(S.rp).map(b=>{const r=days.filter(x=>x.date>=b.from&&x.date<=b.to&&x.date<=t0);return{b,r,t:r.reduce((s,x)=>s+tot(x),0)}});
 const mx=Math.max(...dd.map(x=>x.t))||1,cur=dd[Math.min(S.rsel,dd.length-1)],sm=k=>cur.r.reduce((s,x)=>s+x[k],0),best=cur.r.reduce((a,x)=>!a||tot(x)>tot(a)?x:a,null);
 let h='<div class="top"><div><h1>Sales reports</h1><div class="shop">Daily, weekly and monthly totals</div></div></div><div class="chips">'+[['day','Daily'],['week','Weekly'],['month','Monthly']].map(p=>`<button class="chip" data-act="rp" data-v="${p[0]}" aria-pressed="${S.rp==p[0]}">${p[1]}</button>`).join('')+'</div>';
 h+='<div class="bars">'+dd.slice().reverse().map(x=>{const i=dd.indexOf(x);return `<button class="bar1" data-act="rb" data-v="${i}" aria-pressed="${i==S.rsel}"><span>${fmtK(x.t)}</span><i style="height:${Math.max(4,Math.round(x.t/mx*100))}px"></i><span>${x.b.label}</span></button>`}).join('')+'</div>';
 h+=`<div class="sum"><p><b>${cur.b.label}</b>${S.rp!='day'?` <span class="m">${fmtD(cur.b.from)} to ${fmtD(cur.b.to)}</span>`:''}</p><div class="r"><span>Total sales</span><b>${naira(cur.t)}</b></div><div class="r"><span>Cash</span><b>${naira(sm('Cash'))}</b></div><div class="r"><span>Transfer</span><b>${naira(sm('Transfer'))}</b></div><div class="r"><span>Credit (new debts)</span><b>${naira(sm('Credit'))}</b></div>${profitRows(cur.b)}`+(cur.r.length>1?`<div class="r"><span>Average per selling day</span><b>${naira(Math.round(cur.t/cur.r.length))}</b></div><div class="r"><span>Best day</span><b>${fmtD(best.date)}, ${naira(tot(best))}</b></div>`:'')+'</div>';
 return h+'<p class="m">Tap any bar to see that day, week or month.</p><h2 class="sec">Reports you can save or print</h2><p class="m">Each report shows your shop name, dates and times. Save it as a PDF or download it as a spreadsheet.</p><button class="full alt" data-act="doc" data-v="sales">Sales report</button><button class="full alt" data-act="doc" data-v="pays">Payments received</button><button class="full alt" data-act="doc" data-v="exp">Expenses report</button><button class="full alt" data-act="doc" data-v="debts">Customer debts</button><button class="full alt" data-act="doc" data-v="profit">Profit report (day by day)</button>'}
const ck=n=>String(n||'').trim().toLowerCase().replace(/\s+/g,' ');
const fmtY=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
function pastCust(){const q=(S.fd||'').trim().toLowerCase();if(!q)return '';
 const seen={};openD().forEach(x=>{seen[ck(x.customer_name)]=1});const past=[];
 S.debts.forEach(x=>{const k=ck(x.customer_name);if(!seen[k]&&k.includes(q)){seen[k]=1;past.push(x)}});
 if(!past.length)return '';
 return '<h2 class="sec">Fully paid customers</h2>'+past.map(x=>`<div class="item"><button class="name linkn" data-act="cust" data-v="${esc(ck(x.customer_name))}">${esc(x.customer_name)} ›</button> <span class="m">Fully paid</span></div>`).join('')}
function initials(n){const w=String(n||'').trim().split(/\s+/).filter(Boolean);return ((w[0]||'T').charAt(0)+(w[1]?w[1].charAt(0):'')).toUpperCase()}
const goodPhoto=()=>S.photo&&String(S.photo).indexOf('data:image/')==0;
function resizeImg(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const n=240,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),m=Math.min(im.width,im.height);x.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,n,n);cb(c.toDataURL('image/jpeg',0.8))};im.onerror=()=>cb(null);im.src=r.result};r.onerror=()=>cb(null);r.readAsDataURL(file)}
function homeView(){const t=off(0),hr=new Date().getHours(),g=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening',first=(S.owner||'').trim().split(' ')[0],o=openD(),late=o.filter(x=>dayDiff(x.due_date)<0),owed=o.reduce((a,x)=>a+balOf(x),0);
 let h=`<div class="top"><div><div class="brand">TradeLog NG</div><h1>${g}${first?', '+esc(first):''}</h1></div>${bellBtn()}</div>`;
 h+=`<div class="item"><div class="prof"><label class="avatar">${goodPhoto()?`<img src="${esc(S.photo)}" alt="Profile picture">`:esc(initials(S.shop||S.owner))}<input type="file" accept="image/*" data-photo="1" style="display:none"></label><div><div class="name">${esc(S.shop||'My shop')}</div><div class="m">${esc(S.owner||'Add your full name')}</div>${S.phone?`<div class="m">${esc(S.phone)}</div>`:''}<div class="m">${esc((S.user&&S.user.email)||'')}</div><div class="m">Tap the picture to change it</div></div></div><button class="full alt" data-act="editprof">Edit profile</button></div>`;
 
 h+=`<div class="hero"><small>Sales today</small><div class="big">${naira(sumS(null,t))}</div><div class="row"><span>Cash ${naira(sumS('Cash',t))}</span><span>Transfer ${naira(sumS('Transfer',t))}</span><span>Credit ${naira(sumS('Credit',t))}</span></div><div class="row"><span>Collected ${naira(colOf(t))}</span></div></div>`;
 h+=`<div class="sum"><div class="r"><span>Total owed to you</span><b>${naira(owed)}</b></div><div class="r"><span>Spent today</span><b>${naira(expSum(t))}</b></div><div class="r"><span>Profit today</span><b class="${sumS(null,t)-expSum(t)<0?'neg':''}">${nm(sumS(null,t)-expSum(t))}</b></div><div class="r"><span>Customers owing</span><b>${new Set(o.map(x=>ck(x.customer_name))).size}</b></div><div class="r"><span>Overdue customers</span><b>${late.length}</b></div></div>`;
 h+=`<button class="full" data-act="go" data-v="2">Record a sale</button><button class="full alt" data-act="adddebt">Add a debt</button><button class="full alt" data-act="go" data-v="5">Add an expense</button>`;
 if(late.length)h+=`<button class="full" style="background:var(--wa);color:#06260f" data-act="rall">Remind overdue (${late.length})</button>`;
 h+=`<h2 class="sec">About</h2><a class="full alt" style="display:block;text-align:center;text-decoration:none;border-radius:10px;font-weight:600" href="privacy.html" target="_blank">Privacy policy and terms</a><h2 class="sec">Security</h2><button class="full alt" data-act="pinset">${getPin()?'Change PIN':'Set PIN lock'}</button>${getPin()?'<button class="full alt" data-act="pinoff">Turn off PIN lock</button>':''}<button class="full alt" style="color:var(--red)" data-act="wipe">Clear all my records</button><button class="full alt" style="margin-top:28px" data-act="out">Sign out</button>`;
 return h}
function profSheet(){return `<div class="panel"><h1>Edit profile</h1><label>Your full name</label><input data-d="po" placeholder="Chidi Okafor" value="${esc(S.d.po)}"><label>Shop or business name</label><input data-d="ps" value="${esc(S.d.ps)}"><label>Phone number</label><input data-d="pp" type="tel" placeholder="0803 123 4567" value="${esc(S.d.pp)}">${goodPhoto()?'<button class="full alt" data-act="rmphoto">Remove photo</button>':''}<button class="full" data-act="saveprof">Save profile</button><button class="full alt" data-act="close">Cancel</button></div>`}
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
function csvCell(v){const isN=typeof v=='number';v=String(v==null?'':v);if(!isN&&/^[=+\-@]/.test(v))v="'"+v;return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
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
 h+=ev.map(e=>`<div class="item"><div class="l1"><span class="name">${e.k=='pay'?'Paid':'Took on credit'}</span><span class="amt">${naira(e.a)}</span></div><div class="m">${fmtY(e.t)}, ${fmtT(e.t)}${e.k=='debt'?' · due '+fmtD(e.due):''}</div></div>`).join('');
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
 L.push('Debts collected: '+naira(colOf(d)));L.push('Spent: '+naira(expSum(d)));L.push('Money received: '+naira(recvOn(d)));L.push('Money remaining (received - spent): '+nm(remOn(d)));L.push('Profit (sales - spent): '+nm(sumS(null,d)-expSum(d)));
 const ps=S.pays.filter(p=>payDay(p)==d);
 if(ps.length){L.push('');L.push('Paid by:');ps.slice(0,15).forEach(p=>{const x=debtOf(p.debt_id);L.push('- '+(x?x.customer_name:'Customer')+': '+naira(p.amount)+' ('+fmtT(p.created_at)+')')});if(ps.length>15)L.push('and '+(ps.length-15)+' more')}
 L.push('');
 L.push('Total owed to you now: '+naira(openD().reduce((t,x)=>t+balOf(x),0)));
 L.push('Sent from TradeLog NG, '+fmtT(new Date().toISOString()));
 return L.join('\n')}
const fmtT=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true});
const fmtYD=s=>fmtY(s+'T00:00:00');
const fmtDT=t=>fmtD(iso(new Date(t)))+', '+fmtT(t);
const recT=(c,d)=>{if(!c)return '';const t=fmtT(c),cd=iso(new Date(c));return cd==d?t:'added '+fmtD(cd)+', '+t};
const moneyF=n=>(n<0?'-':'')+Math.abs(Number(n)).toLocaleString('en-NG');
function rangeOf(per){const t=off(0);
 if(per=='today')return [t,t,'Today, '+fmtYD(t)];
 if(per=='week'){const f=off(-((todayD().getDay()+6)%7));return [f,t,'This week: '+fmtYD(f)+' to '+fmtYD(t)]}
 if(per=='month'){const d=todayD(),f=iso(new Date(d.getFullYear(),d.getMonth(),1));return [f,t,'This month: '+fmtYD(f)+' to '+fmtYD(t)]}
 if(per=='30'){const f=off(-29);return [f,t,'Last 30 days: '+fmtYD(f)+' to '+fmtYD(t)]}
 return ['0000-01-01',t,'All records up to '+fmtYD(t)]}
function docData(type,per){
 const r=rangeOf(per),f=r[0],t=r[1],inR=x=>x>=f&&x<=t,now=new Date().toISOString(),gen=fmtY(now)+', '+fmtT(now);
 const sumA=(a,fn)=>a.reduce((s,x)=>s+Number(fn(x)),0);
 const cmp=(x,y)=>x<y?-1:x>y?1:0;
 let title='',plabel=r[2],head=[],rows=[],sum=[],num=[];
 if(type=='sales'){title='Sales report';head=['No.','Date','Time','Item','Paid by','Amount (NGN)'];num=[5];
  const l=S.sales.filter(s=>inR(s.sale_date)).sort((a,b)=>cmp(a.sale_date+(a.created_at||''),b.sale_date+(b.created_at||'')));
  rows=l.map((s,i)=>[i+1,fmtYD(s.sale_date),s.created_at?fmtT(s.created_at):'',s.item,s.method,Number(s.amount)]);
  const by=m=>sumA(l.filter(s=>s.method==m),s=>s.amount);
  sum=[['Number of sales',l.length],['Total sales',sumA(l,s=>s.amount),1],['Paid in cash',by('Cash'),1],['Paid by transfer',by('Transfer'),1],['Credit (owed by customers)',by('Credit'),1]]}
 else if(type=='pays'){title='Payments received report';head=['No.','Date','Time','Customer','Amount (NGN)'];num=[4];
  const l=S.pays.filter(p=>inR(payDay(p))).sort((a,b)=>cmp(String(a.created_at),String(b.created_at)));
  rows=l.map((p,i)=>{const x=debtOf(p.debt_id);return [i+1,fmtYD(payDay(p)),fmtT(p.created_at),x?x.customer_name:'Customer',Number(p.amount)]});
  sum=[['Number of payments',l.length],['Total collected',sumA(l,p=>p.amount),1]]}
 else if(type=='exp'){title='Expenses report';head=['No.','Date','Time','Item','Type','Amount (NGN)'];num=[5];
  const l=S.ex.filter(e=>inR(e.expense_date)).sort((a,b)=>cmp(a.expense_date+(a.created_at||''),b.expense_date+(b.created_at||'')));
  rows=l.map((e,i)=>[i+1,fmtYD(e.expense_date),e.created_at?fmtT(e.created_at):'',e.item,e.category||'',Number(e.amount)]);
  sum=[['Number of expenses',l.length],['Total spent',sumA(l,e=>e.amount),1]];
  const cats={};l.forEach(e=>{const c=e.category||'Other';cats[c]=(cats[c]||0)+Number(e.amount)});Object.keys(cats).forEach(c=>sum.push(['   '+c,cats[c],1]))}
 else if(type=='debts'){title='Customer debts report';plabel='All debts recorded, as at '+gen;
  head=['No.','Customer','Phone','Recorded','Due date','Total (NGN)','Paid (NGN)','Balance (NGN)','Status'];num=[5,6,7];
  const l=S.debts.slice().sort((a,b)=>cmp(String(a.created_at),String(b.created_at)));
  rows=l.map((x,i)=>{const b=balOf(x),k=dayDiff(x.due_date);return [i+1,x.customer_name,x.phone||'',x.created_at?fmtYD(iso(new Date(x.created_at)))+', '+fmtT(x.created_at):'',fmtYD(x.due_date),Number(x.amount),paidOf(x),b,b==0?'Paid':k<0?'Overdue ('+(-k)+(k==-1?' day)':' days)'):'Open']});
  const o=l.filter(x=>balOf(x)>0);
  sum=[['Customers still owing',o.length],['Total still owed',sumA(o,x=>balOf(x)),1],['Overdue amount',sumA(o.filter(x=>dayDiff(x.due_date)<0),x=>balOf(x)),1]]}
 else{title='Profit report';head=['Date','Sales','Cash','Transfer','Credit','Collected','Spent','Profit'];num=[1,2,3,4,5,6,7];
  const days={},g=k=>days[k]||(days[k]={c:0,t:0,cr:0,col:0,sp:0});
  S.sales.filter(s=>inR(s.sale_date)).forEach(s=>{const o=g(s.sale_date),a=Number(s.amount);if(s.method=='Cash')o.c+=a;else if(s.method=='Transfer')o.t+=a;else o.cr+=a});
  S.pays.filter(p=>inR(payDay(p))).forEach(p=>{g(payDay(p)).col+=Number(p.amount)});
  S.ex.filter(e=>inR(e.expense_date)).forEach(e=>{g(e.expense_date).sp+=Number(e.amount)});
  const ks=Object.keys(days).sort();
  rows=ks.map(k=>{const o=days[k],sl=o.c+o.t+o.cr;return [fmtYD(k),sl,o.c,o.t,o.cr,o.col,o.sp,sl-o.sp]});
  const T=i=>rows.reduce((a,r)=>a+r[i],0),sales=T(1),spent=T(6),got=T(2)+T(3)+T(5);
  sum=[['Total sales',sales,1],['Total spent',spent,1],['Profit (sales minus spent)',sales-spent,1],['Debts collected',T(5),1],['Money received (cash, transfer, debts collected)',got,1],['Money left after spending',got-spent,1]]}
 return {title,plabel,gen,head,rows,sum,num}}
function docSheet(){const D=S.doc,d=docData(D.type,D.per);
 const pl=[['today','Today'],['week','This week'],['month','This month'],['30','Last 30 days'],['all','All time']];
 let h='<div class="panel docwrap">';
 if(D.type!='debts')h+='<div class="noprint dchips">'+pl.map(p=>`<button data-act="dper" data-v="${p[0]}" aria-pressed="${D.per==p[0]}">${p[1]}</button>`).join('')+'</div>';
 h+=`<div class="dhead"><div class="dshop">${esc(S.shop||'My shop')}</div><div class="dm">${[S.owner,S.phone,(S.user&&S.user.email)||''].filter(Boolean).map(esc).join(' · ')}</div><h1>${esc(d.title)}</h1><div class="dm">${esc(d.plabel)}</div><div class="dm">Generated: ${esc(d.gen)}</div></div>`;
 if(!d.rows.length)h+='<p class="dm">No records for this period.</p>';
 else h+='<div class="tbox"><table><thead><tr>'+d.head.map((x,i)=>`<th class="${d.num.includes(i)?'n':''}">${esc(x)}</th>`).join('')+'</tr></thead><tbody>'+d.rows.map(r=>'<tr>'+r.map((v,i)=>`<td class="${d.num.includes(i)?'n':''}">${d.num.includes(i)?moneyF(v):esc(v)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>';
 h+='<table class="sumt"><tbody>'+d.sum.map(x=>`<tr class="tot"><td>${esc(x[0])}</td><td class="n">${x[2]?'₦'+moneyF(x[1]):esc(x[1])}</td></tr>`).join('')+'</tbody></table>';
 h+='<p class="dm">Generated by TradeLog NG</p>';
 h+='<div class="noprint"><button class="full" data-act="print">Save as PDF or print</button><button class="full alt" data-act="docsv">Download spreadsheet (Excel or Sheets)</button><button class="full alt" data-act="close">Close</button><p class="dm">Tip: on the print screen, choose “Save as PDF” as the printer.</p></div></div>';
 return h}
const nm=n=>n<0?'-'+naira(-n):naira(n);
const expSum=d=>S.ex.filter(e=>e.expense_date==d).reduce((t,e)=>t+Number(e.amount),0);
function saleReceipt(s){const cr=s.method=='Credit';return ['*'+(S.shop||'My shop')+'*','Receipt, '+fmtY(s.sale_date+'T00:00:00')+(s.created_at?', '+fmtT(s.created_at):''),'','Item: '+s.item,(cr?'Balance still owed: ':'Amount paid: ')+naira(s.amount),cr?'Please pay the balance by the agreed date.':'Paid by: '+s.method,'','Thank you for your patronage.'].join('\n')}
function payReceipt(x,am,bal){return ['*'+(S.shop||'My shop')+'*','Payment receipt, '+fmtY(new Date().toISOString())+', '+fmtT(new Date().toISOString()),'','Customer: '+x.customer_name,'Amount received: '+naira(am),bal>0?'Balance still owed: '+naira(bal):'Fully paid. Thank you!','','Thank you for your patronage.'].join('\n')}
function profitRows(b){const t0=off(0),to=b.to>t0?t0:b.to,inR=x=>x>=b.from&&x<=to;
 const sl=S.sales.filter(s=>inR(s.sale_date)),sales=sl.reduce((t,s)=>t+Number(s.amount),0),spent=S.ex.filter(e=>inR(e.expense_date)).reduce((t,e)=>t+Number(e.amount),0),col=S.pays.filter(p=>inR(payDay(p))).reduce((t,p)=>t+Number(p.amount),0),got=sl.filter(s=>s.method!='Credit').reduce((t,s)=>t+Number(s.amount),0)+col;
 return `<div class="r"><span>Spent (expenses)</span><b>${naira(spent)}</b></div><div class="r"><span>Profit (sales − spent)</span><b class="${sales-spent<0?'neg':''}">${nm(sales-spent)}</b></div><div class="r"><span>Money received (cash, transfer, debts collected)</span><b>${naira(got)}</b></div><div class="r"><span>Money left after spending</span><b class="${got-spent<0?'neg':''}">${nm(got-spent)}</b></div>`}
function expensesView(){const d=dayOf(),isT=d==off(0),c=S.d.xc||'Restock',list=S.ex.filter(e=>e.expense_date==d).slice().reverse();
 let h='<div class="top"><div><h1>Expenses</h1><div class="shop">'+(isT?'Money you spent today':'Adding to '+dayLabel(d))+'</div></div></div>';
 h+=`<div class="daybar"><button data-act="dayprev" aria-label="Previous day">${chevL}</button><label class="dpick">📅 <b>${dayLabel(d)}</b><input type="date" data-day="1" max="${off(0)}" value="${d}"></label><button data-act="daynext" aria-label="Next day"${isT?' disabled':''}>${chevR}</button></div>`;
 h+=`<div class="hero"><small>Spent ${isT?'today':'on '+dayLabel(d)}</small><div class="big">${naira(expSum(d))}</div><div class="row"><span>Sales ${naira(sumS(null,d))}</span><span>Profit ${nm(sumS(null,d)-expSum(d))}</span></div></div>`;
 h+=`<div class="item"><label style="margin-top:0">What did you spend on</label><input data-d="xi" placeholder="e.g. Transport to market" value="${esc(S.d.xi)}"><label>Amount (₦)</label><input data-d="xa" type="number" inputmode="numeric" value="${esc(S.d.xa)}"><label>Type</label><div class="chips wrap">`+['Restock','Transport','Rent','Light/fuel','Staff','Other'].map(x=>`<button class="chip" data-act="xcat" data-v="${x}" aria-pressed="${c==x}">${x}</button>`).join('')+'</div><button class="full" data-act="addexp">Add expense</button></div>';
 h+=`<h2 class="sec">Expenses (${list.length})</h2>`;
 if(!list.length)h+='<div class="empty">No expenses '+(isT?'recorded yet today':'on this day')+'.</div>';
 h+=list.map(e=>`<div class="item"><div class="l1"><span class="name">${esc(e.item)}</span><span class="amt">${naira(e.amount)}</span></div><div class="l1"><span class="m">${esc(e.category||'')}${e.created_at?' · '+recT(e.created_at,e.expense_date):''}</span><button class="del" data-act="delexp" data-v="${e.id}">Remove</button></div></div>`).join('');
 return h}
async function pinHash(p,salt){const b=new TextEncoder().encode(salt+':'+p),h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('')}
function getPin(){try{return JSON.parse(localStorage.getItem('tl_pin')||'null')}catch(e){return null}}
function lockView(){return `<div class="auth" style="text-align:center"><img src="icon-192.png" width="72" height="72" style="border-radius:18px" alt=""><div class="brand" style="margin-top:12px">TradeLog NG</div><h1>Enter your PIN</h1><div class="shop">${esc(S.shop||'')}</div><label>4-digit PIN</label><input data-d="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" style="text-align:center;font-size:24px;letter-spacing:8px" value="${esc(S.d.pin)}"><button class="full" data-act="unlock">Unlock</button><button class="full alt" data-act="lockout">Forgot PIN? Sign out</button></div>`}
const bellSvg='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
function seenLoad(){let o=null;try{o=JSON.parse(localStorage.getItem('tl_seen')||'null')}catch(e){}if(!o||o.d!=off(0))o={d:off(0),k:{}};return o}
function seenSave(o){try{localStorage.setItem('tl_seen',JSON.stringify(o))}catch(e){}}
function notifs(){const late=[],today=[],soon=[];openD().forEach(x=>{const k=dayDiff(x.due_date);if(k<0)late.push(x);else if(k==0)today.push(x);else if(k<=3)soon.push(x)});return {late,today,soon,urgent:late.concat(today)}}
const nkey=x=>x.id+':'+(dayDiff(x.due_date)<0?'late':'today');
const markSeen=x=>{const sn=seenLoad();sn.k[nkey(x)]=1;seenSave(sn)};
function badgeN(){const n=notifs(),sn=seenLoad();return n.urgent.filter(x=>!sn.k[nkey(x)]).length}
function bellBtn(){const b=badgeN();return `<button class="bell" data-act="bell" aria-label="Notifications">${bellSvg}${b?`<span class="badge">${b>99?'99+':b}</span>`:''}</button>`}
function notifSheet(){const n=notifs(),sn=seenLoad();
 const row=(x,u)=>{const k=dayDiff(x.due_date),st=k<0?-k+(k==-1?' day late':' days late'):k==0?'Due today':'Due in '+k+(k==1?' day':' days'),seen=u&&sn.k[nkey(x)];
  return `<div class="item"${seen?' style="opacity:.6"':''}><div class="l1"><span class="name">${esc(x.customer_name)}</span><span class="amt">${naira(balOf(x))}</span></div><div class="l1"><span class="m">${st}${seen?' · seen':''}</span><button class="b1" style="flex:none" data-act="nremind" data-v="${x.id}">Remind</button></div></div>`};
 let h='<div class="panel"><h1>Notifications</h1>';
 if(n.urgent.length)h+='<h2 class="sec">Needs attention ('+n.urgent.length+')</h2>'+n.urgent.map(x=>row(x,1)).join('');
 if(n.soon.length)h+='<h2 class="sec">Coming up in 3 days ('+n.soon.length+')</h2>'+n.soon.map(x=>row(x,0)).join('');
 if(S.q.length)h+=`<h2 class="sec">Waiting to send</h2><div class="item"><div class="m">${S.q.length} ${S.q.length==1?'entry is':'entries are'} saved on this phone and not sent yet.</div><button class="b2" style="margin-top:8px;width:100%" data-act="sync">Try sending now</button></div>`;
 if(!n.urgent.length&&!n.soon.length&&!S.q.length)h+='<div class="empty">You are all caught up. No debts are due soon.</div>';
 if(n.urgent.length)h+='<button class="full alt" data-act="seenall">Mark all as seen</button>';
 return h+'<button class="full alt" data-act="close">Close</button></div>'}
const backSvg='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const chevL=backSvg.replace('width="18" height="18"','width="22" height="22"');
const chevR='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
const NAVP={0:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',1:'<path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z"/><path d="M9 8h6M9 12h6"/>',2:'<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',5:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="15" r="1.2"/>',3:'<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',4:'<path d="M5 20V10M12 20V4M19 20v-7"/>'};
const navIcon=k=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+NAVP[k]+'</svg>';
const recvOn=d=>sumS('Cash',d)+sumS('Transfer',d)+colOf(d);
const remOn=d=>recvOn(d)-expSum(d);
const allRemain=()=>S.sales.filter(x=>x.method!='Credit').reduce((a,x)=>a+Number(x.amount),0)+S.pays.reduce((a,p)=>a+Number(p.amount),0)-S.ex.reduce((a,e)=>a+Number(e.amount),0);
function moneyCard(t){const r=recvOn(t),sp=expSum(t),all=allRemain();
 return `<div class="mcard"><div class="mlabel">Money remaining</div><div class="mbig ${all<0?'neg2':''}">${nm(all)}</div><div class="msub">All money received, minus all you have spent</div><div class="mrows"><div><span>Received today</span><b>${naira(r)}</b></div><div><span>Spent today</span><b>${naira(sp)}</b></div><div><span>Left today</span><b class="${r-sp<0?'neg2':''}">${nm(r-sp)}</b></div></div></div>`}
const fm=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const GUIDE=[
{q:"Quick start: my first day",s:["Create your account with your full name, shop name, email and a password. Tick the box to agree, then tap **Create account**.","On **Home**, tap **Edit profile** to add your phone number, and tap the circle to add your picture.","Open the **Sales** tab and record your first sale.","Every evening, open **Tonight** to see your sales, money received, spending and who still owes you."],t:"The ? button is always here if you forget anything."},
{q:"How do I record a sale?",s:["Open the **Sales** tab.","Type what was sold, for example Garri 2 paints.","Type the total price.","Choose **Cash** or **Transfer**.","Tap **Add sale**. It appears in the list below with the time."],t:"Sold to someone who pays later? See the next question."},
{q:"A customer pays part now and the rest later. How do I record it?",s:["Open the **Sales** tab. Type the item and the **total price**.","Tap **Credit** and type the customer’s name. Add her WhatsApp number if you have it.","In **Paid now**, type what she paid and choose **Cash** or **Transfer**. The app shows how much she will still owe.","Tap **Add sale**. The part she paid is counted as money received, and the balance goes to the **Debts** tab."],t:"Example: she buys goods worth ₦10,000 and pays ₦6,000. Type 10000 as the total, 6000 as paid now, and ₦4,000 is saved as her debt."},
{q:"A customer takes goods and pays nothing yet",s:["Open the **Sales** tab and type the item and total price.","Tap **Credit** and type her name.","Leave **Paid now** empty.","Tap **Add sale**. The full amount goes to **Debts**."]},
{q:"How do I add a debt from my old notebook?",s:["Open the **Debts** tab and tap **+ Add debt**.","Type the customer’s name, her WhatsApp number, the amount owed and the due date.","Tap **Save debt**."],t:"Use the same spelling for a customer’s name every time, so her history stays together."},
{q:"A customer is paying her debt (part or full)",s:["Open the **Debts** tab. Type her name in the search bar if the list is long.","Tap **Payment** on her card.","The amount shows her full balance. For a part payment, change it to what she paid.","Tap **Save payment**. A receipt screen opens so you can send it on WhatsApp."],t:"When a debt is fully paid it leaves the Debts tab. Tap her name any time to see her full history."},
{q:"I made a mistake. How do I fix it?",s:["**Wrong cash or transfer sale:** open **Sales** and tap **Edit** on it. Or tap **Remove** and record it again.","**Wrong credit sale or debt:** open **Debts**, tap **Edit** on the debt, and change it. To delete it, tap **Delete this debt**.","**Wrong payment received:** open **Tonight** (or **Sales** and pick the date), find it under **Debts collected**, and tap **Remove**. Her balance goes back up.","**Wrong expense:** open **Expenses** and tap **Remove**."],t:"Only remove a payment if it was a mistake. If the customer really paid, keep it."},
{q:"How do I remind a customer on WhatsApp?",s:["Open the **Debts** tab and tap **Remind** on her card.","Check her number, then tap **Send on WhatsApp**.","WhatsApp opens with the message ready. Tap send. It goes from your own number."],t:"To remind many people: on Debts, tap **Overdue**, then **Remind all overdue**, and tap **Send** next to each name."},
{q:"How do I see sales from an earlier day?",s:["Open the **Sales** tab (or **Expenses**).","Tap the date bar with the 📅 to pick any day, or use the arrows to go back or forward one day.","Scroll to see every sale and every payment collected that day."],t:"For a whole week or month, use the **Reports** tab."},
{q:"How do I search?",s:["**Debts tab:** type a customer’s name or phone number in the search bar.","**Sales tab:** type an item or a customer’s name to search sales from all days.","Clear the search box to go back to the normal list."]},
{q:"How do I record money I spent?",s:["Open the **Expenses** tab.","Type what you spent on and the amount, and choose a type such as Restock or Transport.","Tap **Add expense**."],t:"You can add an expense to an earlier day by picking the date first."},
{q:"What does “Money remaining” mean?",s:["It is the money you actually have: cash sales, transfer sales and debts you collected, minus everything you spent.","Credit sales are not counted until the customer pays.","It starts from zero on the day you begin using the app. It does not include money you already had before."],t:"Profit is different. Profit is sales minus spending, and it counts credit sales even before they are paid."},
{q:"How do I get a report, a PDF or a spreadsheet?",s:["Open the **Reports** tab. Tap a bar to see that day, week or month.","Scroll down to **Reports you can save or print** and choose a report.","Choose the period at the top, such as This month.","Tap **Save as PDF or print** and choose **Save as PDF** as the printer. Or tap **Download spreadsheet** to open it in Excel or Google Sheets."]},
{q:"How do I send a receipt to a customer?",s:["For a sale: open **Sales** and tap **Receipt** on it.","For a debt payment: the receipt screen opens after you save the payment.","Tap **Send on WhatsApp** and choose the customer."]},
{q:"How do I send my daily summary on WhatsApp?",s:["Open **Tonight** and tap **Share summary on WhatsApp**.","For another day, open **Sales**, pick the date, and tap **Share this day on WhatsApp**.","Choose who to send it to, such as yourself or a partner."]},
{q:"What is the bell at the top for?",s:["The red number counts customers whose debt is **overdue or due today**.","Tap the bell to see them with a **Remind** button, plus debts coming up in 3 days.","Tap **Mark all as seen** to clear the number. It comes back tomorrow if they still owe."]},
{q:"What if there is no network?",s:["Keep working as normal. Everything is saved on your phone.","A yellow bar shows how many entries are waiting to send. They send by themselves when the network returns. You can tap the bar to try now.","Do not sign out or clear your browser data while that yellow bar is showing, or the unsent entries are lost."],t:"You must sign in once with network before you can work offline."},
{q:"How do I lock the app with a PIN?",s:["Open **Home** and tap **Set PIN lock**.","Type a 4-digit PIN twice, then tap **Save PIN**.","The app asks for the PIN when you open it and after you leave it for about a minute."],t:"If you forget it, tap **Forgot PIN? Sign out** and sign in again with your password. Unsent entries would be lost, so connect to the network first."},
{q:"How do I change my name, shop name or picture?",s:["Open **Home**.","Tap the round picture to choose a new photo.","Tap **Edit profile** to change your name, shop name or phone number."]},
{q:"I forgot my password",s:["On the log in page, type your email.","Tap **Forgot password?**.","Open the email we send you and tap the link.","Type your new password twice and tap **Save new password**."],t:"If the email does not arrive after a few minutes, check your spam folder."},
{q:"How do I put the app on my phone?",s:["Open the app link in **Chrome**.","Tap the **⋮** menu at the top right.","Tap **Install and create shortcut** (or **Add to Home screen**), then confirm.","Open it from the new icon on your home screen."]},
{q:"How do I clear everything and start fresh?",s:["Download any reports you want to keep first.","Open **Home**, scroll down and tap **Clear all my records**.","Type **DELETE** to confirm. Your login and profile stay."],t:"This cannot be undone."}
];
function guideList(){const q=(S.gq||'').trim().toLowerCase(),l=GUIDE.filter(g=>!q||(g.q+' '+g.s.join(' ')+' '+(g.t||'')).toLowerCase().includes(q));
 if(!l.length)return '<div class="empty">No help found for “'+esc(S.gq)+'”. Try a simpler word like sale, debt, payment or report.</div>';
 return l.map(g=>`<details class="gd"><summary>${esc(g.q)}</summary><div class="gb"><ol>${g.s.map(x=>'<li>'+fm(x)+'</li>').join('')}</ol>${g.t?'<div class="gtip">'+fm(g.t)+'</div>':''}</div></details>`).join('')}
function guideSheet(){return `<div class="panel"><h1>How to use TradeLog NG</h1><div class="shop">Tap a question to see the steps.</div><input class="search" data-s="gq" type="search" placeholder="Search help, e.g. part payment" value="${esc(S.gq)}"><div id="glist">${guideList()}</div><button class="full alt" data-act="close">Close</button></div>`}
const heroHid=()=>{try{return localStorage.getItem('tl_hide')=='1'}catch(e){return false}};
function heroEye(){const hide=heroHid();
 document.querySelectorAll('#app .hero').forEach(h=>{
  if(hide){const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),L=[];while(w.nextNode())L.push(w.currentNode);L.forEach(n=>{n.nodeValue=n.nodeValue.replace(/-?₦[\d,]+(\.\d+)?/g,'₦ ••••')})}
  const b=document.createElement('button');b.className='heye';b.setAttribute('data-act','hide');b.setAttribute('aria-label',hide?'Show amounts':'Hide amounts');b.innerHTML=hide?eyeOff:eyeOn;h.appendChild(b)})}
function sheetView(){
 if(S.sheet=='cust')return custSheet();
 if(S.sheet=='guide')return guideSheet();
 if(S.sheet=='notif')return notifSheet();
 if(S.sheet=='doc'&&S.doc)return docSheet();
 if(S.sheet=='editsale'){const s=S.sales.find(z=>z.id==S.remId);if(!s)return '';const m=S.d.sem||s.method;return `<div class="panel"><h1>Edit sale</h1><label>What was sold</label><input data-d="sei" value="${esc(S.d.sei)}"><label>Amount (₦)</label><input data-d="sea" type="number" inputmode="numeric" value="${esc(S.d.sea)}"><label>Paid by</label><div class="chips">`+['Cash','Transfer'].map(x=>`<button class="chip" data-act="semethod" data-v="${x}" aria-pressed="${m==x}">${x}</button>`).join('')+`</div><label>Date</label><input data-d="sed" type="date" max="${off(0)}" value="${esc(S.d.sed)}"><button class="full" data-act="savesale">Save changes</button><button class="full alt" data-act="close">Cancel</button></div>`}
 if(S.sheet=='rcpt'&&S.rc)return `<div class="panel"><h1>Send receipt</h1><div class="wa" style="white-space:pre-line">${esc(S.rc.text)}</div><label>Customer WhatsApp number (optional)</label><input data-d="rcp" type="tel" placeholder="0803 123 4567" value="${esc(S.d.rcp)}"><button class="full" style="background:var(--wa);color:#06260f" data-act="sendrc">Send on WhatsApp</button><button class="full alt" data-act="close">Done</button></div>`;
 if(S.sheet=='pinset')return `<div class="panel"><h1>${getPin()?'Change your PIN':'Set a PIN lock'}</h1><div class="shop">The app will ask for this PIN when you open it.</div><label>New 4-digit PIN</label><input data-d="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(S.d.pin)}"><label>Repeat the PIN</label><input data-d="pin2" type="password" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(S.d.pin2)}"><button class="full" data-act="pinsave">Save PIN</button><button class="full alt" data-act="close">Cancel</button></div>`;
 if(S.sheet=='profile')return profSheet();
 if(S.sheet=='rall')return rallSheet();
 if(S.sheet=='pay'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Record payment</h1><div class="shop">${esc(x.customer_name)} still owes ${naira(balOf(x))}</div><label>Amount paid (₦)</label><input data-d="pa" type="number" inputmode="numeric" value="${esc(S.d.pa)}"><button class="full" data-act="savepay">Save payment</button><button class="full alt" data-act="close">Cancel</button></div>`}
 if(S.sheet=='edit'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Edit debt</h1><label>Customer name</label><input data-d="en" value="${esc(S.d.en)}"><label>WhatsApp number</label><input data-d="ep" type="tel" value="${esc(S.d.ep)}"><label>Total amount (₦)</label><input data-d="ea" type="number" inputmode="numeric" value="${esc(S.d.ea)}"><label>Due date</label><input data-d="ed" type="date" value="${esc(S.d.ed)}"><button class="full" data-act="saveedit">Save changes</button><button class="full alt" data-act="close">Cancel</button><button class="full" style="background:var(--redbg);color:var(--red)" data-act="deldebt">Delete this debt</button></div>`}
 if(S.sheet=='debt')return `<div class="panel"><h1>Add debt</h1><label>Customer name</label><input data-d="dn" value="${esc(S.d.dn)}"><label>Customer WhatsApp number</label><input data-d="dp" type="tel" placeholder="0803 123 4567" value="${esc(S.d.dp)}"><label>Amount owed (₦)</label><input data-d="da" type="number" inputmode="numeric" value="${esc(S.d.da)}"><label>Due date</label><input data-d="dd" type="date" value="${esc(S.d.dd)}"><button class="full" data-act="savedebt">Save debt</button><button class="full alt" data-act="close">Cancel</button></div>`;
 if(S.sheet=='remind'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Send reminder</h1><div class="wa">Hello ${esc(x.customer_name.split(' (')[0])}, this is a reminder of ${naira(balOf(x))} owed to ${esc(S.shop||'us')}. Thank you.</div><label>Customer WhatsApp number</label><input data-d="rph" type="tel" placeholder="0803 123 4567" value="${esc(S.d.rph)}"><button class="full" style="background:var(--wa);color:#06260f" data-act="send">Send on WhatsApp</button><button class="full alt" data-act="close">Close</button></div>`}
 return ''}
function recoveryView(){return `<div class="auth"><div class="brand">TradeLog NG</div><h1>Set a new password</h1>`+pwField('np','New password (6 or more characters)','new-password')+pwField('np2','Verify new password','new-password')+`<button class="full" data-act="newpass">Save new password</button></div>`}
function render(){
 if(S.recovery){$('app').innerHTML=recoveryView();$('nav').innerHTML='';$('sheet').className='sheet';return}
 if(S.user&&!S.lockChecked){S.lockChecked=true;const pn=getPin();if(pn&&pn.u==S.user.id)S.locked=true}
 if(S.user&&S.locked){$('app').innerHTML=lockView();$('nav').innerHTML='';$('sheet').className='sheet';return}
 if(!S.user){$('app').innerHTML=authView();$('nav').innerHTML='';$('sheet').className='sheet';return}
 $('app').innerHTML=banner()+[homeView,debtsView,salesView,tonightView,reportsView,expensesView][S.tab]();heroEye();
 $('nav').innerHTML='<button class="gfab" data-act="guide" aria-label="Help guide">?</button><div>'+[['Home',0],['Debts',1],['Sales',2],['Expenses',5],['Tonight',3],['Reports',4]].map(t=>`<button data-act="tab" data-v="${t[1]}" aria-selected="${S.tab==t[1]}">${navIcon(t[1])}<span>${t[0]}</span>${t[1]==1&&badgeN()?`<span class="nb">${badgeN()}</span>`:''}</button>`).join('')+'</div>';
 $('sheet').innerHTML=sheetView();$('sheet').className='sheet'+(S.sheet?' on':'');
}
async function reload(){await sync()}
async function act(a,v){
 if(a=='mode'){S.mode=v||(S.mode=='in'?'up':'in');S.show=false;render()}
 else if(a=='eye'){S.show=!S.show;document.querySelectorAll('.pw input').forEach(i=>{i.type=S.show?'text':'password'});document.querySelectorAll('.eye').forEach(b=>{b.innerHTML=S.show?eyeOff:eyeOn})}
 else if(a=='signin'){const r=ok(await sb.auth.signInWithPassword({email:(S.d.email||'').trim(),password:S.d.password||''}));S.user=r.user;switchUser(r.user.id);S.d={method:'Cash'};await reload()}
 else if(a=='signup'){const e=(S.d.email||'').trim(),p=S.d.password||'';if(!S.d.agree){toast('Please tick the box to agree to the Terms and Privacy Policy');return}
  if(!(S.d.owner||'').trim()||!(S.d.shop||'').trim()){toast('Add your full name and shop name');return}
  if(!e||p.length<6){toast('Add your email and a password of 6 or more characters');return}
  if(p!==(S.d.password2||'')){toast('The two passwords do not match');return}
  const r=ok(await sb.auth.signUp({email:e,password:p}));
  if(!r.session){toast('Check your email to confirm, then sign in');S.mode='in';render();return}
  S.user=r.user;switchUser(r.user.id);ok(await sb.from('shops').upsert({user_id:S.user.id,name:(S.d.shop||'').trim()||'My shop',owner_name:(S.d.owner||'').trim()||null}));S.d={method:'Cash'};await reload()}
 else if(a=='sync'){sync();toast('Trying to send...')}
 else if(a=='out'){if(S.q.length&&!confirm(S.q.length+' entries have not been sent yet. Signing out will lose them. Sign out anyway?'))return;try{await sb.auth.signOut({scope:'local'})}catch(e){}S.user=null;S.debts=[];S.pays=[];S.sales=[];S.q=[];S.map={};S.uid=null;S.ex=[];S.lockChecked=false;S.locked=false;try{localStorage.removeItem('tl_cache');localStorage.removeItem('tl_pin')}catch(e){}S.d={method:'Cash'};S.mode='start';S.show=false;render()}
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
  const ptmp=tmpId();S.pays.push({id:ptmp,debt_id:x.id,amount:am,created_at:new Date().toISOString()});enqueue({k:'pay',cid:newCid(),tmp:ptmp,debt:x.id,row:{amount:am}});
  if(am>=b){x.paid=true;x.paid_at=new Date().toISOString();enqueue({k:'upd',debt:x.id,row:{paid:true,paid_at:x.paid_at}})}
  S.rc={text:payReceipt(x,am,Math.max(0,b-am))};S.d.rcp=x.phone||'';S.sheet='rcpt';render();toast(am>=b?'Fully paid':'Payment saved');sync()}
 else if(a=='edit'){const x=S.debts.find(z=>z.id==v);S.remId=v;S.d.en=x.customer_name;S.d.ep=x.phone||'';S.d.ea=String(x.amount);S.d.ed=x.due_date;S.sheet='edit';render()}
 else if(a=='saveedit'){const x=S.debts.find(z=>z.id==S.remId),n=(S.d.en||'').trim(),am=Number(S.d.ea);if(!n||!(am>0)||!S.d.ed){toast('Add name, amount and due date');return}
  if(am<paidOf(x)){toast('Amount cannot be less than the '+naira(paidOf(x))+' already paid');return}
  const row={customer_name:n,phone:(S.d.ep||'').trim()||null,amount:am,due_date:S.d.ed,paid:am<=paidOf(x)};Object.assign(x,row);enqueue({k:'upd',debt:x.id,row});S.sheet=null;render();toast('Changes saved');sync()}
 else if(a=='deldebt'){if(!confirm('Delete this debt and its payments?'))return;const id=S.remId;S.debts=S.debts.filter(z=>z.id!=id);S.pays=S.pays.filter(p=>p.debt_id!=id);if(isTmp(id)&&!S.map[id])S.q=S.q.filter(i=>i.tmp!=id&&i.debt!=id);else S.q.push({k:'del',debt:id});persist();S.sheet=null;render();toast('Debt deleted');sync()}
 else if(a=='forgot'){const e=(S.d.email||'').trim();if(!e){toast('Type your email above first');return}ok(await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname}));toast('Reset link sent. Check your email.')}
 else if(a=='newpass'){const p=S.d.np||'';if(p.length<6){toast('Use 6 or more characters');return}if(p!==(S.d.np2||'')){toast('The two passwords do not match');return}ok(await sb.auth.updateUser({password:p}));S.recovery=false;S.d={method:'Cash'};const g=await sb.auth.getSession();S.user=g.data.session?g.data.session.user:null;await reload();toast('Password changed')}
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
 else if(a=='rmphoto'){S.photo='';enqueue({k:'prof',row:{photo:null}});S.sheet=null;render();toast('Photo removed');sync()}
 else if(a=='xcat'){S.d.xc=v;render()}
 else if(a=='addexp'){const it=(S.d.xi||'').trim(),am=Number(S.d.xa),c=S.d.xc||'Restock',day=dayOf();
  if(!it||!(am>0)){toast('Add what you spent on and the amount');return}
  const tmp=tmpId(),row={item:it,category:c,amount:am,expense_date:day};
  S.ex.push({id:tmp,...row,created_at:new Date().toISOString()});enqueue({k:'exp',cid:newCid(),tmp,row});
  S.d.xi='';S.d.xa='';render();toast('Expense saved');sync()}
 else if(a=='delexp'){S.ex=S.ex.filter(e=>e.id!=v);if(isTmp(v)&&!S.map[v])S.q=S.q.filter(i=>i.tmp!=v);else S.q.push({k:'delexp',id:v});persist();render();toast('Expense removed');sync()}
 else if(a=='editsale'){const s=S.sales.find(z=>z.id==v);if(!s)return;S.remId=v;S.d.sei=s.item;S.d.sea=String(s.amount);S.d.sed=s.sale_date;S.d.sem=s.method;S.sheet='editsale';render()}
 else if(a=='semethod'){S.d.sem=v;render()}
 else if(a=='savesale'){const s=S.sales.find(z=>z.id==S.remId);if(!s){S.sheet=null;render();return}
  const it=(S.d.sei||'').trim(),am=Number(S.d.sea),dt=S.d.sed,m=S.d.sem||s.method;
  if(!it||!(am>0)||!dt){toast('Add the item, amount and date');return}
  if(dt>off(0)){toast('The date cannot be in the future');return}
  const row={item:it,amount:am,method:m,sale_date:dt};Object.assign(s,row);
  const qi=S.q.find(i=>i.k=='sale'&&i.tmp==s.id);if(qi){Object.assign(qi.row,row);persist()}else enqueue({k:'updsale',id:s.id,row});
  S.sheet=null;render();toast('Sale updated');sync()}
 else if(a=='rcpt'){const s=S.sales.find(z=>z.id==v);if(!s)return;S.rc={text:saleReceipt(s)};S.d.rcp='';S.sheet='rcpt';render()}
 else if(a=='sendrc'){const n=waNum(S.d.rcp);window.open('https://wa.me/'+(n.length==13?n:'')+'?text='+encodeURIComponent((S.rc&&S.rc.text)||''),'_blank')}
 else if(a=='pinset'){S.d.pin='';S.d.pin2='';S.sheet='pinset';render()}
 else if(a=='pinsave'){const p=S.d.pin||'';if(!/^\d{4}$/.test(p)){toast('Use exactly 4 digits');return}if(p!==(S.d.pin2||'')){toast('The two PINs do not match');return}
  const salt=newCid(),h=await pinHash(p,salt);localStorage.setItem('tl_pin',JSON.stringify({s:salt,h:h,u:(S.user&&S.user.id)||S.uid}));S.d.pin='';S.d.pin2='';S.sheet=null;render();toast('PIN lock is on')}
 else if(a=='pinoff'){if(!confirm('Turn off the PIN lock?'))return;try{localStorage.removeItem('tl_pin')}catch(e){}render();toast('PIN lock is off')}
 else if(a=='unlock'){const pn=getPin();if(!pn){S.locked=false;render();return}
  if(Date.now()<(S.lockUntil||0)){toast('Too many wrong tries. Wait a little.');return}
  const h=await pinHash(S.d.pin||'',pn.s);
  if(h===pn.h){S.locked=false;S.d.pin='';S.tries=0;render()}
  else{S.tries=(S.tries||0)+1;S.d.pin='';if(S.tries>=5){S.lockUntil=Date.now()+30000;S.tries=0;toast('Too many wrong tries. Wait 30 seconds.')}else toast('Wrong PIN');render()}}
 else if(a=='lockout'){if(S.q.length&&!confirm(S.q.length+' entries have not been sent yet. Signing out will lose them. Sign out anyway?'))return;
  try{await sb.auth.signOut({scope:'local'})}catch(e){}
  S.locked=false;S.lockChecked=false;S.user=null;S.debts=[];S.pays=[];S.sales=[];S.ex=[];S.q=[];S.map={};S.uid=null;
  try{localStorage.removeItem('tl_cache');localStorage.removeItem('tl_pin')}catch(e){}
  S.d={method:'Cash'};S.mode='start';S.show=false;render()}
 else if(a=='doc'){S.doc={type:v,per:v=='debts'?'all':'month'};S.sheet='doc';render()}
 else if(a=='dper'){S.doc.per=v;render()}
 else if(a=='print'){window.print()}
 else if(a=='docsv'){const d=docData(S.doc.type,S.doc.per),top=[[S.shop||'My shop'],[[S.owner,S.phone].filter(Boolean).join(' · ')],[d.title],[d.plabel],['Generated: '+d.gen],[]];downloadCsv('tradelog-'+S.doc.type+'-'+off(0)+'.csv',top.concat([d.head]).concat(d.rows).concat([[]]).concat(d.sum.map(x=>[x[0],x[1]])));toast('Spreadsheet saved. Check your Downloads.')}
 else if(a=='delpay'){const p=S.pays.find(z=>z.id==v);if(!p)return;const x=debtOf(p.debt_id);
  if(!confirm('Remove this payment of '+naira(p.amount)+(x?' from '+x.customer_name:'')+'?'+(x?' Their balance will go back up.':'')))return;
  S.pays=S.pays.filter(z=>z.id!=v);
  if(isTmp(v)&&!S.map[v])S.q=S.q.filter(i=>i.tmp!=v);else S.q.push({k:'delpay',id:v});
  if(x&&x.paid&&balOf(x)>0){x.paid=false;x.paid_at=null;enqueue({k:'upd',debt:x.id,row:{paid:false,paid_at:null}})}
  persist();render();toast('Payment removed');sync()}
 else if(a=='wipe'){
  if(!navigator.onLine){toast('Connect to the network first');return}
  const t=prompt('This erases ALL your sales, debts, payments and expenses for good. Your login and profile stay.\n\nType DELETE to continue.');
  if(t===null)return;if(String(t).trim().toUpperCase()!=='DELETE'){toast('Nothing was erased');return}
  S.q=[];persist();
  ok(await sb.from('payments').delete().gte('id',0));
  ok(await sb.from('sales').delete().gte('id',0));
  ok(await sb.from('expenses').delete().gte('id',0));
  ok(await sb.from('debts').delete().gte('id',0));
  S.debts=[];S.pays=[];S.sales=[];S.ex=[];S.map={};S.sent={};S.day=null;S.offline=false;persist();S.tab=0;render();toast('All records cleared')}
 else if(a=='bell'){S.sheet='notif';render()}
 else if(a=='nremind'){const x=debtOf(v);if(!x)return;markSeen(x);S.remId=v;S.d.rph=x.phone||'';S.sheet='remind';render()}
 else if(a=='seenall'){const sn=seenLoad();notifs().urgent.forEach(x=>{sn.k[nkey(x)]=1});seenSave(sn);render();toast('Marked as seen')}
 else if(a=='guide'){S.gq='';S.sheet='guide';render()}
 else if(a=='hide'){try{localStorage.setItem('tl_hide',heroHid()?'0':'1')}catch(e){}render()}
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
 if(k){S.d[k]=t.type=='checkbox'?t.checked:t.value;if(k=='pn'||k=='amount'){const b=$('bal');if(b)b.textContent=balText()}}
 else if(sk){S[sk]=t.value;const el=$(sk=='fd'?'dlist':sk=='gq'?'glist':'slist');if(el)el.innerHTML=sk=='fd'?debtsAll():sk=='gq'?guideList():salesList()}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.day&&t.value){S.day=t.value==off(0)?null:t.value;render()}});
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset.photo||!t.files||!t.files[0])return;const f=t.files[0];
 resizeImg(f,d=>{if(!d){toast('Could not use that picture. Try another.');return}S.photo=d;enqueue({k:'prof',row:{photo:d}});render();toast('Picture saved');sync()})});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b||S.busy)return;S.busy=true;
 try{await act(b.dataset.act,b.dataset.v)}catch(err){console.error(err);toast(/fetch|network/i.test(err.message||'')?'No network. Try again.':(err.message||'Something went wrong').slice(0,60))}
 S.busy=false});
sb.auth.onAuthStateChange(ev=>{if(ev=='PASSWORD_RECOVERY'){S.recovery=true;render()}});
if(/type=recovery/.test(location.hash))S.recovery=true;
document.addEventListener('visibilitychange',()=>{if(document.hidden){S.hiddenAt=Date.now()}else if(S.user&&getPin()&&S.hiddenAt&&Date.now()-S.hiddenAt>60000){S.locked=true;S.d.pin='';render()}});
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
