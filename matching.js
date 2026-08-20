(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirspaceMatching=api})(typeof self!=='undefined'?self:this,function(){
  const ROBUST=new Set(['EXACT','STRONG']);
  const ACTIVATE_CONDITIONS=new Set(['CA']);
  const ACTIVATION=/\b(activat(?:e|ed|ion)|establish(?:ed|ment)|in force|in effect|airspace (?:is )?closed|flights? (?:are )?prohibited|firing (?:in progress|activity)|military exercise active)\b/i;
  const CHANGE_ONLY=new Set(['CH','LT','LC']);
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
    const q=String(notam.qcode||'').toUpperCase().replace(/^Q/,''),condition=q.slice(2,4);return !CHANGE_ONLY.has(condition)&&(ACTIVATE_CONDITIONS.has(condition)||ACTIVATION.test(String(notam.text||'')));
  }
  function altitudeFeet(limit,upper=false){if(!limit||!Number.isFinite(Number(limit.value)))return upper?Infinity:0;const unit=String(limit.unit||'').toUpperCase();return unit==='FL'?Number(limit.value)*100:unit==='M'?Number(limit.value)*3.28084:Number(limit.value)}
  function verticalOverlap(airspace,notam){const low=Math.max(altitudeFeet(airspace&&airspace.lower_limit),Number(notam&&notam.lower_ft||0)),high=Math.min(altitudeFeet(airspace&&airspace.upper_limit,true),Number((notam&&notam.upper_ft)??99999));return low<=high}
  function alias(value){return normalizeName(value).replace(/\b(?:EH|EB|ED)\s*(?:P|R|D|TRA|TSA)\s*\d+[A-Z]?\b/g,' ').replace(/\b(?:H24|NOTAM|AREA|RESTRICTED|DANGER|PROHIBITED|TEMPORARY|RESERVED|SEGREGATED)\b/g,' ').replace(/\s+/g,' ').trim()}
  function match(airspace,notam,geometryOverlap,vertical=verticalOverlap(airspace,notam)){
    const airIds=identifiers(`${airspace&&airspace.name||''} ${airspace&&airspace.id||''}`),notamIds=identifiers(`${notam&&notam.id||''} ${notam&&notam.text||''}`),shared=airIds.filter(id=>notamIds.includes(id));
    const country=countryCompatible(airspace,notam),geometry=!!geometryOverlap,nameA=normalizeName(airspace&&airspace.name),nameN=normalizeName(notam&&notam.text),localAlias=alias(airspace&&airspace.name),nameSignal=(nameA.length>=6&&nameN.includes(nameA))||(localAlias.length>=5&&nameN.includes(localAlias)),controlled=new Set([4,5,6,7,13,14,36]).has(Number(airspace&&airspace.type_code));
    let confidence='NONE';
    if(shared.length&&country&&geometry&&vertical)confidence='EXACT';
    else if(country&&geometry&&vertical&&(shared.length||nameSignal))confidence='STRONG';
    else if((shared.length&&country&&vertical)||(!controlled&&country&&geometry&&vertical&&semantic(notam)))confidence='POSSIBLE';
    return{confidence,identifier:shared[0]||null,signals:{identifier:!!shared.length,country,geometry,vertical,name:nameSignal,semantic:semantic(notam)}};
  }
  return{ROBUST,activationSemantics,alias,countryCompatible,identifiers,match,normalizeName,semantic,verticalOverlap};
});
