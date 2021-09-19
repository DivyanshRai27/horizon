const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport')
const path = require('path')
const passportLocalMongoose = require('passport-local-mongoose')
const {ObjectId} = mongoose.Schema.Types
const { sendWelcomeEmail } = require('./emails/account')

const PUBLISHABLE_KEY = "pk_test_51HpUq1Ir2OHN0cMQXsWMaY4vRwVs1LWj5glXkyyAx8CpViYKOccjgF5iBK7l7UqhFShWT8g5AVUHdmZlRKQp1MPx00kNeASVVm"

const SECRET_KEY = "sk_test_51HpUq1Ir2OHN0cMQ5naE1ekcQcqKCpAX5wreNu9YnSrbe4lD0MtgIPI39jTOYilE2ASZwo4dXxj92UvRa6vGJx9p00hgtriYdh"

const stripe = require('stripe')(SECRET_KEY)
app.use(session({
  secret: "Out little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//DB config
const db = require('./config/keys').MongoURI;

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

mongoose.set("useCreateIndex", true);

const port = process.env.PORT || 3000
// app.use(expressLayouts)
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.use(bodyParser.json());

//Models
//User

const userSchema = new mongoose.Schema ({
  name: String,
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//post
const postSchema = new mongoose.Schema({
  doctor: String,
  time: String,
  date: String,
  mode: String,
  postedBy:{
    type: ObjectId,
    ref: "User"
  }
},{
  timestamps: true
})

const Post = mongoose.model("Post",postSchema)

///Routes
app.get('/', (req,res) =>{

  if (req.isAuthenticated()) {
    res.render('index');
  } else {
    res.redirect('/login')
  }

})

app.get('/admin', function(req, res){
  res.render('admin-login')
})

app.post('/admin', function(req, res){
  // console.log(req.body.password)
  if (req.body.password === 'admin') {
    Post.find({}, function(err, posts){
      // console.log(posts)
      res.render('admin',{posts:posts})
    }).populate("postedBy","_id name").sort({'createdAt': -1});
  } else {
    res.send('Unauthorized')
  }
})

// app.get('/admin', function(req, res){
//   Post.find({}, function(err, posts){
//     res.render('admin',{posts:posts})
//   }).populate("postedBy","_id name").sort({'createdAt': -1});
// });



//Register
app.get('/register', (req,res) =>{
  res.render('register')
})

app.post('/register', (req,res) => {
  User.register({username: req.body.username, name: req.body.name}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req, res, function(){
        sendWelcomeEmail(user.username, user.name)
        res.redirect("/")
      })
    }
  })
})

//Login
app.get('/login', (req,res) =>{
  res.render('login')
})

app.get('/profile', (req,res) =>{
  res.render('profile')
})

app.get('/update', (req,res) =>{
  res.render('upgrade')
})

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, function(err){
    if (err) {
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/")
      })
    }
  })
})

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/login");
})

app.get('/submit', (req,res) =>{

  if (req.isAuthenticated()) {
    res.render('submit');
  } else {
    res.redirect('/login')
  }

})

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret

  console.log(req.user.id)

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err)
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/")
        })
      }
    }
  })
})








app.listen(port, function() {
    console.log("Server started on port 3000");
  });
  