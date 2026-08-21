(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BriefingUI=api})(typeof self!=='undefined'?self:this,function(){
  const COLLAPSED_DEFAULT=new Set(['BY_NOTAM_NO_ACTIVATION','FLEXIBLE_BASELINE','CONTROLLED_BASELINE','OTHER_RELEVANT_NOTAMS','OTHER_NOTAMS']);
  function collapsedByDefault(key){return COLLAPSED_DEFAULT.has(key)}
  function attention(model){const c=model.counts;return{prohibited:c.PERMANENT_PROHIBITED,active:c.ACTIVE_BY_NOTAM,scheduled:c.SCHEDULED_ACTIVE,high:c.HIGH_NOTAMS,uncertain:c.NOTAM_UNCERTAIN+c.POSSIBLE_MATCH,no_activation:c.BY_NOTAM_NO_ACTIVATION}}
  function summary(model){const c=attention(model);return`ATTENTION: ${c.prohibited} prohibited · ${c.active} active · ${c.scheduled} scheduled · ${c.high} high NOTAMs · ${c.uncertain} uncertain`}
  return{COLLAPSED_DEFAULT,attention,collapsedByDefault,summary};
});
