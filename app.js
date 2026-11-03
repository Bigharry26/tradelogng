const sb=supabase.createClient('https://eroiisvhptcizpxnmeup.supabase.co','sb_publishable_nz83rTMAUIKiN2gx3h1Rww_LS_aPxG1');
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
const S={user:null,shop:'',debts:[],sales:[],tab:1,sheet:null,mode:'in',busy:false,d:{method:'Cash'},rp:'day',rsel:0,remId:null};
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2200)}
function ok(r){if(r.error)throw r.error;return r.data}
async function fetchAll(build){let out=[],from=0;for(;;){const data=ok(await build().range(from,from+999));out=out.concat(data);if(data.length<1000)break;from+=1000}return out}
async function loadAll(){
 const sh=await sb.from('shops').select('name').maybeSingle();
 S.shop=sh.data?sh.data.name:'';
 S.debts=await fetchAll(()=>sb.from('debts').select('*').order('id'));
 S.sales=await fetchAll(()=>sb.from('sales').select('*').gte('sale_date',off(-200)).order('id'));
}
const sumS=(m,date)=>S.sales.filter(s=>s.sale_date==(date||off(0))&&(!m||s.method==m)).reduce((t,s)=>t+Number(s.amount),0);
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
 (up?`<label>Shop name</label><input data-d="shop" placeholder="Mama Chidi Provisions" value="${esc(S.d.shop)}">`:'')+
 `<label>Email</label><input data-d="email" type="email" autocomplete="email" value="${esc(S.d.email)}">
 <label>Password (6 or more characters)</label><input data-d="password" type="password" autocomplete="${up?'new-password':'current-password'}" value="${esc(S.d.password)}">
 <button class="full" data-act="${up?'signup':'signin'}">${up?'Create account':'Sign in'}</button>
 <button class="full alt" data-act="mode">${up?'I already have an account':'Create a new account'}</button></div>`}
function debtsView(){const list=openD(),total=list.reduce((s,x)=>s+Number(x.amount),0),late=list.filter(x=>dayDiff(x.due_date)<0).reduce((s,x)=>s+Number(x.amount),0);
 let h=`<div class="top"><div><div class="brand">TradeLog NG</div><h1>${esc(S.shop||'My shop')}</h1></div><button class="del" data-act="out">Sign out</button></div>`;
 h+=`<div class="hero"><small>Total owed to you</small><div class="big">${naira(total)}</div><div class="row"><span>${list.length} customers</span><span>${naira(late)} overdue</span></div></div>`;
 if(!list.length)h+='<div class="empty">Nobody owes you. Tap “Add debt” when someone takes goods on credit.</div>';
 list.forEach(x=>{const t=tagFor(x);h+=`<div class="item"><div class="l1"><span class="name">${esc(x.customer_name)}</span><span class="amt">${naira(x.amount)}</span></div><span class="tag ${t[0]}">${t[1]}</span><div class="acts"><button class="b1" data-act="remind" data-v="${x.id}">Remind</button><button class="b2" data-act="paid" data-v="${x.id}">Mark paid</button></div></div>`});
 return h+'<button class="fab" data-act="adddebt">+ Add debt</button>'}
function salesView(){const ts=S.sales.filter(s=>s.sale_date==off(0)).reverse(),m=S.d.method||'Cash';
 let h=`<div class="top"><div><h1>Today’s sales</h1><div class="shop">Add each sale as it happens</div></div></div>`;
 h+=`<div class="hero"><small>Total sales today</small><div class="big">${naira(sumS())}</div><div class="row"><span>Cash ${naira(sumS('Cash'))}</span><span>Transfer ${naira(sumS('Transfer'))}</span><span>Credit ${naira(sumS('Credit'))}</span></div></div>`;
 h+=`<div class="item"><label style="margin-top:0">What was sold</label><input data-d="item" placeholder="e.g. Garri 2 paints" value="${esc(S.d.item)}"><label>Amount (₦)</label><input data-d="amount" type="number" inputmode="numeric" value="${esc(S.d.amount)}"><label>Paid by</label><div class="chips">`+['Cash','Transfer','Credit'].map(x=>`<button class="chip" data-act="method" data-v="${x}" aria-pressed="${m==x}">${x}</button>`).join('')+'</div>';
 if(m=='Credit')h+=`<label>Customer who owes</label><input data-d="cust" placeholder="e.g. Mrs. Bisi" value="${esc(S.d.cust)}"><label>Their WhatsApp number (optional)</label><input data-d="sph" type="tel" placeholder="0803 123 4567" value="${esc(S.d.sph)}">`;
 h+='<button class="full" data-act="addsale">Add sale</button></div>';
 if(!ts.length)h+='<div class="empty">No sales yet today. Add your first one above.</div>';
 ts.forEach(s=>{h+=`<div class="item"><div class="l1"><span class="name">${esc(s.item)}</span><span class="amt">${naira(s.amount)}</span></div><div class="l1"><span class="m">${s.method}${s.method=='Credit'?' (added to debts)':''}</span><button class="del" data-act="delsale" data-v="${s.id}">Remove</button></div></div>`});
 return h}
