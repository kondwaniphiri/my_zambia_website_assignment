// Author: Kondwani Phiri
﻿require('./config/env');
var assert=require('assert');
var mysql=require('mysql2/promise');
var taskCrypto=require('crypto');
var bcrypt=require('bcrypt');
var realConnect=require('./db');
var transportOptions;
var messages=[];
var failDelivery=false;
require('nodemailer').createTransport=function(options){transportOptions=options;return {sendMail:async function(message){assert(message.to.endsWith('.invalid'));if(failDelivery){var e=new Error('Simulated failure');e.code='ESOCKET';throw e;}messages.push(message);return {messageId:'test-id'};}};};
process.env.SESSION_STORE='memory';
process.env.ADMIN_USER_IDS='1';
process.env.SMTP_HOST='';
var schema='myzambia_email_test_'+taskCrypto.randomBytes(6).toString('hex');
var connection;
var server;
(async function(){
 connection=await realConnect();
 await connection.query('CREATE DATABASE `'+schema+'` CHARACTER SET utf8mb4');
 for(var table of ['users','newsletter_subscribers','contact_messages','newsletter_campaigns','email_outbox']){
  var create=(await connection.query('SHOW CREATE TABLE `'+table+'`'))[0][0]['Create Table'];
  await connection.query('USE `'+schema+'`');
  await connection.query(create);
  await connection.query('USE `'+(process.env.DB_NAME || 'myzambia')+'`');
 }
 await connection.query('USE `'+schema+'`');
 await connection.execute('INSERT INTO users (id,name,email,password) VALUES (1,?,?,?)',['Email Tester','admin@example.invalid',await bcrypt.hash('test-password',10)]);
 require.cache[require.resolve('./db')].exports=async function(){var c=await realConnect();await c.changeUser({database:schema});return c;};
 var app=require('./app');
 server=app.listen(0,'127.0.0.1');
 await new Promise(function(resolve){server.once('listening',resolve);});
 var base='http://127.0.0.1:'+server.address().port;
 var cookie='';
 async function request(path,data,unsafe){
  if(data && !unsafe){var page=await request('/login');data=Object.assign({},data,{_csrf:page.text.match(/name="csrf-token" content="([a-f0-9]+)"/)[1]});}
  var r=await fetch(base+path,{method:data?'POST':'GET',redirect:'manual',headers:Object.assign({Cookie:cookie,Accept:'application/json'},data?{'Content-Type':'application/x-www-form-urlencoded'}:{}),body:data?new URLSearchParams(data):undefined});
  if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
  var text=await r.text();var json;try{json=JSON.parse(text);}catch(e){}return {status:r.status,text:text,json:json};
 }
 assert.equal((await request('/email/contact',{name:'Test'},true)).status,403);
 assert.equal((await request('/email/admin/overview')).status,403);
 assert.equal((await request('/email/subscribe',{email:'reader@example.invalid',consent:'yes'})).status,503);
 assert.equal((await request('/email/contact',{name:'Reader',email:'reader@example.invalid',subject:'Test question',message:'<script>test</script> Message stored while SMTP is off.'})).status,200);
 assert.equal((await connection.query('SELECT COUNT(*) AS total FROM contact_messages'))[0][0].total,1);
 assert.equal((await connection.query('SELECT COUNT(*) AS total FROM email_outbox'))[0][0].total,0);
 process.env.SMTP_HOST='smtp.example.invalid';process.env.SMTP_PORT='587';process.env.SMTP_FROM='sender@example.invalid';process.env.PUBLIC_BASE_URL='https://example.invalid';
 assert.equal((await request('/email/subscribe',{email:'reader@example.invalid',consent:'yes'})).status,200);
 assert.equal((await request('/email/subscribe',{email:'reader@example.invalid',consent:'yes'})).status,200);
 assert.equal((await request('/email/subscribe',{email:'other@example.invalid'})).status,400);
 assert.equal((await request('/email/contact',{name:'Reader',email:'reader@example.invalid',subject:'Test',message:'Rate limit'})).status,429);
 var worker=require('./services/email-worker');
 await worker.process(10);assert.equal(messages.length,1);assert(transportOptions.requireTLS);assert(transportOptions.disableFileAccess);
 var token=messages[0].text.match(/\/email\/confirm\?token=([a-f0-9]+)/)[1];
 var confirmPage=await request('/email/confirm?token='+token);assert.equal(confirmPage.status,200);
 assert.equal((await connection.query('SELECT status FROM newsletter_subscribers'))[0][0].status,'pending');
 await connection.execute('UPDATE newsletter_subscribers SET confirm_expires=?',[Date.now()-1]);
 assert.equal((await request('/email/confirm',{token:token})).status,400);
 await connection.execute('UPDATE newsletter_subscribers SET confirm_expires=?',[Date.now()+60000]);
 assert.equal((await request('/email/confirm',{token:token})).status,200);
 assert.equal((await request('/email/confirm',{token:token})).status,400);
 await connection.execute("INSERT INTO newsletter_subscribers (email,status,unsubscribe_token,requested_at) VALUES (?,'active',?,?)",['second@example.invalid',taskCrypto.randomBytes(32).toString('hex'),Date.now()]);
 assert.equal((await request('/login',{email:'admin@example.invalid',password:'test-password'})).status,302);
 var overview=await request('/email/admin/overview');assert.equal(overview.json.contacts.length,1);assert.equal(overview.json.subscribers,2);
 var draft=await request('/email/admin/campaigns',{subject:'Test newsletter',body:'A plain-text update.'});assert.equal(draft.status,200);
 assert.equal((await request('/email/admin/campaigns/'+draft.json.id+'/send',{})).status,200);
 assert.equal((await request('/email/admin/campaigns/'+draft.json.id+'/send',{})).status,409);
 var unsubscribe=(await connection.query('SELECT unsubscribe_token FROM newsletter_subscribers WHERE email=?',['reader@example.invalid']))[0][0].unsubscribe_token;
 assert.equal((await request('/email/unsubscribe?token='+unsubscribe)).status,200);
 assert.equal((await connection.query('SELECT status FROM newsletter_subscribers WHERE email=?',['reader@example.invalid']))[0][0].status,'active');
 assert.equal((await request('/email/unsubscribe',{token:unsubscribe})).status,200);
 await worker.process(10);assert.equal(messages.length,2);assert.equal(messages[1].to,'second@example.invalid');assert(messages[1].text.includes('/email/unsubscribe?token='));assert(!messages[1].text.includes('reader@example.invalid'));
 draft=await request('/email/admin/campaigns',{subject:'Retry test',body:'Retry this message.'});await request('/email/admin/campaigns/'+draft.json.id+'/send',{});
 failDelivery=true;await worker.process(10);assert.equal((await connection.query("SELECT COUNT(*) AS total FROM email_outbox WHERE status='failed'"))[0][0].total,1);
 failDelivery=false;await connection.query("UPDATE email_outbox SET available_at=0 WHERE status='failed'");await worker.process(10);assert.equal(messages.length,3);
 console.log('PASS: contact storage, disabled SMTP, CSRF/admin/rate limits, confirmation expiry, duplicate signups/sends, unsubscribe suppression, per-recipient delivery and retries. No real emails sent.');
})().catch(function(error){console.error(error);process.exitCode=1;}).finally(async function(){
 if(server)await new Promise(function(resolve){server.close(resolve);});
 if(connection){if(/^myzambia_email_test_[a-f0-9]+$/.test(schema))await connection.query('DROP DATABASE `'+schema+'`');await connection.end();}
});
