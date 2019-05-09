const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
} ;


function checkEmail(email){
  for (var user in users) {
    if(users[user].email === email){
      return true;

function findUserByEmail(email){
  for (var userKey in users) {
    if(users[userKey].email === email){
      return userKey;

    }
  }
}

var urlDatabase = {

}

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies["user_ID"]]};
  res.render("urls_new", templateVars);
});

app.post("/urls/:shortURL", (req, res) =>{
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  res.render("urls_login");
})

app.post("/login", (req, res) => {

  let userEmail =req.body.email;
  let userID = findUserByEmail(userEmail);
  if(userID){
    if(users[userID].password === req.body.password)
      {
        res.cookie("user_ID", users[userID].id);
      } else {
        return res.status(403).send("Wrong Password");
      }
    }
   else {
      res.status(403).send("Cannot find that email");
    }

  res.cookie("user_ID", userID)
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
 res.clearCookie('user_ID');
 res.redirect('/urls/');
});

app.get("/register", (req, res) => {
   res.render("urls_register");
})

app.post("/register", (req, res) =>{
  let userID = generateRandomString();
  let userEmail =req.body.email;
  if ( userEmail === "" || req.body.password === ""){
    res.status(400).send("Please enter a valid email or username");

  } else if( checkEmail(userEmail) === true){

  } else if( findUserByEmail(userEmail)){

    res.status(400).send("Email already exists!");
  } else {
  let userObj = {
    id: userID,
    email: userEmail,
    password: req.body.password
  };
  users[userID] = userObj;
  console.log(users[userID].email);
  res.cookie("user_ID", userID);
  res.redirect("/urls");
}});


app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_ID"]]
  };
   res.render("urls_register", templateVars);
})


app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_ID"]]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let value = req.body.longURL;
  let key = generateRandomString();
  urlDatabase[key] = value;
  res.redirect('/urls/'+key);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let idDeleted = req.params.shortURL;
  delete urlDatabase[idDeleted];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.get("/urls", (req, res) => {
  let templateVars = {
   urls: urlDatabase,
   user: users[req.cookies["user_ID"]]
 };
  res.render("urls_index", templateVars);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});