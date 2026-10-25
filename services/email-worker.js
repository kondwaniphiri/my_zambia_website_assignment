// Author: Kondwani Phiri
﻿var connect = require('../db');
var mail = require('./mail');
var busy = false;
exports.process = async function(limit) {
  if (!mail.configured() || busy) return {processed:0};
  busy = true;
  var connection;
  var processed = 0;
  try {
    connection = await connect();
    for (var i=0;i<(limit || 10);i++) {
      await connection.beginTransaction();
      var result = await connection.execute("SELECT * FROM email_outbox WHERE attempts < 5 AND ((status IN ('queued','failed') AND available_at <= ?) OR (status = 'sending' AND locked_until < ?)) ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED", [Date.now(),Date.now()]);
      var job = result[0][0];
      if (!job) {await connection.commit();break;}
      await connection.execute("UPDATE email_outbox SET status='sending', attempts=attempts+1, locked_until=? WHERE id=?",[Date.now()+120000,job.id]);
      await connection.commit();
      try {
        if (job.kind == 'newsletter') {
          var subscriber = (await connection.execute('SELECT status FROM newsletter_subscribers WHERE id=?',[job.subscriber_id]))[0][0];
          if (!subscriber || subscriber.status != 'active') {
            await connection.execute("UPDATE email_outbox SET status='skipped', locked_until=NULL WHERE id=?",[job.id]);
            continue;
          }
        }
        await mail.send(job);
        await connection.execute("UPDATE email_outbox SET status='sent', sent_at=CURRENT_TIMESTAMP, locked_until=NULL, last_error=NULL WHERE id=?",[job.id]);
      } catch(error) {
        await connection.execute("UPDATE email_outbox SET status='failed', available_at=?, locked_until=NULL, last_error=? WHERE id=?",[Date.now()+Math.min(3600000,60000*Math.pow(2,job.attempts)),String(error.code || 'DELIVERY_FAILED').slice(0,100),job.id]);
      }
      processed++;
    }
    return {processed:processed};
  } catch(error) {
    if(connection) await connection.rollback();
    throw error;
  } finally {if(connection) await connection.end();busy=false;}
};
exports.start = function() {
  if (!mail.configured()) return;
  var run=function(){exports.process(10).catch(function(error){console.error('Email worker failed:',error.code || 'unknown error');});};
  run();
  var timer=setInterval(run,30000);
  timer.unref();
};
