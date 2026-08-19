(function(root,factory){const api=factory(root.AirspaceMatching||(typeof require==='function'?require('./matching.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;else root.TaskBriefing=api})(typeof self!=='undefined'?self:this,function(M){
  const GROUP_ORDER=['HIGH_NOTAMS','MATCHED_AIRSPACE','BASELINE_AIRSPACE','OTHER_RELEVANT_NOTAMS','OTHER_NOTAMS'];
  function stableId(kind,id,index=0){return`${kind}:${String(id||index).replace(/[^A-Za-z0-9_.:-]/g,'_')}`}
  function activeOn(notam,date){return(!notam.valid_from||notam.valid_from.slice(0,10)<=date)&&(!notam.valid_to||notam.valid_to.slice(0,10)>=date)}
  function lifecycle(notams,date){
    const current=(notams||[]).filter(n=>activeOn(n,date)),replacementTargets=new Set(current.map(n=>n.replaces_id).filter(Boolean).map(String));
    return current.filter(n=>{
      const status=String(n.status||'').toUpperCase(),qcode=String(n.qcode||'').toUpperCase().replace(/^Q/,'');
      return status!=='CANCELLED'&&status!=='SUPERSEDED'&&qcode.slice(2,4)!=='CN'&&!n.replaced_by_id&&!replacementTargets.has(String(n.id));
    });
  }
  function build(options){
    const spatialNotams=options.spatialNotams||[],allSpatialAirspaces=options.allSpatialAirspaces||[],visibleAirspaces=options.visibleAirspaces||[];
    const operational=lifecycle(spatialNotams,options.date),matchByAirspace=new Map(),matchByNotam=new Map();
    for(const airspace of allSpatialAirspaces)for(const notam of operational){
      const result=M.match(airspace,notam,options.geometryOverlap(airspace,notam));if(result.confidence==='NONE')continue;
      const association={...result,airspace,notam};
      if(!matchByAirspace.has(airspace.id))matchByAirspace.set(airspace.id,[]);matchByAirspace.get(airspace.id).push(association);
      if(!matchByNotam.has(notam.id))matchByNotam.set(notam.id,[]);matchByNotam.get(notam.id).push(association);
    }
    const notamItems=operational.map((notam,index)=>({kind:'notam',stable_id:stableId('faa',notam.id,index),notam,relevance:options.classify(notam),matches:matchByNotam.get(notam.id)||[]}));
    const airspaceItems=visibleAirspaces.map((airspace,index)=>{const matches=matchByAirspace.get(airspace.id)||[];return{kind:'airspace',stable_id:stableId('airspace',airspace.id,index),airspace,matches,status:M.statusFor(airspace,matches)}});
    const robustAirspace=airspaceItems.filter(item=>item.matches.some(match=>M.ROBUST.has(match.confidence)));
    const groups={
      HIGH_NOTAMS:notamItems.filter(item=>item.relevance==='HIGH_RELEVANCE'),
      MATCHED_AIRSPACE:robustAirspace.sort((a,b)=>statusRank(a.status)-statusRank(b.status)||String(a.airspace.name).localeCompare(String(b.airspace.name))),
      BASELINE_AIRSPACE:airspaceItems.filter(item=>!robustAirspace.includes(item)).sort((a,b)=>String(a.airspace.name).localeCompare(String(b.airspace.name))),
      OTHER_RELEVANT_NOTAMS:notamItems.filter(item=>item.relevance==='RELEVANT'),
      OTHER_NOTAMS:notamItems.filter(item=>item.relevance==='OTHER'),
    };
    return{version:1,generated_at_utc:new Date().toISOString(),criteria:options.criteria,groups,all:{notams:notamItems,airspaces:airspaceItems},counts:Object.fromEntries(GROUP_ORDER.map(key=>[key,groups[key].length]))};
  }
  function statusRank(status){return{'ACTIVE BY NOTAM':0,'NOTAM MATCH':1,'POSSIBLE MATCH':2,'BY NOTAM – NO ACTIVATION FOUND':3,'PERMANENT / H24':4,'BASELINE ONLY':5}[status]??9}
  function printState(model,sources){return{version:model.version,generated_at_utc:model.generated_at_utc,criteria:model.criteria,sources,groups:Object.fromEntries(GROUP_ORDER.filter(key=>key!=='OTHER_NOTAMS').map(key=>[key,model.groups[key].map(printItem)]))}}
  function printItem(item){if(item.kind==='notam')return{kind:'notam',stable_id:item.stable_id,id:item.notam.id,relevance:item.relevance,text:item.notam.text,lower_ft:item.notam.lower_ft,upper_ft:item.notam.upper_ft,valid_from:item.notam.valid_from,valid_to:item.notam.valid_to,qcode:item.notam.qcode,status:item.notam.status,distance_to_task_km:item.notam.distance_to_task_km,matched_airspaces:item.matches.filter(m=>M.ROBUST.has(m.confidence)).map(m=>m.airspace.name)};return{kind:'airspace',stable_id:item.stable_id,id:item.airspace.id,name:item.airspace.name,type:item.airspace.type,country:item.airspace.country,lower_limit:item.airspace.lower_limit,upper_limit:item.airspace.upper_limit,by_notam:item.airspace.by_notam,status:item.status,matched_notams:item.matches.filter(m=>M.ROBUST.has(m.confidence)).map(m=>m.notam.id)}}
  return{GROUP_ORDER,activeOn,build,lifecycle,printItem,printState,stableId,statusRank};
});
