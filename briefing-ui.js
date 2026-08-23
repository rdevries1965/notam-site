(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BriefingUI=api})(typeof self!=='undefined'?self:this,function(){
  const COLLAPSED_DEFAULT=new Set(['DYNAMIC_INACTIVE','BY_NOTAM_NO_ACTIVATION','FLEXIBLE_BASELINE','CONTROLLED_BASELINE','OTHER_RELEVANT_NOTAMS','OTHER_NOTAMS']);
  function collapsedByDefault(key){return COLLAPSED_DEFAULT.has(key)}
  function attention(model){const c=model.counts;return{active:c.DYNAMIC_ACTIVE||0,partly_active:c.DYNAMIC_PARTLY_ACTIVE||0,unknown:c.DYNAMIC_UNKNOWN||0,inactive:c.DYNAMIC_INACTIVE||0,high:c.HIGH_NOTAMS||0,uncertain:(c.NOTAM_UNCERTAIN||0)+(c.POSSIBLE_MATCH||0)}}
  function summary(model){const c=attention(model);return`DYNAMIC AIRSPACE: ${c.active} active · ${c.partly_active} partly active · ${c.unknown} unresolved/check required · ${c.inactive} inactive · ${c.high} high/temporary NOTAMs`}
  return{COLLAPSED_DEFAULT,attention,collapsedByDefault,summary};
});
