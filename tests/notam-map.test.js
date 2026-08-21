const test=require('node:test'),assert=require('node:assert/strict'),M=require('../notam-map.js');
test('centre radius becomes a real circle',()=>assert.deepEqual(M.renderables({geometry:{type:'Point',coordinates:[5.2,52.1]},radius_km:18.52}),[{kind:'circle',coordinates:[5.2,52.1],radius_m:18520}]));
test('point-only NOTAM becomes a marker',()=>assert.equal(M.renderables({geometry:{type:'Point',coordinates:[5.2,52.1]}})[0].kind,'marker'));
test('reliable polygon remains an area',()=>assert.equal(M.renderables({geometry:{type:'Polygon',coordinates:[[[5,52],[6,52],[5,52]]]}})[0].kind,'area'));
test('missing and insufficient geometry never invents an area',()=>{assert.deepEqual(M.renderables({}),[]);assert.deepEqual(M.renderables({geometry:{type:'LineString',coordinates:[[5,52],[6,53]]}}),[])});
test('operational significance controls style independently of Q-code',()=>{assert.equal(M.style({relevance:'HIGH_RELEVANCE',qcode:'QWFLW'},'HIGH_NOTAMS').level,'temporary');assert.equal(M.style({status:'ACTIVE'},'HIGH_NOTAMS').level,'critical');assert.equal(M.style({},'NOTAM_UNCERTAIN').level,'uncertain')});
