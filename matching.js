(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirspaceMatching=api})(typeof self!=='undefined'?self:this,function(){
  const ROBUST=new Set(['EXACT','STRONG']);
  const ACTIVATE_CONDITIONS=new Set(['CA','CC','LC','LT']);
  const ACTIVATION=/\b(activat(?:e|ed|ion)|in force|in effect|airspace (?:is )?closed|restricted|prohibited|firing|military exercise)\b/i;
  function normalizeName(value){return String(value||'').toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function identifiers(value){
    const text=normalizeName(value),found=new Set();
    const patterns=[/\b[A-Z]{2}\s*[PRD]\s*\d+[A-Z]?\b/g,/\b[A-Z]{2}\s*(?:TRA|TSA)\s*\d+[A-Z]?\b/g,/\b(?:TRA|TSA|CBA)\s*\d+[A-Z]?\b/g];
    patterns.forEach(pattern=>{for(const match of text.matchAll(pattern))found.add(match[0].replace(/\s+/g,''))});
    const values=[...found];
    return values.filter(value=>!values.some(other=>other!==value&&other.endsWith(value)));
  }
  function countryCompatible(airspace,notam){
    const country=String(airspace&&airspace.country||'').toUpperCase(),fir=String(notam&&notam.fir||'').toUpperCase(),location=String(notam&&notam.location||'').toUpperCase();
    const prefixes={NL:'EH',BE:'EB',DE:'ED'};return !country||!prefixes[country]||fir.startsWith(prefixes[country])||location.startsWith(prefixes[country]);
  }
  function semantic(notam){const subject=String(notam&&notam.qcode||'').toUpperCase().replace(/^Q/,'').slice(0,2);return subject.startsWith('R')||subject.startsWith('W')||ACTIVATION.test(String(notam&&notam.text||''))}
  function activationSemantics(notam){
    if(!notam||['CANCELLED','SUPERSEDED'].includes(String(notam.status||'').toUpperCase()))return false;
    const q=String(notam.qcode||'').toUpperCase().replace(/^Q/,'');return ACTIVATE_CONDITIONS.has(q.slice(2,4))||ACTIVATION.test(String(notam.text||''));
  }
  function match(airspace,notam,geometryOverlap){
    const airIds=identifiers(`${airspace&&airspace.name||''} ${airspace&&airspace.id||''}`),notamIds=identifiers(`${notam&&notam.id||''} ${notam&&notam.text||''}`),shared=airIds.filter(id=>notamIds.includes(id));
    const country=countryCompatible(airspace,notam),geometry=!!geometryOverlap,nameA=normalizeName(airspace&&airspace.name),nameN=normalizeName(notam&&notam.text),nameSignal=nameA.length>=6&&nameN.includes(nameA);
    let confidence='NONE';
    if(shared.length&&country&&geometry)confidence='EXACT';
    else if(country&&geometry&&(shared.length||nameSignal))confidence='STRONG';
    else if((shared.length&&country)||(country&&geometry&&semantic(notam)))confidence='POSSIBLE';
    return{confidence,identifier:shared[0]||null,signals:{identifier:!!shared.length,country,geometry,name:nameSignal,semantic:semantic(notam)}};
  }
  function statusFor(airspace,matches){
    const robust=(matches||[]).filter(item=>ROBUST.has(item.confidence));
    if(robust.some(item=>activationSemantics(item.notam)))return'ACTIVE BY NOTAM';
    if(robust.length)return'NOTAM MATCH';
    if((matches||[]).some(item=>item.confidence==='POSSIBLE'))return'POSSIBLE MATCH';
    if(airspace&&airspace.by_notam)return'BY NOTAM – NO ACTIVATION FOUND';
    if(airspace&&airspace.permanent_h24===true)return'PERMANENT / H24';
    return'BASELINE ONLY';
  }
  return{ROBUST,activationSemantics,countryCompatible,identifiers,match,normalizeName,semantic,statusFor};
});
