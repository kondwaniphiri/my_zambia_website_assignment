// Author: Kondwani Phiri
require('./config/env');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');


var indexRouter = require('./routes/index');
var database = require('./routes/database');
// var newRoot = require('./routes/newRoot');





if (process.env.NODE_ENV == 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_STORE == 'memory')) {
  throw new Error('Production requires SESSION_SECRET and the MySQL session store.');
}
var app = express();
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY.split(',').map(function(value) { return value.trim(); }));


app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
    store: process.env.SESSION_STORE == 'memory' ? undefined : new (require('./middleware/mysql-store').SessionStore)(),
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV == 'production' },
    resave: false,
    saveUninitialized: false,
}));



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


logger.token('safe-url', function(req) { return req.originalUrl.replace(/([?&]token=)[^&]*/g, '$1[redacted]'); });
app.use(logger(':method :safe-url :status :response-time ms'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
  res.locals.safeUrl = require('./public/javascripts/content').safeUrl;
  res.locals.isAdmin = Number(req.session.uId) > 0 && (process.env.ADMIN_USER_IDS || '').split(',').indexOf(String(req.session.uId)) != -1;
  next();
});
app.use(require('./middleware/security').csrf);
app.engine('html', require('ejs').renderFile);

app.use('/', indexRouter);
app.use('/database', database);
app.use('/email', require('./routes/email'));
app.get('/contact', function(req, res) { res.render('contact', {username:req.session.username || 'Visitor'}); });
app.use('/dashboard', function(req, res, next) {
  var ids = (process.env.ADMIN_USER_IDS || '').split(',');
  if (!(Number(req.session.uId) > 0) || ids.indexOf(String(req.session.uId)) == -1) {
    return res.status(403).send('Log in with an administrator account to access the dashboard.');
  }
  next();
}, function(req, res, next) {
  if (req.path == '/' || req.path == '/index.html') {
    if (req.baseUrl == '/dashboard' && req.path == '/' && !req.originalUrl.split('?')[0].endsWith('/')) return res.redirect('/dashboard/');
    return res.render(path.join(__dirname, 'dashboard/index.html'));
  }
  next();
}, express.static(path.join(__dirname, 'dashboard'), { index: false }));
// app.use('/newRoot', newRoot);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
