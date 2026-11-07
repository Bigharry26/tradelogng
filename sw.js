const C='tl-v1794038009',F=['./','index.html','style.css','app.js','supabase.js','manifest.json','icon-192.png','icon-512.png','privacy.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!='GET'||u.origin!=location.origin)return;
 const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r});
 const tm=new Promise((_,rej)=>setTimeout(rej,4000));
 e.respondWith(Promise.race([net,tm]).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(m=>m||net)))});