function tonightView(){const d0=todayD(),col=S.debts.filter(x=>x.paid&&x.paid_at&&new Date(x.paid_at)>=d0).reduce((s,x)=>s+Number(x.amount),0),owed=openD().reduce((s,x)=>s+Number(x.amount),0);
 return `<div class="top"><div><h1>Tonight’s summary</h1><div class="shop">Your numbers for today</div></div></div><div class="sum"><p><b>Good evening, ${esc(S.shop||'trader')}.</b></p>
 <div class="r"><span>Sales today</span><b>${naira(sumS())}</b></div><div class="r"><span>Paid in cash</span><b>${naira(sumS('Cash'))}</b></div><div class="r"><span>Paid by transfer</span><b>${naira(sumS('Transfer'))}</b></div><div class="r"><span>New debts (credit sales)</span><b>${naira(sumS('Credit'))}</b></div><div class="r"><span>Debts collected</span><b>${naira(col)}</b></div><div class="r"><span>Total owed to you</span><b>${naira(owed)}</b></div></div>`}
function reportsView(){const m={};S.sales.forEach(s=>{(m[s.sale_date]=m[s.sale_date]||{date:s.sale_date,Cash:0,Transfer:0,Credit:0})[s.method]+=Number(s.amount)});
 const days=Object.values(m),tot=x=>x.Cash+x.Transfer+x.Credit,t0=off(0);
 const dd=bucketsFor(S.rp).map(b=>{const r=days.filter(x=>x.date>=b.from&&x.date<=b.to&&x.date<=t0);return{b,r,t:r.reduce((s,x)=>s+tot(x),0)}});
 const mx=Math.max(...dd.map(x=>x.t))||1,cur=dd[Math.min(S.rsel,dd.length-1)],sm=k=>cur.r.reduce((s,x)=>s+x[k],0),best=cur.r.reduce((a,x)=>!a||tot(x)>tot(a)?x:a,null);
 let h='<div class="top"><div><h1>Sales reports</h1><div class="shop">Daily, weekly and monthly totals</div></div></div><div class="chips">'+[['day','Daily'],['week','Weekly'],['month','Monthly']].map(p=>`<button class="chip" data-act="rp" data-v="${p[0]}" aria-pressed="${S.rp==p[0]}">${p[1]}</button>`).join('')+'</div>';
 h+='<div class="bars">'+dd.slice().reverse().map(x=>{const i=dd.indexOf(x);return `<button class="bar1" data-act="rb" data-v="${i}" aria-pressed="${i==S.rsel}"><span>${fmtK(x.t)}</span><i style="height:${Math.max(4,Math.round(x.t/mx*100))}px"></i><span>${x.b.label}</span></button>`}).join('')+'</div>';
 h+=`<div class="sum"><p><b>${cur.b.label}</b>${S.rp!='day'?` <span class="m">${fmtD(cur.b.from)} to ${fmtD(cur.b.to)}</span>`:''}</p><div class="r"><span>Total sales</span><b>${naira(cur.t)}</b></div><div class="r"><span>Cash</span><b>${naira(sm('Cash'))}</b></div><div class="r"><span>Transfer</span><b>${naira(sm('Transfer'))}</b></div><div class="r"><span>Credit (new debts)</span><b>${naira(sm('Credit'))}</b></div>`+(cur.r.length>1?`<div class="r"><span>Average per selling day</span><b>${naira(Math.round(cur.t/cur.r.length))}</b></div><div class="r"><span>Best day</span><b>${fmtD(best.date)}, ${naira(tot(best))}</b></div>`:'')+'</div>';
 return h+'<p class="m">Tap any bar to see that day, week or month.</p>'}
function sheetView(){
 if(S.sheet=='debt')return `<div class="panel"><h1>Add debt</h1><label>Customer name</label><input data-d="dn" value="${esc(S.d.dn)}"><label>Customer WhatsApp number</label><input data-d="dp" type="tel" placeholder="0803 123 4567" value="${esc(S.d.dp)}"><label>Amount owed (₦)</label><input data-d="da" type="number" inputmode="numeric" value="${esc(S.d.da)}"><label>Due date</label><input data-d="dd" type="date" value="${esc(S.d.dd)}"><button class="full" data-act="savedebt">Save debt</button><button class="full alt" data-act="close">Cancel</button></div>`;
 if(S.sheet=='remind'){const x=S.debts.find(z=>z.id==S.remId);if(!x)return '';return `<div class="panel"><h1>Send reminder</h1><div class="wa">Hello ${esc(x.customer_name.split(' (')[0])}, this is a reminder of ${naira(x.amount)} owed to ${esc(S.shop||'us')}. Thank you.</div><label>Customer WhatsApp number</label><input data-d="rph" type="tel" placeholder="0803 123 4567" value="${esc(S.d.rph)}"><button class="full" style="background:var(--wa);color:#06260f" data-act="send">Send on WhatsApp</button><button class="full alt" data-act="close">Close</button></div>`}
 return ''}
