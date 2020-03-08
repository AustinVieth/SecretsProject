//jshint esversion:6
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email:
  {
    type: String,
    required: true
  },
  password:
  {
    type: String,
    required: true
  },
  username:
  {
    type: String,
  }
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });

const User = mongoose.model("User", userSchema);




app.get("/", function(req, res){
  res.render("home");
});


app.route("/login")
.get(function(req, res){
  res.render("login");
})

.post(function(req, res) {
  const login = {
    email: req.body.username,
    password: req.body.password
  }
  User.findOne( {email: req.body.username} ,function(err, user){
    if (err){
      res.send(err);
    }else{
      if (user){
        if(user.password === login.password){
          res.render("secrets");
        }else{
          console.log("Incorrect Password!");
          res.render("home");
        }
      }else{
        res.render("home");
      }
    }
  });
});




app.route("/register")
.get(function(req, res){
  res.render("register");
})

.post(function(req, res){
  const user = new User({
    email: req.body.username,
    username: req.body.username,
    password: req.body.password
  });
  user.save(function(err){
    if (err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
});







app.listen(3000, function(req, res){
  console.log("Server is Listening on Port 3000");
});
