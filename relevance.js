(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SoaringRelevance=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const HIGH_SUBJECTS=new Set(['RA','RD','RP','RR','RT','WA','WB','WC','WD','WE','WF','WG','WH','WJ','WL','WM','WP','WS','WT','WU','WV','WZ']);
  const OTHER_SUBJECTS=new Set(['KK','MK','MN','MP','MX','OA','OL']);
  const GENERIC_SUBJECT_PREFIXES=new Set(['A','F','N','P','S']);
  const HIGH_TERMS=/\b(parachut|para\s?jump|skydiv|glid(?:er|ing)|\bUAS\b|drone|unmanned|fir(?:e|ing)|shoot|artillery|weapon|military exercise|intensive military|aerobatic|air\s?display|airshow|balloon|restricted airspace|prohibited airspace|temporary restricted|airspace (?:is )?(?:closed|activated)|temporary obstacle)\b/i;
  const OTHER_TERMS=/\b(taxiway|apron|stand\s+[A-Z0-9]|parking stand|gate\s+[A-Z0-9]|routine construction|administrative|taxi lane)\b/i;
  const RELEVANT_TERMS=/\b(aerodrome|airport|runway|navigation|navaid|VOR|DME|NDB|ILS|communication|frequency|airspace|flight operations?)\b/i;
  const CHANGE_TERMS=/\b(temporar(?:y|ily)|activat(?:e|ed|ion)|deactivat(?:e|ed|ion)|clos(?:e|ed|ure)|suspend(?:ed|sion)|withdrawn|not avbl|not available|unserviceable|hours? changed)\b/i;
  const CHANGE_CONDITIONS=new Set(['CA','CD','LC','LT']);
  const FLEX_AIRSPACE=/\b(?:[A-Z]{0,2}(?:TRA|TSA)\s*\d*[A-Z]?|CBA\s*\d*[A-Z]?|restricted area|danger area|prohibited area)\b/i;
  const CTR_CHANGE=/\bCTR\b[\s\S]*\b(temporar|activat|deactivat|clos|service|not avbl|not available|unserviceable)\w*/i;
  const DIVERSION_CLOSURE=/\b(?:RWY|runway|AD|aerodrome|airport)\b[\s\S]*\bclos(?:e|ed|ure)\b/i;
  const PERMANENT_AIRSPACE=/\b(?:permanent|H24|establish(?:ed|ment))\b[\s\S]*\b(?:airspace|CTR|CTA|UTA|restricted area|danger area|prohibited area)\b/i;
  function qSubject(notam){const code=String(notam.qcode||'').toUpperCase().replace(/^Q/,'');return /^[A-Z]{2}/.test(code)?code.slice(0,2):''}
  function qCondition(notam){const code=String(notam.qcode||'').toUpperCase().replace(/^Q/,'');return /^[A-Z]{4}$/.test(code)?code.slice(2,4):''}
  function textOf(notam){return `${String(notam.category||'').toUpperCase()} ${notam.text||''}`}
  function subjectDisposition(notam){
    const subject=qSubject(notam),text=textOf(notam),changed=CHANGE_CONDITIONS.has(qCondition(notam))||CHANGE_TERMS.test(text),managed=FLEX_AIRSPACE.test(text)&&changed;
    if(subject.startsWith('W'))return 'HIGH_RELEVANCE';
    if(subject.startsWith('R'))return changed?'HIGH_RELEVANCE':'OTHER';
    if(managed)return 'HIGH_RELEVANCE';
    if(CTR_CHANGE.test(text)||DIVERSION_CLOSURE.test(text))return 'RELEVANT';
    if(GENERIC_SUBJECT_PREFIXES.has(subject.slice(0,1))||OTHER_SUBJECTS.has(subject)||subject.startsWith('M')||subject.startsWith('L'))return 'OTHER';
    if(PERMANENT_AIRSPACE.test(text)&&!changed)return 'OTHER';
    return null;
  }
  function classify(notam){
    const disposition=subjectDisposition(notam);
    if(disposition)return disposition;
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
  function verticalOverlap(notam,plannedLowerFt,plannedUpperFt){const lower=Number.isFinite(Number(notam.lower_ft))?Number(notam.lower_ft):0,upper=Number.isFinite(Number(notam.upper_ft))?Number(notam.upper_ft):Infinity;return upper>=plannedLowerFt&&lower<=plannedUpperFt}
  function defaultVisible(notam){return classify(notam)==='HIGH_RELEVANCE'}
  function compare(a,b){const rank={HIGH_RELEVANCE:0,RELEVANT:1,OTHER:2};return rank[a.relevance]-rank[b.relevance]||Number(a.distance_to_task_km)-Number(b.distance_to_task_km)||String(a.id).localeCompare(String(b.id))}
  return {classify,compare,defaultVisible,qCondition,qSubject,subjectDisposition,verticalOverlap};
});
