const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('V2.6 loads map semantics before app and bumps coherent service-worker assets',()=>{const html=read('index.html'),sw=read('sw.js');assert.match(html,/Soaring NOTAM — V2\.6/);assert.ok(html.indexOf('notam-map.js?v=2.6')<html.indexOf('app.js?v=2.6'));assert.match(sw,/soaring-notam-v2-6/);assert.match(sw,/notam-map\.js/)});
test('map and briefing interaction includes bounded zoom and collapsed-group reveal',()=>{const app=read('app.js');assert.match(app,/maxZoom:11/);assert.match(app,/card&&card\.parentElement\.hidden/);assert.match(app,/scrollIntoView/);assert.match(app,/interactive:false/)});
test('help states the safety-critical no-activation warning',()=>assert.match(read('index.html'),/NO ACTIVATION FOUND does not mean confirmed inactive\./));
