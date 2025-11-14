var express = require('express');
var router = express.Router();

var connectToDatabase = require('../db');

var app = express();






/* GET home page. */

  router.get('/', (req, res) => {
    console.log(req.session.username)
    if (req.session.hasOwnProperty('username') && (!(req.session.username == "Guest") || !(req.session.username = ""))) {
        res.render('index', { username: req.session.username, id: req.session.uId });
    } else {
        res.render('login');
    }
});


router.get('/chill', function(req, res, next) {
  console.log(req.session.username)
  if (req.session.hasOwnProperty('username') && (!(req.session.username == "Guest") || !(req.session.username = ""))) {
    res.render('chill', { username: req.session.username, id: req.session.uId });
} else {
    res.render('login');
}

});
router.get('/guest', function(req, res, next) {
  req.session.username = "Guest";
  req.session.uId = -1;
  res.render('index', { username: req.session.username, id: req.session.uId });
});


router.get('/attractions', function(req, res, next) {
  if (req.session.hasOwnProperty('username') && (!(req.session.username == "Guest") || !(req.session.username = ""))) {
    res.render('attractions', { username: req.session.username, id: req.session.uId });
} else {
    res.render('login');
}

});


router.get('/chilldetails', function(req, res, next) {

  const {id,ln,img,h1,h2,p,details,img1,img2,img3,img4,map,phone,address,site} = req.query;
  let uId = req.session.uId
  let username = req.session.username
  let pp = id;

  if (req.session.hasOwnProperty('username') && (!(req.session.username == "Guest") || !(req.session.username = ""))) {
    res.render('chilldetails',{pp,ln,img,h1,h2,p,details,img1,img2,img3,img4,map,phone,address,site, uId, username});
  } else {
    res.render('login');
 }
  
});

router.get('/logout',function(req, res, next){
  req.session.uId = "";
  req.session.username = "";
  res.render('login')
})






// Render login and signup pages
router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});
//




// Handle signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
      const connection = await connectToDatabase();

      // Insert user into database
      await connection.execute(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
          [name, email, password]
      );

      res.redirect('/login');
  } catch (error) {
      console.error('Signup error:', error);
      res.status(500).send('Error signing up');
  }
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, password} = req.body;
  try {
      const connection = await connectToDatabase();
      // Retrieve user from database
      const [rows] = await connection.execute('SELECT * FROM users');
      console.log(email,password)

      for(let i = 0; i<rows.length; i++){

          if (email == rows[i].email && password == rows[i].password) {
              // Password matches, login successful
              let username  = rows[i].name;
              let id  = rows[i].id;
              req.session.username = username;
              req.session.uId = id;
              res.render('index', {username: req.session.username, id: req.session.id}  ); // or whatever the next page should be
              break;
          }
      }

      
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).send('Error logging in');
  }
});

module.exports = router;
