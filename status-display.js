(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StatusDisplay=api})(typeof self!=='undefined'?self:this,function(){
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function formatUtcUpdate(value){
    const date=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(date.getTime()))return'—';
    const day=String(date.getUTCDate()).padStart(2,'0');
    const month=MONTHS[date.getUTCMonth()];
    const year=date.getUTCFullYear();
    const hour=String(date.getUTCHours()).padStart(2,'0');
    const minute=String(date.getUTCMinutes()).padStart(2,'0');
    return`${day}-${month}-${year} ${hour}:${minute} UTC`;
  }
  function requireSchemaTimestamp(value){
    if(!value)throw new Error('missing timestamp');
    const date=value instanceof Date?new Date(value.getTime()):new Date(value);
    if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<2025)throw new Error('invalid timestamp');
    return date;
  }
  function faa(label,updated,{stale=false,failed=false,attempt=null}={}){
    const attemptDate=attempt instanceof Date?attempt:attempt?new Date(attempt):null;
    const attemptText=failed&&attemptDate&&Number.isFinite(attemptDate.getTime())?` · REFRESH FAILED ${String(attemptDate.getUTCHours()).padStart(2,'0')}:${String(attemptDate.getUTCMinutes()).padStart(2,'0')} UTC`:failed?' · REFRESH FAILED':'';
    return`${label} · updated ${formatUtcUpdate(updated)}${stale?' · STALE':''}${attemptText}`;
  }
  function openaip(updated){return`OpenAIP · updated ${formatUtcUpdate(updated)} · NL AIP SUP`}
  return{formatUtcUpdate,requireSchemaTimestamp,faa,openaip};
});
