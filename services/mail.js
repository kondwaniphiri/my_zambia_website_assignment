// Author: Kondwani Phiri
require('../config/env');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var transport;
function validEmail(value) { return typeof value == 'string' && value.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value); }
function baseUrl() {
  try {
    var url = new URL(process.env.PUBLIC_BASE_URL);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    if (process.env.NODE_ENV == 'production' && url.protocol != 'https:') return '';
    return url.href.replace(/\/$/, '');
  } catch (error) { return ''; }
}
function configured() {
  var port=Number(process.env.SMTP_PORT);
  return !!(process.env.SMTP_HOST && Number.isInteger(port) && port > 0 && port <= 65535 && validEmail(process.env.SMTP_FROM) && baseUrl() && (!process.env.SMTP_USER || process.env.SMTP_PASS));
}
function getTransport() {
  if (!configured()) throw new Error('MAIL_NOT_CONFIGURED');
  if (!transport) transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE == 'true' : Number(process.env.SMTP_PORT) == 465,
    requireTLS: true,
    auth: process.env.SMTP_USER ? {user:process.env.SMTP_USER, pass:process.env.SMTP_PASS} : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    disableFileAccess: true, disableUrlAccess: true
  });
  return transport;
}
exports.send = async function(job) {
  if (!validEmail(job.recipient)) throw new Error('INVALID_RECIPIENT');
  var message = job.payload;
  if (typeof message == 'string') message = JSON.parse(message);
  return getTransport().sendMail({
    from: {name:'My Zambia', address:process.env.SMTP_FROM}, to:job.recipient,
    replyTo: validEmail(message.replyTo) ? message.replyTo : undefined,
    subject: message.subject, text:message.text,
    headers: message.unsubscribe ? {'List-Unsubscribe':'<' + message.unsubscribe + '>'} : undefined,
    disableFileAccess: true, disableUrlAccess: true
  });
};
exports.validEmail = validEmail;
exports.configured = configured;
exports.baseUrl = baseUrl;
exports.hash = function(token) {return crypto.createHash('sha256').update(token).digest('hex');};
exports.token = function() {return crypto.randomBytes(32).toString('hex');};
exports.queue = async function(connection, kind, recipient, payload, subscriberId, campaignId) {
  await connection.execute('INSERT INTO email_outbox (kind, recipient, payload, subscriber_id, campaign_id) VALUES (?, ?, ?, ?, ?)',
    [kind, recipient, JSON.stringify(payload), subscriberId || null, campaignId || null]);
};
