(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BriefingSchedule=api})(typeof self!=='undefined'?self:this,function(){
  const DAY={SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};
  function windowFor(date,start='10:00',end='18:00'){
    const from=new Date(`${date}T${start}:00`),to=new Date(`${date}T${end}:00`);
    if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||to<=from)throw new Error('Invalid briefing time window');
    return{from,to,from_utc:from.toISOString(),to_utc:to.toISOString(),date,start_local:start,end_local:end,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'local'};
  }
  function validityOverlap(item,window){
    const from=item&&item.valid_from?new Date(item.valid_from):null,to=item&&item.valid_to&&item.valid_to!=='PERM'?new Date(item.valid_to):null;
    return(!from||!Number.isFinite(from.getTime())||from<window.to)&&(!to||!Number.isFinite(to.getTime())||to>window.from);
  }
  function minutes(value){const m=String(value||'').match(/^(\d{2}):?(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null}
  function rangeOverlap(start,end,window){
    const a=minutes(start),b=minutes(end);if(a===null||b===null)return false;
    const ws=window.from.getUTCHours()*60+window.from.getUTCMinutes(),we=window.to.getUTCHours()*60+window.to.getUTCMinutes();
    return a<we&&b>ws;
  }
  function dayMatches(token,day){
    const parts=String(token||'').toUpperCase().split('-'),a=DAY[parts[0]],b=DAY[parts[1]];
    if(a===undefined)return true;if(b===undefined)return day===a;return a<=b?day>=a&&day<=b:day>=a||day<=b;
  }
  function notamSchedule(schedule,window){
    if(!schedule)return{overlap:true,certainty:'EXACT',reason:'continuous validity'};
    const text=String(schedule).toUpperCase().trim(),day=window.from.getUTCDay(),segments=[...text.matchAll(/(?:(SUN|MON|TUE|WED|THU|FRI|SAT)(?:-(SUN|MON|TUE|WED|THU|FRI|SAT))?[^0-9]*)?(\d{4})-(\d{4})/g)];
    if(!segments.length)return{overlap:true,certainty:'UNCERTAIN',reason:'schedule not safely parseable'};
    const overlap=segments.some(m=>dayMatches(m[1]&&m[2]?`${m[1]}-${m[2]}`:m[1],day)&&rangeOverlap(m[3],m[4],window));
    return{overlap,certainty:'EXACT',reason:overlap?'schedule overlaps window':'schedule outside window'};
  }
  function notamOverlap(item,window){if(!validityOverlap(item,window))return{overlap:false,certainty:'EXACT',reason:'validity outside window'};return notamSchedule(item&&item.schedule,window)}
  function explicitWindow(item,window){
    if(!item||(!item.active_from&&!item.active_until))return null;
    const from=item.active_from?new Date(item.active_from):null,to=item.active_until?new Date(item.active_until):null;
    const overlap=(!from||from<window.to)&&(!to||to>window.from);return{overlap,certainty:'EXACT',reason:'OpenAIP activation window'};
  }
  function airspaceSchedule(item,window){
    const explicit=explicitWindow(item,window);if(explicit)return explicit;
    const entries=Array.isArray(item&&item.activation_schedule)?item.activation_schedule:[];
    if(!entries.length)return{overlap:false,certainty:'NONE',reason:'no structured activation schedule'};
    const day=window.from.getDay(),matches=entries.filter(e=>e.day===undefined||e.day===null||Number(e.day)===day);
    if(matches.some(e=>e.by_notam))return{overlap:false,certainty:'UNCERTAIN',reason:'activation announced by NOTAM'};
    const overlap=matches.some(e=>e.h24||rangeOverlapLocal(e.start,e.end,window));return{overlap,certainty:'EXACT',reason:overlap?'structured schedule overlaps window':'structured schedule outside window'};
  }
  function rangeOverlapLocal(start,end,window){const a=minutes(start),b=minutes(end),ws=window.from.getHours()*60+window.from.getMinutes(),we=window.to.getHours()*60+window.to.getMinutes();return a!==null&&b!==null&&a<we&&b>ws}
  return{airspaceSchedule,explicitWindow,notamOverlap,notamSchedule,validityOverlap,windowFor};
});
