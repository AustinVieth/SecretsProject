//jshint esversion:6
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(session({
  secret: "This is Our Secret.",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email:
  {
    type: String,
  },
  password:
  {
    type: String,
  },
  username:
  {
    type: String,
  }
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});


app.route("/login")
.get(function(req, res){
  res.render("login");
})

.post(function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    })

    req.login(user, function(err) {
      if (err){
        console.log(err);
      }else{
        passport.authenticate("local")(req,res, function() {
          res.redirect("/secrets")
        });
      }
    });

});

app.route("/secrets")
.get(function(req, res) {
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

app.route("/register")
.get(function(req, res){
  res.render("register");
})

.post(function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  })

});

app.route("/logout")
.get(function(req, res) {
  req.logout();
  res.redirect("/");
});







app.listen(3000, function(req, res){
  console.log("Server is Listening on Port 3000");
});
