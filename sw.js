const CACHE='soaring-notam-v2-8-1-gate1';
const VERSION='2.8.1';
const CORE=['./','index.html',`app.js?v=${VERSION}`,`notam-relevance.js?v=${VERSION}`,`relevance.js?v=${VERSION}`,`airspace.js?v=${VERSION}`,`schedule.js?v=${VERSION}`,`matching.js?v=${VERSION}`,`operational-status.js?v=${VERSION}`,`activation-sources.js?v=${VERSION}`,`dynamic-airspace.js?v=${VERSION}`,`briefing.js?v=${VERSION}`,`briefing-ui.js?v=${VERSION}`,`openair-export.js?v=${VERSION}`,`notam-map.js?v=${VERSION}`,`task-workflow.js?v=${VERSION}`,`print-state.js?v=${VERSION}`,'briefing.html',`briefing-print.js?v=${VERSION}`,'manifest.webmanifest'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put('./',copy));
      return response;
    }).catch(()=>caches.match(request).then(r=>r||caches.match('./'))));
    return;
  }
  if(url.pathname.endsWith('/data/notams-live.json')||url.pathname.endsWith('/data/airspace-baseline.json')||url.pathname.endsWith('/data/dutch-dynamic-airspace.json')||url.pathname.endsWith('/data/faa-refresh-status.json')){
    event.respondWith(fetch(request,{cache:'no-store'}));
    return;
  }
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(request,copy));
    return response;
  }).catch(()=>caches.match(request)));
});
