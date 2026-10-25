// Author: Kondwani Phiri
var session = require('express-session');
var util = require('util');
var crypto = require('crypto');
var connectToDatabase = require('../db');

function SessionStore() { session.Store.call(this); }
util.inherits(SessionStore, session.Store);
function expiry(value) {
  return value.cookie && value.cookie.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 86400000;
}
function query(sql, values, callback) {
  (async function() {
    var connection = await connectToDatabase();
    try { return (await connection.execute(sql, values))[0]; }
    finally { await connection.end(); }
  })().then(function(rows) { callback(null, rows); }, callback);
}
SessionStore.prototype.get = function(id, callback) {
  query('SELECT data FROM app_sessions WHERE sid = ? AND expires > ?', [id, Date.now()], function(error, rows) {
    if (error) return callback(error);
    try { callback(null, rows.length ? JSON.parse(rows[0].data) : null); }
    catch (error) { callback(error); }
  });
};
SessionStore.prototype.set = function(id, value, callback) {
  query('INSERT INTO app_sessions (sid, data, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), expires = VALUES(expires)',
    [id, JSON.stringify(value), expiry(value)], callback || function() {});
};
SessionStore.prototype.destroy = function(id, callback) {
  query('DELETE FROM app_sessions WHERE sid = ?', [id], callback || function() {});
};
SessionStore.prototype.touch = function(id, value, callback) {
  query('UPDATE app_sessions SET expires = ? WHERE sid = ?', [expiry(value), id], callback || function() {});
};

// A row lock makes the limit shared and atomic across app processes.
exports.consumeLogin = async function(ip, maximum, windowMs) {
  var connection = await connectToDatabase();
  var now = Date.now();
  var key = crypto.createHash('sha256').update(ip).digest('hex');
  try {
    await connection.beginTransaction();
    await connection.execute('INSERT INTO login_limits (bucket_key, attempts, expires) VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE bucket_key = VALUES(bucket_key)', [key, now + windowMs]);
    var result = await connection.execute('SELECT attempts, expires FROM login_limits WHERE bucket_key = ? FOR UPDATE', [key]);
    var bucket = result[0][0];
    if (Number(bucket.expires) <= now) bucket = { attempts: 0, expires: now + windowMs };
    var allowed = bucket.attempts < maximum;
    if (allowed) await connection.execute('UPDATE login_limits SET attempts = ?, expires = ? WHERE bucket_key = ?', [bucket.attempts + 1, bucket.expires, key]);
    await connection.commit();
    return { allowed: allowed, retryAfter: Math.max(1, Math.ceil((Number(bucket.expires) - now) / 1000)) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { await connection.end(); }
};
exports.SessionStore = SessionStore;
