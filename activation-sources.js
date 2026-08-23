(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ActivationSources=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TYPES={NOTAM_ONLY:'NOTAM_ONLY',AUP_UUP:'AUP_UUP',AUP_UUP_OR_NOTAM:'AUP_UUP_OR_NOTAM',AUP_UUP_OR_NOTAM_OUTSIDE_SCHEDULE:'AUP_UUP_OR_NOTAM_OUTSIDE_SCHEDULE',PUBLISHED_SCHEDULE:'PUBLISHED_SCHEDULE',SCHEDULE_PLUS_NOTAM:'SCHEDULE_PLUS_NOTAM',AIP_SUP:'AIP_SUP',COMBINED:'COMBINED',H24:'H24',UNKNOWN:'UNKNOWN'};
  const REQUIRED_FIRS=['EHAA','EBBU','EDGG','EDWW','EDMM'];
  const validDate=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?date:null};
  function notamEvidence(payload,refreshStatus,now=new Date(),staleMinutes=60,briefingWindow=null){
    const generated=validDate(payload?.generated_at_utc),refreshGenerated=validDate(refreshStatus?.dataset_generated_at_utc),current=validDate(now);
    const age=generated&&current?(current.getTime()-generated.getTime())/60000:null;
    const firCoverage=Object.fromEntries(REQUIRED_FIRS.map(fir=>[fir,Number.isInteger(payload?.fir_counts?.[fir])&&payload.fir_counts[fir]>=0]));
    const payloadValid=payload?.source==='FAA_NMS_STAGING'&&Array.isArray(payload?.notams)&&Number.isInteger(payload?.total_unique_notam_count)&&payload.total_unique_notam_count===payload.notams.length;
    const generatedTimestampValid=Boolean(generated&&generated.getUTCFullYear()>=2025);
    const refreshSucceeded=refreshStatus?.source==='FAA_NMS_STAGING_REFRESH'&&refreshStatus?.success===true;
    const refreshTimestampMatchesDataset=Boolean(generated&&refreshGenerated&&generated.getTime()===refreshGenerated.getTime());
    const refreshCountMatchesDataset=Number.isInteger(refreshStatus?.notam_count)&&refreshStatus.notam_count===payload?.total_unique_notam_count;
    const freshnessPassed=Number.isFinite(age)&&age>=0&&age<=staleMinutes;
    const configuredFirCoverageComplete=REQUIRED_FIRS.every(fir=>firCoverage[fir]);
    const querySourceErrorsAbsent=!refreshStatus?.error&&(!Array.isArray(payload?.query_errors)||payload.query_errors.length===0);
    // Future-effective NOTAMs are part of a current population snapshot. A wholly
    // historical window is different: expired records may already be absent.
    const briefingWindowCovered=!briefingWindow||Boolean(generated&&validDate(briefingWindow.to)?.getTime()>=generated.getTime());
    const checks={faaPayloadValid:payloadValid,generatedTimestampValid,refreshSucceeded,refreshTimestampMatchesDataset,refreshCountMatchesDataset,freshnessPassed,firCoverage,configuredFirCoverageComplete,briefingWindowCovered,querySourceErrorsAbsent};
    const labels={faaPayloadValid:'FAA payload is invalid or its NOTAM count is inconsistent',generatedTimestampValid:'dataset generated timestamp is invalid',refreshSucceeded:'FAA NMS refresh did not succeed',refreshTimestampMatchesDataset:'refresh status does not belong to this dataset timestamp',refreshCountMatchesDataset:'refresh status NOTAM count does not match this dataset',freshnessPassed:'FAA NMS dataset is stale or has a future timestamp',configuredFirCoverageComplete:'configured FIR query coverage is incomplete',briefingWindowCovered:'selected briefing window predates the current NOTAM population snapshot',querySourceErrorsAbsent:'FAA query/source errors are present'};
    const failedReasons=Object.entries(labels).filter(([key])=>!checks[key]).map(([,message])=>message);
    for(const fir of REQUIRED_FIRS)if(!firCoverage[fir])failedReasons.push(`${fir} query coverage metadata missing or invalid`);
    const complete=failedReasons.length===0;
    return{complete,checks,failedReasons,generated_at_utc:generated?.toISOString()||null,age_minutes:Number.isFinite(age)?age:null,coverage_complete:configuredFirCoverageComplete,refresh_succeeded:refreshSucceeded&&refreshTimestampMatchesDataset&&refreshCountMatchesDataset,briefing_window_covered:briefingWindowCovered,reason:complete?'complete successful FAA NMS dataset for all configured FIR queries and selected briefing window':failedReasons[0]};
  }
  function adapter(sourceType,records=[],contract={}){const byId=new Map();for(const record of records)for(const key of [record.airspace_id,record.identifier].filter(Boolean))byId.set(String(key).toUpperCase().replace(/[^A-Z0-9]/g,''),record);return{sourceType,available:records.length>0,contract:{negativeWithoutIntervalAppliesToQueryWindow:contract.negativeWithoutIntervalAppliesToQueryWindow===true,coverage_complete:contract.coverage_complete===true,query_from:contract.query_from||null,query_to:contract.query_to||null},statusFor:(id,identifier)=>byId.get(String(id||'').toUpperCase().replace(/[^A-Z0-9]/g,''))||byId.get(String(identifier||'').toUpperCase().replace(/[^A-Z0-9]/g,''))||null}}
  function unavailable(sourceType){return adapter(sourceType,[])}
  return{TYPES,REQUIRED_FIRS,notamEvidence,adapter,unavailable,aupUup:(records,contract)=>adapter(TYPES.AUP_UUP,records,contract),aipSup:(records,contract)=>adapter(TYPES.AIP_SUP,records,contract)};
});
