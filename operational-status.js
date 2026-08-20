(function(root,factory){const api=factory(root.BriefingSchedule||(typeof require==='function'?require('./schedule.js'):null),root.AirspaceMatching||(typeof require==='function'?require('./matching.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;else root.OperationalStatus=api})(typeof self!=='undefined'?self:this,function(S,M){
  const CONTROLLED=new Set([4,5,6,7,13,14,36]);
  const RANK={'PERMANENT PROHIBITED':0,'ACTIVE BY NOTAM':1,'SCHEDULED ACTIVE':2,'NOTAM MATCH / activation uncertain':3,'POSSIBLE MATCH':4,'BY NOTAM — NO ACTIVATION FOUND':5,'BASELINE / status unknown':6};
  function permanentProhibited(a){return Number(a&&a.type_code)===3&&a.permanent_h24===true&&!a.by_notam&&!a.on_demand&&!a.on_request}
  function statusFor(airspace,matches,window){
    const robust=(matches||[]).filter(m=>M.ROBUST.has(m.confidence)),active=robust.filter(m=>M.activationSemantics(m.notam)&&m.schedule.overlap&&m.schedule.certainty==='EXACT');
    if(permanentProhibited(airspace))return'PERMANENT PROHIBITED';
    if(active.length)return'ACTIVE BY NOTAM';
    const scheduled=S.airspaceSchedule(airspace,window);if(scheduled.overlap&&scheduled.certainty==='EXACT'&&!airspace.by_notam&&!airspace.on_demand&&!airspace.on_request)return'SCHEDULED ACTIVE';
    if(robust.length)return'NOTAM MATCH / activation uncertain';
    if((matches||[]).some(m=>m.confidence==='POSSIBLE'))return'POSSIBLE MATCH';
    if(airspace&&airspace.by_notam)return'BY NOTAM — NO ACTIVATION FOUND';
    return'BASELINE / status unknown';
  }
  function groupFor(item){
    if(item.kind==='notam')return item.relevance==='HIGH_RELEVANCE'?'HIGH_NOTAMS':item.relevance==='RELEVANT'?'OTHER_RELEVANT_NOTAMS':'OTHER_NOTAMS';
    if(item.status==='PERMANENT PROHIBITED')return'PERMANENT_PROHIBITED';if(item.status==='ACTIVE BY NOTAM')return'ACTIVE_BY_NOTAM';if(item.status==='SCHEDULED ACTIVE')return'SCHEDULED_ACTIVE';if(item.status==='NOTAM MATCH / activation uncertain')return'NOTAM_UNCERTAIN';if(item.status==='POSSIBLE MATCH')return'POSSIBLE_MATCH';if(item.status==='BY NOTAM — NO ACTIVATION FOUND')return'BY_NOTAM_NO_ACTIVATION';return CONTROLLED.has(Number(item.airspace.type_code))?'CONTROLLED_BASELINE':'FLEXIBLE_BASELINE';
  }
  return{CONTROLLED,RANK,groupFor,permanentProhibited,statusFor};
});
