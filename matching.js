(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirspaceMatching=api})(typeof self!=='undefined'?self:this,function(){
  const ROBUST=new Set(['EXACT','STRONG']),ACTIVATE_CONDITIONS=new Set(['CA']),CHANGE_ONLY=new Set(['CH','LT','LC']);
  const ACTIVATION=/\b(activat(?:e|ed|ion)|establish(?:ed|ment)|in force|in effect|airspace (?:is )?closed|flights? (?:are )?prohibited|firing (?:in progress|activity)|military exercise active)\b/i;
  const PREFIX={NL:'EH',BE:'EB',DE:'ED'},DYNAMIC=new Set([1,2,3,8,9,31]);
  function normalizeName(value){return String(value||'').toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function identifiers(value){
    const text=String(value||'').toUpperCase(),found=new Set(),patterns=[/\b([A-Z]{2})\s*[- ]?\s*([PRD])\s*(\d+[A-Z]?)(?:_(\d+))?\b/g,/\b([A-Z]{2})\s*[- ]?\s*(TRA|TSA)\s*(\d+[A-Z]?)(?:_(\d+))?\b/g,/\b(TRA|TSA|CBA)\s*(\d+[A-Z]?)(?:_(\d+))?\b/g];
    for(const [index,pattern] of patterns.entries())for(const match of text.matchAll(pattern)){const suffix=index<2?match[4]:match[3];found.add(index===0?`${match[1]}${match[2]}${match[3]}${suffix||''}`:index===1?`${match[1]}${match[2]}${match[3]}${suffix||''}`:`${match[1]}${match[2]}${suffix||''}`)}
    return[...found];
  }
  function countryCompatible(airspace,notam){const country=String(airspace?.country||'').toUpperCase(),fir=String(notam?.fir||'').toUpperCase(),location=String(notam?.location||'').toUpperCase(),prefix=PREFIX[country];return!country||!prefix||fir.startsWith(prefix)||location.startsWith(prefix)}
  function qParts(notam){const raw=String(notam?.qcode||'').toUpperCase().replace(/^Q/,'');return{subject:raw.slice(0,2),condition:raw.slice(2,4)}}
  function semantic(notam){const {subject}=qParts(notam);return subject.startsWith('R')||subject.startsWith('W')||ACTIVATION.test(String(notam?.text||''))}
  function activationSemantics(notam){if(!notam||['CANCELLED','SUPERSEDED'].includes(String(notam.status||'').toUpperCase()))return false;const {condition}=qParts(notam);return!CHANGE_ONLY.has(condition)&&(ACTIVATE_CONDITIONS.has(condition)||ACTIVATION.test(String(notam.text||'')))}
  function deactivationSemantics(notam){const {condition}=qParts(notam),text=String(notam?.text||'');return condition==='CD'||/\b(?:deactivat(?:e|ed|ion)|not active|(?:area|restriction|activation)[^.]{0,60}(?:is )?cancelled|restriction (?:is )?suspended)\b/i.test(text)}
  function qCompatible(airspace,notam,explicit=false){const {subject}=qParts(notam),type=Number(airspace?.type_code);if(subject.startsWith('R'))return DYNAMIC.has(type);if(subject.startsWith('W'))return explicit&&DYNAMIC.has(type);return explicit&&ACTIVATION.test(String(notam?.text||''))}
  function altitudeFeet(limit,upper=false){if(!limit||!Number.isFinite(Number(limit.value)))return upper?Infinity:0;const unit=String(limit.unit||'').toUpperCase();return unit==='FL'?Number(limit.value)*100:unit==='M'?Number(limit.value)*3.28084:Number(limit.value)}
  function verticalOverlap(airspace,notam){const low=Math.max(altitudeFeet(airspace?.lower_limit),Number(notam?.lower_ft||0)),high=Math.min(altitudeFeet(airspace?.upper_limit,true),Number(notam?.upper_ft??99999));return low<=high}
  function alias(value){return normalizeName(value).replace(/\b(?:EH|EB|ED)\s*(?:P|R|D|TRA|TSA)\s*\d+[A-Z]?(?:\s+\d+)?\b|\b(?:TRA|TSA|CBA)\s*\d+[A-Z]?(?:\s+\d+)?\b/g,' ').replace(/\b(?:H24|NOTAM|AREA|RESTRICTED|DANGER|PROHIBITED|TEMPORARY|RESERVED|SEGREGATED|MON|TUE|WED|THU|FRI|SAT|SUN)\b/g,' ').replace(/\s+/g,' ').trim()}
  function geoEvidence(value){if(value&&typeof value==='object')return{overlap:value.overlap===true,kind:value.kind||'geometry',radius_km:Number(value.radius_km)||0};return{overlap:value===true,kind:'geometry',radius_km:0}}
  function match(airspace,notam,relationship,vertical=verticalOverlap(airspace,notam)){
    const airIds=identifiers(`${airspace?.identifier||''} ${airspace?.name||''} ${airspace?.official_name||''} ${(airspace?.aliases||[]).join(' ')} ${airspace?.id||''}`),notamIds=identifiers(`${notam?.notam_reference||''} ${notam?.id||''} ${notam?.text||''}`),shared=airIds.filter(id=>notamIds.includes(id));
    const country=countryCompatible(airspace,notam),geo=geoEvidence(relationship),nameN=normalizeName(notam?.text),nameAliases=[airspace?.official_name,airspace?.name,...(airspace?.aliases||[])].map(alias).filter(value=>value.length>=5),nameSignal=nameAliases.some(value=>nameN.includes(value)),identifierConflict=airIds.length>0&&notamIds.length>0&&!shared.length,explicit=shared.length>0||nameSignal,compatible=qCompatible(airspace,notam,explicit),broadRadius=geo.kind==='point-radius'&&geo.radius_km>50;
    let confidence='REJECTED',reasons=[];
    if(!vertical)reasons.push('vertical bands do not overlap');
    else if(identifierConflict)reasons.push('explicit airspace identifiers conflict');
    else if(!country&&!explicit)reasons.push('country/FIR incompatible without explicit cross-border evidence');
    else if(!compatible)reasons.push('Q-code/airspace semantics incompatible');
    else if(shared.length&&country&&geo.overlap&&!broadRadius){confidence='EXACT';reasons.push('exact identifier + direct geometry + FIR/country')}
    else if(shared.length&&country){confidence='STRONG';reasons.push(geo.overlap?'exact identifier + compatible geometry':'exact identifier + compatible FIR/country')}
    else if(nameSignal&&country&&geo.overlap&&!broadRadius){confidence='STRONG';reasons.push('official/local name + direct geometry + FIR/country')}
    else if(nameSignal&&country){confidence='POSSIBLE';reasons.push('explicit area name mention but geometry unresolved')}
    else if(geo.overlap&&!broadRadius&&country&&compatible&&activationSemantics(notam)){confidence='POSSIBLE';reasons.push('direct geometry + compatible restriction activation semantics')}
    else if(broadRadius)reasons.push('broad Q-line radius is insufficient association evidence');
    else reasons.push('no credible identifier, name, or geographic relationship');
    return{confidence,identifier:shared[0]||null,reasons,signals:{identifier:!!shared.length,identifier_conflict:identifierConflict,country,geometry:geo.overlap,geometry_kind:geo.kind,broad_radius:broadRadius,vertical,name:nameSignal,semantic:semantic(notam),q_compatible:compatible}};
  }
  return{ROBUST,activationSemantics,deactivationSemantics,alias,countryCompatible,identifiers,match,normalizeName,qCompatible,qParts,semantic,verticalOverlap};
});
