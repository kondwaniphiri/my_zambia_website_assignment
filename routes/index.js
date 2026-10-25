// Author: Kondwani Phiri
var express = require('express');
var router = express.Router();

var connectToDatabase = require('../db');

var bcrypt = require('bcrypt');






/* GET home page. */

  router.get('/', (req, res) => {

    if (typeof req.session.username == 'string' && req.session.username.length > 0) {
        res.render('index', { username: req.session.username, id: req.session.uId });
    } else {
        res.render('login');
    }
});


router.get('/chill', function(req, res, next) {

  if (typeof req.session.username == 'string' && req.session.username.length > 0) {
    res.render('chill', { username: req.session.username, id: req.session.uId });
} else {
    res.render('login');
}

});
router.post('/guest', function(req, res, next) {
  req.session.username = "Guest";
  req.session.uId = -1;
  res.render('index', { username: req.session.username, id: req.session.uId });
});


router.get('/attractions', function(req, res, next) {
  if (typeof req.session.username == 'string' && req.session.username.length > 0) {
    res.render('attractions', { username: req.session.username, id: req.session.uId });
} else {
    res.render('login');
}

});


router.get('/chilldetails', async function(req, res, next) {
  if (!req.session.username) return res.render('login');
  if (typeof req.query.id != 'string' || !/^[1-9][0-9]*$/.test(req.query.id) || !Number.isSafeInteger(Number(req.query.id))) {
    return res.status(400).send('Invalid location ID.');
  }
  var connection;
  try {
    connection = await connectToDatabase();
    var result = await connection.execute('SELECT * FROM chillspots WHERE id = ?', [req.query.id]);
    if (!result[0].length) return res.status(404).send('Location not found.');
    var location = result[0][0];
    ['h1', 'h2', 'p', 'details', 'phone', 'address'].forEach(function(field) { location[field] = location[field] || ''; });
    location.pp = location.id;
    location.uId = req.session.uId;
    location.username = req.session.username;
    res.render('chillDetails', location);
  } catch (error) {
    next(error);
  } finally {
    if (connection) await connection.end();
  }
});

router.post('/logout', function(req, res, next) {
  req.session.destroy(function(error) {
    if (error) return next(error);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Render login and signup pages
router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});
//




// Keep existing EJS forms and upgrade legacy passwords on login.
router.post('/signup', async function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var connection;
  if (typeof name != 'string' || !name.trim() || typeof email != 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password != 'string' ||
      password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).send('Enter a name, valid email and password of at least 6 characters (maximum 72 bytes).');
  }
  try {
    connection = await connectToDatabase();
    var existing = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0].length) return res.status(409).send('An account with this email already exists.');
    var hash = await bcrypt.hash(password, 12);
    await connection.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name.trim(), email, hash]);
    res.redirect('/login');
  } catch (error) {
    if (error.code == 'ER_DUP_ENTRY') return res.status(409).send('An account with this email already exists.');
    console.error('Signup failed:', error.code || 'unknown error');
    res.status(500).send('Error signing up');
  } finally {
    if (connection) await connection.end();
  }
});

router.post('/login', require('../middleware/security').loginLimiter(), async function(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  var connection;
  if (typeof email != 'string' || typeof password != 'string' || !email || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(401).render('login', { error: 'Invalid email or password.' });
  }
  try {
    connection = await connectToDatabase();
    var result = await connection.execute('SELECT id, name, password FROM users WHERE email = ?', [email]);
    var user = result[0][0];
    var hashed = user && /^\$2[aby]\$/.test(user.password);
    var valid = user && (hashed ? await bcrypt.compare(password, user.password) : password === user.password);
    if (!valid) return res.status(401).render('login', { error: 'Invalid email or password.' });
    if (!hashed) {
      var hash = await bcrypt.hash(password, 12);
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
    }
    req.session.regenerate(function(error) {
      if (error) return next(error);
      req.session.username = user.name;
      req.session.uId = user.id;
      res.redirect('/');
    });
  } catch (error) {
    console.error('Login failed:', error.code || 'unknown error');
    res.status(500).send('Error logging in');
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
