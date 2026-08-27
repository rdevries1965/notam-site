(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NlAipSupAirspace=api})(typeof self!=='undefined'?self:this,function(){
  const normalize=value=>String(value||'').toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]/g,'');
  function validate(payload){
    if(!payload||payload.source!=='NL_AIP_SUP_CURATED'||!Array.isArray(payload.airspaces)||payload.airspace_count!==payload.airspaces.length)throw new Error('invalid NL AIP SUP schema');
    for(const item of payload.airspaces)if(!item.id||item.country!=='NL'||!item.geometry||!item.valid_from||!item.valid_to||!item.activation_mechanism||!item.sup_number||!item.source_url)throw new Error(`invalid NL AIP SUP record: ${item.id||'unknown'}`);
    return payload;
  }
  function names(item){return[item.identifier,item.name,item.official_name,...(item.aliases||[])].map(normalize).filter(Boolean)}
  function merge(openaip=[],supplements=[]){
    const official=new Set(supplements.flatMap(names));
    const baseline=openaip.filter(item=>!names(item).some(name=>official.has(name)));
    return[...baseline,...supplements.map(item=>({...item,baseline_source:'NL_AIP_SUP'}))];
  }
  function rules(payload){return new Map(validate(payload).airspaces.map(item=>[String(item.id),item]))}
  return{merge,normalize,rules,validate};
});
