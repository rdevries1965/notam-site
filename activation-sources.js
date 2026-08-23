(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ActivationSources=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TYPES={NOTAM:'NOTAM',AUP_UUP:'AUP_UUP',PUBLISHED_SCHEDULE:'PUBLISHED_SCHEDULE',AIP_SUP:'AIP_SUP',COMBINED:'COMBINED',UNKNOWN:'UNKNOWN'};
  function adapter(sourceType,records=[],contract={}){const byId=new Map(records.map(r=>[String(r.airspace_id),r]));return{sourceType,available:records.length>0,contract:{negativeWithoutIntervalAppliesToQueryWindow:contract.negativeWithoutIntervalAppliesToQueryWindow===true},statusFor:id=>byId.get(String(id))||null}}
  function unavailable(sourceType){return adapter(sourceType,[])}
  return{TYPES,adapter,unavailable,aupUup:(records,contract)=>adapter(TYPES.AUP_UUP,records,contract),aipSup:(records,contract)=>adapter(TYPES.AIP_SUP,records,contract)};
});
