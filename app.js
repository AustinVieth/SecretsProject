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
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
  },
  googleId: String,
  secret: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

///////////////////////////////Google OAuth///////////////////////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    // userProfileURL: "https://www.googleapis.com/oath2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile);

       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));





///////////////////////////////////Routing//////////////////////////////


app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/auth/google",
  passport.authenticate("google", { scope: ["https://www.googleapis.com/auth/plus.login"] }));


app.route("/submit")
.get(function(req, res) {
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
})
.post(function(req, res) {
  const secret = req.body.secret;
  console.log(req.user._id);

  User.findById(req.user._id, function(err, foundUser) {
    if (err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = secret;
        foundUser.save();
        res.redirect("/secrets");
      }else{
        console.log("No User Found!");
      }
    }
  });
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
  User.find({"secret": {$ne: null}}, function(err, foundUsers) {
    if (err){
      console.log(err);
    }else{
      res.render("secrets", {usersWithSecrets: foundUsers})
    }
  });
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
