
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
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

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" }
};

function findUserByEmail(email){

  for (var userKey in users) {
    if(users[userKey].email === email){
      return userKey;
    }
  }
};

function urlsForUser(id){
  let matchedURLs = {};
  for(shortURL in urlDatabase){
    if( urlDatabase[shortURL]["userID"] === id){
      matchedURLs[shortURL] = { longURL : urlDatabase[shortURL].longURL}
  }
}
  return matchedURLs;;
};


app.get("/", (req, res) => {
  res.redirect('/urls')
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies["user_ID"]]};
  if(templateVars['user']){
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls/:shortURL", (req, res) =>{
  if(req.cookies.user_id === urlDatabase[req.params.shortURL].userID){
       urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
       urlDatabase[req.params.shortURL]["userID"] = req.cookies["user_ID"];
       res.redirect('/urls');
  } else {
  res.send("You do not have permission")
  }
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.cookies["user_ID"]]};
  res.render("urls_login", templateVars);
})

app.post("/login", (req, res) => {

  let userEmail =req.body.email;
  let userID = findUserByEmail(userEmail);
  if(userID){
    if(bcrypt.compareSync(req.body.password, users[userID].password))
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

app.post("/register", (req, res) =>{
  let userID = generateRandomString();
  let userEmail =req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10)
  if ( userEmail === "" || req.body.password === ""){
    res.status(400).send("Please enter a valid email or username");
  } else if( findUserByEmail(userEmail)){
    res.status(400).send("Email already exists!");
  } else {
  let userObj = {
    id: userID,
    email: userEmail,
    password: hashedPassword
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
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    user: users[req.cookies["user_ID"]]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let value = {longURL: req.body.longURL, userID: req.cookies["user_ID"]}
  let key = generateRandomString();
  urlDatabase[key] = value;
  res.redirect('/urls/'+key);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if(req.cookies.user_id === urlDatabase[req.params.shortURL].userID){
    let idDeleted = req.params.shortURL;
    delete urlDatabase[idDeleted];
    res.redirect('/urls');
  } else {
    res.send("you don't have permission");
  };
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect('http://' + longURL);
})

app.get("/urls", (req, res) => {
  let templateVars = {
   urls: urlsForUser(req.cookies["user_ID"]),
   user: users[req.cookies["user_ID"]]
 };
  res.render("urls_index", templateVars);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});