(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NotamValidation=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const norm=value=>String(value??'').trim().toUpperCase(),number=value=>Number.isFinite(Number(value))?Number(value):null;
  function id(record){return norm(record.notam_reference||record.id)}
  function time(value){const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:null}
  function geometryKind(record){return norm(record.geometry&&record.geometry.type||record.geometry_type)}
  function compareField(name,left,right,equal){return equal(left,right)?null:{field:name,soaring:left??null,reference:right??null}}
  function compareRecord(soaring,reference){const differences=[
    compareField('start',soaring.valid_from,reference.valid_from,(a,b)=>time(a)===time(b)),compareField('end',soaring.valid_to,reference.valid_to,(a,b)=>time(a)===time(b)),
    compareField('lower_ft',number(soaring.lower_ft),number(reference.lower_ft),(a,b)=>a===b),compareField('upper_ft',number(soaring.upper_ft),number(reference.upper_ft),(a,b)=>a===b),
    compareField('geometry',geometryKind(soaring),geometryKind(reference),(a,b)=>a===b),compareField('classification',norm(soaring.classification||soaring.category),norm(reference.classification||reference.category),(a,b)=>a===b),compareField('qcode',norm(soaring.qcode),norm(reference.qcode),(a,b)=>a===b)
  ].filter(Boolean);return{id:id(soaring),present_in_soaring:true,present_in_reference:true,differences,classification:differences.length?'INVESTIGATE':'MATCH'}}
  function compare(soaringRecords,referenceRecords,expectedDifferenceIds=[]){const expected=new Set(expectedDifferenceIds.map(norm)),left=new Map((soaringRecords||[]).map(record=>[id(record),record]).filter(([key])=>key)),right=new Map((referenceRecords||[]).map(record=>[id(record),record]).filter(([key])=>key)),ids=[...new Set([...left.keys(),...right.keys()])].sort();return ids.map(key=>{let result;if(left.has(key)&&right.has(key))result=compareRecord(left.get(key),right.get(key));else result={id:key,present_in_soaring:left.has(key),present_in_reference:right.has(key),differences:[],classification:'INVESTIGATE'};if(expected.has(key))result.classification='EXPECTED DIFFERENCE';return result})}
  function summary(rows){return rows.reduce((out,row)=>(out[row.classification]=(out[row.classification]||0)+1,out),{MATCH:0,INVESTIGATE:0,'EXPECTED DIFFERENCE':0})}
  return{compare,compareRecord,id,summary};
});
