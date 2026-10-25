// Author: Kondwani Phiri
var crypto = require('crypto');

exports.csrf = function(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  res.set('Cache-Control', 'no-store');
  if (['GET', 'HEAD', 'OPTIONS'].indexOf(req.method) == -1) {
    var token = req.get('X-CSRF-Token') || (req.body && req.body._csrf);
    var expected = req.session.csrfToken;
    if (typeof token != 'string' || !/^[a-f0-9]{64}$/.test(token) || token.length != expected.length ||
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return res.status(403).json({ error: 'Your form has expired. Reload the page and try again.' });
    }
  }
  next();
};

// Bound memory use; expired buckets are removed on each login attempt.
exports.loginLimiter = function(options) {
  options = options || {};
  var attempts = new Map();
  var windowMs = options.windowMs || 15 * 60 * 1000;
  var maximum = options.maximum || 10;
  return function(req, res, next) {
    if (process.env.SESSION_STORE != 'memory') {
      return require('./mysql-store').consumeLogin((options.prefix || '') + req.ip, maximum, windowMs).then(function(result) {
        if (!result.allowed) {
          res.set('Retry-After', String(result.retryAfter));
          return res.status(429).send('Too many login attempts. Please try again later.');
        }
        next();
      }, next);
    }
    var now = Date.now();
    attempts.forEach(function(bucket, key) {
      if (bucket.until <= now) attempts.delete(key);
    });
    var key = (options.prefix || '') + req.ip;
    var bucket = attempts.get(key);
    if (!bucket) {
      if (attempts.size >= 10000) {
        res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
        return res.status(429).send('Too many login attempts. Please try again later.');
      }
      bucket = { count: 0, until: now + windowMs };
      attempts.set(key, bucket);
    }
    if (bucket.count >= maximum) {
      res.set('Retry-After', String(Math.ceil((bucket.until - now) / 1000)));
      return res.status(429).send('Too many login attempts. Please try again later.');
    }
    bucket.count++;
    next();
  };
};
