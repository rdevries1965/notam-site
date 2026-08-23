(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaskWorkflow=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DRAWING='DRAWING',FINISHED='FINISHED';
  function create(initial=DRAWING){let state=initial===FINISHED?FINISHED:DRAWING;return{get state(){return state},newTask(){state=DRAWING;return state},finish(pointCount){if(Number(pointCount)<2)return false;state=FINISHED;return true},edit(){state=DRAWING;return state},restore(value,pointCount){state=value===DRAWING||value===FINISHED?value:Number(pointCount)>=2?FINISHED:DRAWING;return state},canAddPoint(){return state===DRAWING},canUndo(){return state===DRAWING},isFinished(){return state===FINISHED}}}
  return{DRAWING,FINISHED,create};
});
