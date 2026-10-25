// Author: Kondwani Phiri
﻿var assert = require('assert');
var storeModule = require('./middleware/mysql-store');
var connect = require('./db');
var taskCrypto = require('crypto');
(async function() {
 var store1 = new storeModule.SessionStore();
 var store2 = new storeModule.SessionStore();
 var id = 'verification-' + taskCrypto.randomBytes(12).toString('hex');
 var ip = 'verification-' + id;
 var c = await connect();
 try {
  await new Promise(function(resolve,reject){store1.set(id,{cookie:{expires:new Date(Date.now()+60000)},username:'Persisted test'},function(e){e?reject(e):resolve();});});
  var session = await new Promise(function(resolve,reject){store2.get(id,function(e,value){e?reject(e):resolve(value);});});
  assert.equal(session.username,'Persisted test');
  var limits = await Promise.allSettled(Array.from({length:5},function(){return storeModule.consumeLogin(ip,2,60000);}));
  limits.forEach(function(result){if(result.status=='rejected') throw result.reason;});
  assert.equal(limits.filter(function(r){return r.value.allowed;}).length,2);
  assert.equal((await storeModule.consumeLogin(ip,2,60000)).allowed,false);
  var counts=(await c.query("SELECT 'users' AS name, COUNT(*) AS count FROM users UNION ALL SELECT 'attractions', COUNT(*) FROM attractions UNION ALL SELECT 'chillspots', COUNT(*) FROM chillspots UNION ALL SELECT 'reviews', COUNT(*) FROM review"))[0];
  console.log('Live database counts:',counts);
  var users=(await c.query('SELECT password FROM users'))[0];assert(users.every(function(u){return /^\$2[aby]\$/.test(u.password);}));
  await c.beginTransaction();
  var existing=(await c.query('SELECT userId, locationId FROM review LIMIT 1'))[0][0];
  await assert.rejects(c.execute('INSERT INTO review (userId, locationId, rating, comment) VALUES (?, ?, 4, ?)',[existing.userId,existing.locationId,'verification']),function(e){return e.code=='ER_DUP_ENTRY';});
  var pair=(await c.query('SELECT u.id AS userId, l.id AS locationId FROM users u CROSS JOIN chillspots l LEFT JOIN review r ON r.userId=u.id AND r.locationId=l.id WHERE r.userId IS NULL LIMIT 1'))[0][0];
  await assert.rejects(c.execute('INSERT INTO review (userId, locationId, rating, comment) VALUES (?, ?, 0, ?)',[pair.userId,pair.locationId,'verification']),function(e){return e.code=='ER_CHECK_CONSTRAINT_VIOLATED';});
  await assert.rejects(c.execute('INSERT INTO review (userId, locationId, rating, comment) VALUES (2147483647, ?, 4, ?)',[pair.locationId,'verification']),function(e){return e.code=='ER_NO_REFERENCED_ROW_2';});
  await c.rollback();
  console.log('PASS: MySQL session persistence, concurrent shared login limits, hashed passwords, unique reviews, foreign keys and rating constraint.');
 } finally {
  await c.rollback();
  await c.execute('DELETE FROM app_sessions WHERE sid = ?',[id]);
  await c.execute('DELETE FROM login_limits WHERE bucket_key = ?',[taskCrypto.createHash('sha256').update(ip).digest('hex')]);
  await c.end();
 }
})().catch(function(e){console.error(e);process.exitCode=1;});
