// LEVEL6 : Use of email and password for authenticate with OAuth 2.0 and 3rd party authentication (using Google)

//jshint esversion:6

// Include NPM package
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

// Include EJS
app.set('view engine', 'ejs');

// Indicate express to use body-parser
app.use(bodyParser.urlencoded({
  extended: true
}));

// Need to deliver static files (for css, images and javascripts)
app.use(express.static("public"));

// Configure express-session and passport
app.use(session({
  secret: "a long sentence to protect our project credentials",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Create and connect to DB, create schema and create model
mongoose.connect("mongodb://localhost:27017/userDB", {
// mongoose.connect("mongodb+srv://admin-cly:annecy74@cluster0.dkgq4.mongodb.net/<database>?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String
  },
  googleId: {
    type: String
  },
  secret: {
    type: String
  }
});

// Activate database with passport.js
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

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate("google", { scope: ['profile'] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  // Find all secrets from DB
  User.find({"secret": {$ne:null}}, function(err, foundUsers){
    if (err) {
      console.log(err);
    } else {
      res.render("secrets", {userWithSecrets: foundUsers});
    }
  });
});

app.get("/submit", function(req, res) {
  // Check if user has been authenticated to authorize access
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});



app.post("/register", function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      console.log("User is accepted: " + user);
      passport.authenticate("local")(req, res, function(){
        // If authentication is ok, redirect to /secrets route
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  // Use passport to log in user
  req.login(user, function(err){
    if (err) {
      console.log("Log in refused: " + err);
    } else {
      // Authenticate the user
      passport.authenticate("local")(req, res, function(){
        // If authentication is ok, redirect to /secrets route
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", function(req, res) {

  // Save secret
  const submittedSecret = req.body.secret;

  console.log(req.user.id);
  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
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
