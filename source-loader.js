(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SourceLoader=api})(typeof self!=='undefined'?self:this,function(){
  const DEFAULT_RETRY_DELAYS_MS=Object.freeze([0,2000,5000,10000,20000]);
  function wait(milliseconds){return new Promise(resolve=>setTimeout(resolve,milliseconds))}
  async function json(urlFactory,{fetchImpl=fetch,retryDelaysMs=DEFAULT_RETRY_DELAYS_MS,waitImpl=wait}={}){
    if(typeof urlFactory!=='function'||!Array.isArray(retryDelaysMs)||!retryDelaysMs.length||retryDelaysMs.some(delay=>!Number.isFinite(delay)||delay<0))throw new Error('invalid source-loader configuration');
    let failure;
    for(const delay of retryDelaysMs){
      if(delay>0)await waitImpl(delay);
      try{
        const response=await fetchImpl(urlFactory(),{cache:'no-store'});
        if(!response?.ok)throw new Error(`source HTTP ${response?.status||'error'}`);
        return await response.json();
      }catch(error){failure=error}
    }
    throw failure||new Error('source unavailable');
  }
  return{DEFAULT_RETRY_DELAYS_MS,json};
});
