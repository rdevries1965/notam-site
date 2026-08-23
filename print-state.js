(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BriefingPrintState=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STORE='soaring-notam-briefing-v1',SCHEMA_VERSION=3;
  function valid(state){const c=state&&state.criteria;return Boolean(state&&state.version===SCHEMA_VERSION&&c&&Array.isArray(c.points)&&c.points.length>=2&&c.date&&c.start_local&&c.end_local&&c.from_utc&&c.to_utc&&c.timezone&&Number.isFinite(Number(c.task_distance_km))&&Number.isFinite(Number(c.corridor_km))&&Number.isFinite(Number(c.max_altitude_ft))&&state.sources&&Array.isArray(state.group_order)&&state.group_order.every(key=>Array.isArray(state.groups?.[key])))}
  function create(state){const value={...state,version:SCHEMA_VERSION};if(!valid(value))throw new Error('invalid current briefing print state');return value}
  function write(storage,state){const value=create(state),encoded=JSON.stringify(value);storage.removeItem(STORE);storage.setItem(STORE,encoded);return value}
  function read(storage){try{const value=JSON.parse(storage.getItem(STORE));return valid(value)?value:null}catch{return null}}
  return{STORE,SCHEMA_VERSION,valid,create,write,read};
});
