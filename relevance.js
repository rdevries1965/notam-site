(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SoaringRelevance=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const HIGH_SUBJECTS=new Set(['RA','RD','RP','RR','RT','WA','WB','WC','WD','WE','WF','WG','WH','WJ','WL','WM','WP','WS','WT','WU','WV','WZ']);
  const OTHER_SUBJECTS=new Set(['KK','MK','MN','MP','MX','OA','OL']);
  const HIGH_TERMS=/\b(parachut|para\s?jump|skydiv|glid(?:er|ing)|\bUAS\b|drone|unmanned|fir(?:e|ing)|shoot|artillery|weapon|military exercise|intensive military|aerobatic|air\s?display|airshow|balloon|restricted airspace|prohibited airspace|temporary restricted|airspace (?:is )?(?:closed|activated)|temporary obstacle)\b/i;
  const OTHER_TERMS=/\b(taxiway|apron|stand\s+[A-Z0-9]|parking stand|gate\s+[A-Z0-9]|routine construction|administrative|taxi lane)\b/i;
  const RELEVANT_TERMS=/\b(aerodrome|airport|runway|navigation|navaid|VOR|DME|NDB|ILS|communication|frequency|airspace|flight operations?)\b/i;
  function qSubject(notam){const code=String(notam.qcode||'').toUpperCase().replace(/^Q/,'');return /^[A-Z]{2}/.test(code)?code.slice(0,2):''}
  function classify(notam){
    const subject=qSubject(notam);
    if(HIGH_SUBJECTS.has(subject))return 'HIGH_RELEVANCE';
    if(OTHER_SUBJECTS.has(subject))return 'OTHER';
    const category=String(notam.category||'').toUpperCase();
    if(HIGH_SUBJECTS.has(category))return 'HIGH_RELEVANCE';
    if(OTHER_SUBJECTS.has(category))return 'OTHER';
    const text=`${category} ${notam.text||''}`;
    if(HIGH_TERMS.test(text))return 'HIGH_RELEVANCE';
    if(OTHER_TERMS.test(text))return 'OTHER';
    if(RELEVANT_TERMS.test(text))return 'RELEVANT';
    return 'RELEVANT';
  }
  function compare(a,b){const rank={HIGH_RELEVANCE:0,RELEVANT:1,OTHER:2};return rank[a.relevance]-rank[b.relevance]||Number(a.distance_to_task_km)-Number(b.distance_to_task_km)||String(a.id).localeCompare(String(b.id))}
  return {classify,compare,qSubject};
});
