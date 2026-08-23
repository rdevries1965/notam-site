(function(root,factory){const api=factory(root.NotamRelevance||(typeof require==='function'?require('./notam-relevance.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;else root.SoaringRelevance=api})(typeof globalThis!=='undefined'?globalThis:this,function(N){
  function classify(notam){const result=N.evaluate(notam);notam.relevance_classification=result;return result.primary?'HIGH_RELEVANCE':result.operational?'RELEVANT':'OTHER'}
  function verticalOverlap(notam,plannedLowerFt,plannedUpperFt){const lower=Number.isFinite(Number(notam.lower_ft))?Number(notam.lower_ft):0,upper=Number.isFinite(Number(notam.upper_ft))?Number(notam.upper_ft):Infinity;return upper>=plannedLowerFt&&lower<=plannedUpperFt}
  function defaultVisible(notam){return classify(notam)==='HIGH_RELEVANCE'}
  function compare(a,b){const rank={HIGH_RELEVANCE:0,RELEVANT:1,OTHER:2};return rank[a.relevance]-rank[b.relevance]||Number(a.distance_to_task_km)-Number(b.distance_to_task_km)||String(a.id).localeCompare(String(b.id))}
  return{classify,compare,defaultVisible,details:N.evaluate,qCondition:notam=>N.parse(notam).condition,qSubject:notam=>N.parse(notam).subject,verticalOverlap};
});