function render(){
 if(!S.user){$('app').innerHTML=authView();$('nav').innerHTML='';$('sheet').className='sheet';return}
 $('app').innerHTML=[0,debtsView,salesView,tonightView,reportsView][S.tab]();
 $('nav').innerHTML='<div>'+[['Debts',1],['Sales',2],['Tonight',3],['Reports',4]].map(t=>`<button data-act="tab" data-v="${t[1]}" aria-selected="${S.tab==t[1]}">${t[0]}</button>`).join('')+'</div>';
 $('sheet').innerHTML=sheetView();$('sheet').className='sheet'+(S.sheet?' on':'');
}
async function reload(){await loadAll();render()}
async function act(a,v){
 if(a=='mode'){S.mode=S.mode=='in'?'up':'in';render()}
 else if(a=='signin'){const r=ok(await sb.auth.signInWithPassword({email:(S.d.email||'').trim(),password:S.d.password||''}));S.user=r.user;S.d={method:'Cash'};await reload()}
 else if(a=='signup'){const e=(S.d.email||'').trim(),p=S.d.password||'';if(!e||p.length<6){toast('Add your email and a password of 6 or more characters');return}
  const r=ok(await sb.auth.signUp({email:e,password:p}));
  if(!r.session){toast('Check your email to confirm, then sign in');S.mode='in';render();return}
  S.user=r.user;ok(await sb.from('shops').upsert({user_id:S.user.id,name:(S.d.shop||'').trim()||'My shop'}));S.d={method:'Cash'};await reload()}
 else if(a=='out'){await sb.auth.signOut();S.user=null;S.debts=[];S.sales=[];S.d={method:'Cash'};render()}
 else if(a=='tab'){S.tab=Number(v);S.rsel=0;render()}
 else if(a=='rp'){S.rp=v;S.rsel=0;render()}
 else if(a=='rb'){S.rsel=Number(v);render()}
 else if(a=='method'){S.d.method=v;render()}
 else if(a=='adddebt'){S.d.dn='';S.d.dp='';S.d.da='';S.d.dd=off(7);S.sheet='debt';render()}
 else if(a=='close'){S.sheet=null;render()}
 else if(a=='savedebt'){const n=(S.d.dn||'').trim(),am=Number(S.d.da);if(!n||!(am>0)||!S.d.dd){toast('Add name, amount and due date');return}
  ok(await sb.from('debts').insert({customer_name:n,phone:(S.d.dp||'').trim()||null,amount:am,due_date:S.d.dd}));S.sheet=null;await reload();toast('Debt saved')}
 else if(a=='paid'){ok(await sb.from('debts').update({paid:true,paid_at:new Date().toISOString()}).eq('id',v));await reload();toast('Marked as paid')}
 else if(a=='remind'){const x=S.debts.find(z=>z.id==v);S.remId=v;S.d.rph=x.phone||'';S.sheet='remind';render()}
 else if(a=='send'){const n=waNum(S.d.rph),x=S.debts.find(z=>z.id==S.remId);if(n.length!=13){toast('Enter a valid Nigerian number');return}
  ok(await sb.from('debts').update({phone:S.d.rph.trim()}).eq('id',x.id));x.phone=S.d.rph.trim();
  const msg='Hello '+x.customer_name.split(' (')[0]+', this is a reminder of '+naira(x.amount)+' owed to '+(S.shop||'us')+'. Thank you.';
  S.sheet=null;render();window.open('https://wa.me/'+n+'?text='+encodeURIComponent(msg),'_blank')}
 else if(a=='addsale'){const it=(S.d.item||'').trim(),am=Number(S.d.amount),m=S.d.method||'Cash';let name=it;
  if(!it||!(am>0)){toast('Add what was sold and the amount');return}
  if(m=='Credit'){const c=(S.d.cust||'').trim();if(!c){toast('Add the customer who owes');return}
   ok(await sb.from('debts').insert({customer_name:c,phone:(S.d.sph||'').trim()||null,amount:am,due_date:off(7)}));name=it+', '+c}
  ok(await sb.from('sales').insert({item:name,amount:am,method:m,sale_date:off(0)}));
  S.d={method:m};await reload();toast('Sale added')}
 else if(a=='delsale'){ok(await sb.from('sales').delete().eq('id',v));await reload();toast('Sale removed')}
}
document.addEventListener('input',e=>{const k=e.target.dataset.d;if(k)S.d[k]=e.target.value});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b||S.busy)return;S.busy=true;
 try{await act(b.dataset.act,b.dataset.v)}catch(err){console.error(err);toast(/fetch|network/i.test(err.message||'')?'No network. Try again.':(err.message||'Something went wrong').slice(0,60))}
 S.busy=false});
(async()=>{try{const {data}=await sb.auth.getSession();if(data.session){S.user=data.session.user;await loadAll()}}catch(e){console.error(e)}render()})();
