(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BaselineAirspace=api})(typeof self!=='undefined'?self:this,function(){
  const GROUPS={prd:new Set([1,2,3]),flexible:new Set([8,9,31]),ctr:new Set([4,36]),tma:new Set([7]),atz:new Set([13,14]),rmztmz:new Set([5,6])};
  const DEFAULTS={prd:true,flexible:true,faa:true,ctr:false,tma:false,atz:false,rmztmz:false};
  function groupFor(item){const code=Number(item&&item.type_code);return Object.keys(GROUPS).find(group=>GROUPS[group].has(code))||null}
  function lowerFeet(limit){
    if(!limit||!Number.isFinite(Number(limit.value)))return 0;
    const value=Number(limit.value),unit=String(limit.unit||'').toUpperCase(),reference=String(limit.reference||'').toUpperCase();
    if(reference==='GND'||reference==='AGL')return 0; // Terrain is unavailable: retain conservatively.
    if(unit==='FL')return value*100;
    if(unit==='M')return value*3.28084;
    return unit==='FT'?value:0;
  }
  function verticalOverlap(item,maxFeet){return lowerFeet(item&&item.lower_limit)<=Number(maxFeet)}
  function selected(item,selections){const group=groupFor(item);return !!group&&!!selections[group]}
  function qualifies(item,selections,maxFeet,intersects){return selected(item,selections)&&verticalOverlap(item,maxFeet)&&intersects(item)}
  function limitText(limit){if(!limit)return'—';return `${limit.value} ${limit.unit} ${limit.reference}`}
  return{GROUPS,DEFAULTS,groupFor,lowerFeet,verticalOverlap,selected,qualifies,limitText};
});
