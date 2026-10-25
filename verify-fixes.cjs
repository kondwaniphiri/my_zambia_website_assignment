// Author: Kondwani Phiri
process.env.ADMIN_USER_IDS = '';
process.env.SESSION_STORE = 'memory';
﻿var fs = require('fs');
var assert = require('assert');
var bcrypt = require('bcrypt');
var calls = [];
var hash;
var fake = { execute: async function(sql, values) {
 assert.equal((sql.match(/\?/g) || []).length, (values || []).length, 'SQL values match placeholders');
 calls.push([sql, values]);
 if (sql.indexOf('SELECT id, name, password') == 0) return [[{id: 7, name: 'Tester', password: hash || 'legacy'}]];
 if (sql.indexOf('SELECT * FROM chillspots WHERE id') == 0) return [values[0] == '1' ? [{id:1,h1:'Trusted name',h2:'',p:'Description',details:'Details',img:'',img1:'',img2:'',img3:'',img4:'',map:'',phone:'',address:'',site:''}] : []];
 if (sql.indexOf('SELECT id FROM users') == 0) return [[]];
 return [{affectedRows: 1}];
}, end: async function() {} };
require.cache[require.resolve('./db')] = {id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true, exports: async function() {return fake;}};
var app = require('./app');
var server = app.listen(0, '127.0.0.1', async function() {
 var base = 'http://127.0.0.1:' + server.address().port;
 var cookie = '';
 async function request(path, data, skipCsrf) {
  if (data && !skipCsrf) {
   var page = await request('/login');
   data = Object.assign({}, data, { _csrf: page.text.match(/name="csrf-token" content="([a-f0-9]+)"/)[1] });
  }
  var r = await fetch(base + path, {method: data ? 'POST':'GET', headers: Object.assign({Cookie:cookie},data ? {'Content-Type':'application/x-www-form-urlencoded'}:{}), body:data ? new URLSearchParams(data):undefined, redirect:'manual'});
  if(r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
  return {status:r.status, text:await r.text(), location:r.headers.get('location')};
 }
 try {
  assert.equal((await request('/login', {email:'a@b.c',password:'legacy'}, true)).status,403);
  assert.equal((await request('/database/action', {action:'deleteAttraction',id:1,_csrf:'x'}, true)).status,403);
  var stale = (await request('/login')).text.match(/name="csrf-token" content="([a-f0-9]+)"/)[1];
  assert.equal((await request('/login',{email:'a@b.c',password:'wrong'})).status,401);
  assert.equal((await request('/database/action',{action:'deleteAttraction',id:1})).status,403);
  assert.equal((await request('/database/action',{action:'addReview',data:'{}'})).status,401);
  await request('/guest', {});
  for(var path of ['/', '/chill','/attractions']) { var r = await request(path); assert.equal(r.status,200); assert(r.text.includes('Guest')); }
  assert.equal((await request('/login',{email:'a@b.c',password:'legacy'})).status,302);
  assert.equal((await request('/database/action',{action:'updateNews',_csrf:stale},true)).status,403);
  var detail = await request('/chilldetails?id=1&h1=Forged');
  assert.equal(detail.status,200); assert(detail.text.includes('Trusted name')); assert(!detail.text.includes('Forged'));
  assert.equal((await request('/chilldetails?id=2')).status,404);
  assert.equal((await request('/chilldetails?id=bad')).status,400);
  var upgraded = calls.find(c=>c[0].indexOf('UPDATE users SET password')==0);
  assert(await bcrypt.compare('legacy',upgraded[1][0])); hash=upgraded[1][0];
  assert.equal((await request('/database/action',{action:'updateNews',id:1})).status,403);
  await request('/database/action',{action:'updateReview',data:JSON.stringify({uId:999,locId:1,rating:4,comment:'Good'})});
  var review = calls.find(c=>c[0].indexOf('UPDATE review')==0); assert.equal(review[1][2],7);
  assert.equal((await request('/database/action',{action:'addReview',data:'bad'})).status,400);
  process.env.ADMIN_USER_IDS='7';
  assert.equal((await request('/dashboard/')).status,200);
  assert.equal((await request('/database/action',{action:'updateNews',id:1,data:JSON.stringify({headline:'Test',news:'Text',img:'javascript:alert(1)'})})).status,400);
  assert.equal((await request('/database/action',{action:'addChillSpot',data:JSON.stringify({h1:'Test',ln:'lsk',map:'https://evil.example/maps/embed'})})).status,400);
  assert.equal((await request('/database/action',{action:'updateNews',id:1,data:JSON.stringify({headline:'Test',news:'Text',img:'images/highlights/1.jpg'})})).status,200);
  assert.equal((await request('/database/action',{action:'deleteAttraction',id:1})).status,200);
  var content = {ln:'lsk',img:'images/highlights/1.jpg',h1:'Test',h2:'Restaurant',p:'Description',details:'Details',img1:'',img2:'',img3:'',img4:'',map:'',phone:'0973000000',address:'Lusaka',site:'https://example.com',opening_hours:'Mon-Fri 09:00-17:00',activities:'Dining, Swimming'};
  for (var action of ['addChillSpot','updateChillSpot']) assert.equal((await request('/database/action',{action:action,id:1,data:JSON.stringify(content)})).status,200);
  var attraction = {name:'Test',location:'Livingstone',province:'Southern',description:'Description',significant_features:'Features',activities:'Hiking, Photography',img1:'',img2:'',img3:'',img4:'',opening_hours:'09:00-17:00',phone:'0973000000',site:'https://example.com'};
  for (var action of ['addAttraction','updateAttraction']) assert.equal((await request('/database/action',{action:action,id:1,data:JSON.stringify(attraction)})).status,200);
  await request('/logout', {});
  assert.equal((await request('/dashboard/')).status,403);
  assert.equal((await request('/login',{email:'a@b.c',password:'legacy'})).status,302);
  assert.equal((await request('/signup',{name:'New',email:'n@b.c',password:'secret123'})).status,302);
  var inserted=calls.find(c=>c[0].indexOf('INSERT INTO users')==0); assert(await bcrypt.compare('secret123',inserted[1][2]));
  assert(!fs.readFileSync('views/index.ejs','utf8').includes('alt="">s'));
  assert(fs.readFileSync('views/index.ejs','utf8').includes('<h1>Kalimba Reptile Farm</h1>\r\n  <p>Kalimba'));
  assert.equal((await request('/logout')).status,404);
  assert.equal((await request('/guest')).status,404);
  for (var i=0; i<7; i++) await request('/login',{email:'a@b.c',password:'wrong'});
  var blocked = await request('/login',{email:'a@b.c',password:'wrong'});
  assert.equal(blocked.status,429);
  console.log('PASS: CSRF missing/invalid/stale tokens, ID-only location data, 400/404 locations, login limiting, login failures, legacy/hash login, signup hashing, guest navigation, logout, admin access, review ownership, invalid review and homepage text.');
 } catch(e) {console.error(e);process.exitCode=1;} finally {server.close();}
});
