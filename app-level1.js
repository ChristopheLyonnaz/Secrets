// LEVEL1 : Use of email and password for authenticate in plain text

//jshint esversion:6

// Include NPM package
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

const app = express();

// Include EJS
app.set('view engine', 'ejs');

// Indicate express to use body-parser
app.use(bodyParser.urlencoded({
  extended: true
}));

// Need to deliver static files (for css, images and javascripts)
app.use(express.static("public"));

// Create and connect to DB, create schema and create model
mongoose.connect("mongodb://localhost:27017/userDB", {
// mongoose.connect("mongodb+srv://admin-cly:annecy74@cluster0.dkgq4.mongodb.net/<database>?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String
  }
});
const User = mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
  // Record email (username in EJS) and password (password in EJS) of the new user
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  // Save newUser in database. Display secret page if registration succeeds
  newUser.save(function(err){
    if (err) {
      console.log(err);
    } else {
      res.render("secrets"); // Only if user has been successfully registered
    }
  });
});

app.post("/login", function(req, res) {
  // Check if username / password match from database
  User.findOne({ email: req.body.username, password: req.body.password },
    function(err, foundUser){
      if ((!err) && (foundUser)) {
        res.render("secrets"); // Only if user has been found in database
      } else {
        console.log(err);
        res.redirect("/");
      }
  });
});




// Launch server using automatically defined port from Heroku or 3000 otherwise
let port = process.env.PORT;
if ((port == null) || (port == "")) {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server is running.");
});
