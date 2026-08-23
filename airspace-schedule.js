(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AirspaceSchedule=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STATUS={ACTIVE_FULL:'SCHEDULE_ACTIVE_FULL',ACTIVE_PARTIAL:'SCHEDULE_ACTIVE_PARTIAL',INACTIVE:'SCHEDULE_INACTIVE',UNKNOWN:'SCHEDULE_UNKNOWN'};
  const minutes=value=>{const match=String(value||'').match(/^(\d{2}):?(\d{2})$/);return match?Number(match[1])*60+Number(match[2]):null};
  function lastSunday(year,month){const date=new Date(Date.UTC(year,month+1,0));date.setUTCDate(date.getUTCDate()-date.getUTCDay());return date}
  function summerAt(date){const year=date.getUTCFullYear(),start=lastSunday(year,2),end=lastSunday(year,9);start.setUTCHours(1,0,0,0);end.setUTCHours(1,0,0,0);return date>=start&&date<end}
  function interval(entry,date){
    if(entry.time_basis!=='UTC')return null;
    const variant=summerAt(date)?entry.summer:entry.winter;
    if(entry.h24)return{from:new Date(date),to:new Date(date.getTime()+86400000)};
    const start=minutes(variant?.start),end=minutes(variant?.end);if(start===null||end===null)return null;
    const from=new Date(date.getTime()+start*60000),to=new Date(date.getTime()+end*60000+(end<=start?86400000:0));return{from,to};
  }
  function merge(intervals){const sorted=intervals.sort((a,b)=>a.from-b.from),out=[];for(const item of sorted){const last=out.at(-1);if(last&&item.from<=last.to)last.to=new Date(Math.max(last.to,item.to));else out.push({...item})}return out}
  function evaluate(rule,window,evaluatedAt=new Date()){
    const entries=rule?.published_activity_schedule;if(!Array.isArray(entries)||!entries.length)return{status:STATUS.UNKNOWN,reason:'No authoritative structured schedule is available.',intervals:[],source_type:'PUBLISHED_SCHEDULE',source_reference:rule?.official_source_url||null,rule_identifier:rule?.identifier||null,evaluated_at:evaluatedAt.toISOString()};
    if(entries.some(e=>e.kind==='UDP'||e.excludes_holidays&&!Array.isArray(e.holiday_dates)))return{status:STATUS.UNKNOWN,reason:'Official UDP/holiday schedule requires an authoritative date calendar.',intervals:[],source_type:'PUBLISHED_SCHEDULE',source_reference:rule.official_source_url,rule_identifier:rule.identifier,evaluated_at:evaluatedAt.toISOString()};
    const dates=[],cursor=new Date(Date.UTC(window.from.getUTCFullYear(),window.from.getUTCMonth(),window.from.getUTCDate()-1)),last=new Date(Date.UTC(window.to.getUTCFullYear(),window.to.getUTCMonth(),window.to.getUTCDate()+1));while(cursor<=last){dates.push(new Date(cursor));cursor.setUTCDate(cursor.getUTCDate()+1)}
    const applicable=[];
    for(const entry of entries)for(const date of dates){const iso=date.toISOString().slice(0,10),day=date.getUTCDay();if(entry.days&&!entry.days.includes(day)||entry.exclude_dates?.includes(iso)||entry.excludes_holidays&&entry.holiday_dates.includes(iso))continue;const raw=interval(entry,date);if(!raw)continue;const from=new Date(Math.max(raw.from,window.from)),to=new Date(Math.min(raw.to,window.to));if(to>from)applicable.push({from,to})}
    const intervals=merge(applicable),covered=intervals.reduce((sum,x)=>sum+(x.to-x.from),0),duration=window.to-window.from;
    const base={intervals:intervals.map(x=>({from:x.from.toISOString(),to:x.to.toISOString()})),source_type:'PUBLISHED_SCHEDULE',source_reference:rule.official_source_url,rule_identifier:rule.identifier,evaluated_at:evaluatedAt.toISOString()};
    if(covered>=duration)return{...base,status:STATUS.ACTIVE_FULL,reason:'Official published activation schedule covers the complete briefing window.'};
    if(covered>0)return{...base,status:STATUS.ACTIVE_PARTIAL,reason:'Official published activation schedule covers part of the briefing window.'};
    return{...base,status:STATUS.INACTIVE,reason:'Official published activation schedule does not overlap the briefing window.'};
  }
  return{STATUS,evaluate,summerAt};
});
