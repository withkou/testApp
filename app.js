var createError = require('http-errors');
var mysql = require('mysql');
var session = require('express-session');

//db connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'testtest',
  database: 'testapp'
});

//db connection error check
connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});



var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

//db connection test
// app.get('/', (req, res) => {
//   connection.query(
//     'SELECT * FROM users',
//     (error, results) => {
//       console.log(results);
//       res.render('hello.ejs');
//     }
//   );
// });

module.exports = app;

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
)

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = 'GUEST';
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/contents', (req, res) => {
  connection.query(
    'SELECT * FROM contents',
    (error, results) => {
      res.render('contents.ejs', { contents: results });
    }
  );
});

app.get('/page/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM contents WHERE id = ?',
    [id],
    (error, results) => {
      res.render('page.ejs', { contents: results[0] });
    }
  );
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs',{errors:[]});
});

//user registration
app.post('/signup',
(req, res, next) => {
  const username=req.body.username;
  const email = req.body.email;
  const password=req.body.password;
  //error check
  const errors=[];
  if(username===''){
    errors.push('ユーザー名を入力してください');
  }
    if(email===''){
    errors.push('メールアドレスを入力してください');
  }
    if(password===''){
    errors.push('パスワードを入力してください');
  }
  console.log(errors);
  if(errors.length>0){
    res.render('signup.ejs',{errors:errors});
  }else{
    next();
  }
},
(req, res, next) => {
  //email check
  const email=req.body.email;
  const errors=[];
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {

        errors.push('このメールアドレスは既に登録されています');
        res.render('signup.ejs',{errors:errors});

      } else {
        next();


      }
    }
  );

},
(req,res)=>{
  connection.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password],
    (error, results) => {
      req.session.userId=results.insertId;
      req.session.username=username;
      res.redirect('/contents');
    }
  );
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {
        if (req.body.password === results[0].password){
          req.session.userId = results[0].id;
          req.session.username = results[0].username;
          res.redirect('/contents');
        } else {
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
    }
  );
});

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/contents');
  });
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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//local open
app.listen(3000);