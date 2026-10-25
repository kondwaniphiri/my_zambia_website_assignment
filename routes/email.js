// Author: Kondwani Phiri
﻿var express = require('express');
var router = express.Router();
var connect = require('../db');
var mail = require('../services/mail');
var limiter = require('../middleware/security').loginLimiter({maximum:5,windowMs:60*60*1000,prefix:'email:'});
function reply(req,res,status,message) {
    if (req.accepts(['html','json']) == 'html' && !req.xhr) return res.status(status).render('email-status',{message:message,action:'',token:''});
    return res.status(status).json({message:message,error:status >= 400 ? message : undefined});
}
function clean(value, maximum, multiline) {
    return typeof value == 'string' && value.trim().length > 0 && value.length <= maximum && (multiline || !/[\r\n]/.test(value));
}
function validToken(token) {return typeof token == 'string' && /^[a-f0-9]{64}$/.test(token);}
router.post('/subscribe',limiter,async function(req,res,next) {
    if (req.body.website) return reply(req,res,200,'If your address needs confirmation, you will receive an email.');
    var email = typeof req.body.email == 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!mail.validEmail(email) || req.body.consent != 'yes') return reply(req,res,400,'Enter a valid email and agree to receive the newsletter.');
    if (!mail.configured()) return reply(req,res,503,'Newsletter sign-up is temporarily unavailable. Please try again later.');
    var connection;
    try {
        connection = await connect();
        await connection.beginTransaction();
        var token=mail.token();
        await connection.execute('INSERT INTO newsletter_subscribers (email, unsubscribe_token, requested_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE email=VALUES(email)',[email,mail.token(),0]);
        var subscriber=(await connection.execute('SELECT * FROM newsletter_subscribers WHERE email=? FOR UPDATE',[email]))[0][0];
        if(subscriber.status != 'active' && Number(subscriber.requested_at) < Date.now()-600000) {
            await connection.execute("UPDATE newsletter_subscribers SET status='pending',confirm_hash=?,confirm_expires=?,requested_at=?,confirmed_at=NULL WHERE id=?",[mail.hash(token),Date.now()+86400000,Date.now(),subscriber.id]);
            await mail.queue(connection,'confirmation',email,{subject:'Confirm your My Zambia newsletter subscription',text:'Please confirm your newsletter subscription using the link below. The link expires in 24 hours.\n\n'+mail.baseUrl()+'/email/confirm?token='+token+'\n\nIf you did not request this, ignore this email.'},subscriber.id,null);
        }
        await connection.commit();
        reply(req,res,200,'If your address needs confirmation, you will receive an email.');
    } catch(error) {if(connection) await connection.rollback();next(error);}
    finally {if(connection)await connection.end();}
});
router.post('/contact',limiter,async function(req,res,next) {
    if(req.body.website) return reply(req,res,200,'Your message has been received.');
    var body=req.body;
    if(!clean(body.name,100) || !mail.validEmail(body.email) || !clean(body.subject,150) || !clean(body.message,10000,true)) return reply(req,res,400,'Enter your name, email, subject and message.');
    var connection;
    try {
        connection=await connect();
        await connection.beginTransaction();
        await connection.execute('INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)',[body.name.trim(),body.email.trim(),body.subject.trim(),body.message.trim()]);
        if(mail.configured() && mail.validEmail(process.env.CONTACT_TO)) await mail.queue(connection,'contact',process.env.CONTACT_TO,{subject:'My Zambia: '+body.subject.trim(),replyTo:body.email.trim(),text:'From: '+body.name.trim()+' <'+body.email.trim()+'>\n\n'+body.message.trim()});
        await connection.commit();
        reply(req,res,200,'Your message has been received.');
    } catch(error) {if(connection)await connection.rollback();next(error);}
    finally {if(connection)await connection.end();}
});
router.get(['/confirm','/unsubscribe'],async function(req,res,next) {
    res.set('Referrer-Policy','no-referrer');
    var action=req.path=='/confirm'?'confirm':'unsubscribe';
    if(!validToken(req.query.token)) return res.status(400).render('email-status',{message:'This link is invalid or has expired.',action:'',token:''});
    var connection;
    try {
        connection=await connect();
        var sql=action=='confirm' ? "SELECT id FROM newsletter_subscribers WHERE confirm_hash=? AND confirm_expires>? AND status='pending'" : 'SELECT id FROM newsletter_subscribers WHERE unsubscribe_token=?';
        var values=action=='confirm'?[mail.hash(req.query.token),Date.now()]:[req.query.token];
        var rows=(await connection.execute(sql,values))[0];
        res.status(rows.length?200:400).render('email-status',{message:rows.length?(action=='confirm'?'Confirm your My Zambia newsletter subscription.':'Unsubscribe from the My Zambia newsletter?'):'This link is invalid or has expired.',action:rows.length?action:'',token:req.query.token});
    } catch(error){next(error);}finally{if(connection)await connection.end();}
});
router.post('/confirm',async function(req,res,next) {
    if(!validToken(req.body.token))return reply(req,res,400,'This link is invalid or has expired.');
    var connection;
    try {
        connection=await connect();
        var result=await connection.execute("UPDATE newsletter_subscribers SET status='active',confirmed_at=CURRENT_TIMESTAMP,confirm_hash=NULL,confirm_expires=NULL WHERE confirm_hash=? AND confirm_expires>? AND status='pending'",[mail.hash(req.body.token),Date.now()]);
        reply(req,res,result[0].affectedRows?200:400,result[0].affectedRows?'Your newsletter subscription is confirmed.':'This link is invalid or has expired.');
    } catch(error){next(error);}finally{if(connection)await connection.end();}
});
router.post('/unsubscribe',async function(req,res,next) {
    if(!validToken(req.body.token))return reply(req,res,400,'This link is invalid.');
    var connection;
    try {
        connection=await connect();
        await connection.beginTransaction();
        await connection.execute("UPDATE newsletter_subscribers SET status='unsubscribed',confirm_hash=NULL,confirm_expires=NULL WHERE unsubscribe_token=?",[req.body.token]);
        await connection.execute("UPDATE email_outbox o JOIN newsletter_subscribers s ON s.id=o.subscriber_id SET o.status='skipped' WHERE s.unsubscribe_token=? AND o.kind='newsletter' AND o.status IN ('queued','failed')",[req.body.token]);
        await connection.commit();
        reply(req,res,200,'You have been unsubscribed.');
    } catch(error){if(connection)await connection.rollback();next(error);}finally{if(connection)await connection.end();}
});
router.use('/admin',function(req,res,next) {
    var ids=(process.env.ADMIN_USER_IDS || '').split(',');
    if(!(Number(req.session.uId)>0) || ids.indexOf(String(req.session.uId))==-1)return res.status(403).json({error:'Administrator access required.'});
    next();
});
router.get('/admin/overview',async function(req,res,next) {
    var connection;
    try {
        connection=await connect();
        var contacts=(await connection.execute('SELECT id,name,email,subject,message,created_at FROM contact_messages ORDER BY id DESC LIMIT 100'))[0];
        var subscribers=(await connection.execute("SELECT COUNT(*) AS total FROM newsletter_subscribers WHERE status='active'"))[0][0].total;
        var campaigns=(await connection.execute("SELECT c.id,c.subject,c.body,c.status,c.created_at,COUNT(o.id) AS recipients,SUM(o.status='sent') AS sent,SUM(o.status='failed') AS failed FROM newsletter_campaigns c LEFT JOIN email_outbox o ON o.campaign_id=c.id GROUP BY c.id ORDER BY c.id DESC LIMIT 20"))[0];
        res.json({configured:mail.configured(),contactForwarding:mail.configured() && mail.validEmail(process.env.CONTACT_TO),contacts:contacts,subscribers:subscribers,campaigns:campaigns});
    } catch(error){next(error);}finally{if(connection)await connection.end();}
});
router.post('/admin/campaigns',async function(req,res,next) {
    if(!clean(req.body.subject,150)||!clean(req.body.body,20000,true))return res.status(400).json({error:'Enter a subject (up to 150 characters) and message (up to 20,000 characters).'});
    var connection;
    try {
        connection=await connect();
        var result=await connection.execute('INSERT INTO newsletter_campaigns (subject,body) VALUES (?,?)',[req.body.subject.trim(),req.body.body.trim()]);
        res.json({id:result[0].insertId,message:'Draft saved.'});
    } catch(error){next(error);}finally{if(connection)await connection.end();}
});
router.post('/admin/campaigns/:id/send',async function(req,res,next) {
    if(!/^[1-9][0-9]*$/.test(req.params.id))return res.status(400).json({error:'Invalid campaign.'});
    if(!mail.configured())return res.status(503).json({error:'Fill in the email settings before sending newsletters.'});
    var connection;
    try {
        connection=await connect();
        await connection.beginTransaction();
        var campaign=(await connection.execute('SELECT * FROM newsletter_campaigns WHERE id=? FOR UPDATE',[req.params.id]))[0][0];
        if(!campaign || campaign.status!='draft'){await connection.rollback();return res.status(409).json({error:'This draft is unavailable or already queued.'});}
        var subscribers=(await connection.execute("SELECT id,email,unsubscribe_token FROM newsletter_subscribers WHERE status='active'"))[0];
        if(!subscribers.length){await connection.rollback();return res.status(400).json({error:'There are no confirmed subscribers yet.'});}
        for(var i=0;i<subscribers.length;i++) {
            var subscriber=subscribers[i];
            var unsubscribe=mail.baseUrl()+'/email/unsubscribe?token='+subscriber.unsubscribe_token;
            await mail.queue(connection,'newsletter',subscriber.email,{subject:campaign.subject,text:campaign.body+'\n\nUnsubscribe: '+unsubscribe,unsubscribe:unsubscribe},subscriber.id,campaign.id);
        }
        await connection.execute("UPDATE newsletter_campaigns SET status='queued' WHERE id=?",[campaign.id]);
        await connection.commit();
        res.json({message:'Newsletter queued for '+subscribers.length+' confirmed subscribers.'});
    } catch(error){if(connection)await connection.rollback();next(error);}finally{if(connection)await connection.end();}
});
module.exports=router;
