
const bodyParser = require("body-parser"); //importing various middlewares
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
}));

function generateRandomString() { //this is the function for creating the random userID
  return Math.random().toString(36).substr(2, 6);
}

const users = { //sample user database
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
};

const urlDatabase = { //sample URL database
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" }
};

function findUserByEmail(email){ //this helper function finds the userID by their email
  for (var userKey in users) {
    if(users[userKey].email === email){
      return userKey;
    }
  }
};

function urlsForUser(id){ //this function creates a new object filled with URLs for specified
  let matchedURLs = {};//user based on their ID
  for(shortURL in urlDatabase){
    if( urlDatabase[shortURL]["userID"] === id){
      matchedURLs[shortURL] = { longURL : urlDatabase[shortURL].longURL}
    }
  }
  return matchedURLs;;
};

app.get("/", (req, res) => {//if they go to "/" they get automatically redirected to /urls
  if(users[req.session.user_ID]){//if they are logged in
    res.redirect('/urls');
  } else {
    res.redirect("/login");//if not logged in, they get redirected to log in page
  }
});

app.get("/login", (req, res) => {
  if(req.session.user_ID){//if the user is already logged in it will be directed to /urls
    res.redirect('/urls');
  } else {
    let templateVars = {user: users[req.session.user_ID]};
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => { //checks if the user credentials are correct
  let userEmail =req.body.email;
  let userID = findUserByEmail(userEmail);
  if(userID){//if the user is in the database
    if(bcrypt.compareSync(req.body.password, users[userID].password)){
        req.session.user_ID = users[userID].id;
        res.redirect("/urls");//comparing the password entered to the hashed password
      } else {
        return res.status(403).send("Wrong Password");
      }
  } else {
      res.status(403).send("Cannot find that email");
  }
});

app.get("/urls/new", (req, res) => { //get method for creating new URLS
  let templateVars = {user: users[req.session.user_ID]};
  if(templateVars['user']){
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls/:shortURL", (req, res) =>{ //checks if the user has permission to access the
  if(req.session.user_ID === urlDatabase[req.params.shortURL].userID){//short URLs
       urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
       urlDatabase[req.params.shortURL]["userID"] = req.session.user_ID;
       res.redirect('/urls');
  } else {
  res.send("You do not have permission")
  }
});

app.post("/logout", (req, res) => {
 req.session = null;//destroys the session
 res.redirect('/login');
});

app.post("/register", (req, res) =>{
  let userID = generateRandomString();
  let userEmail =req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10)//encrypts the password entered
  if ( userEmail === "" || req.body.password === ""){//if any of the fields are blank
    res.status(400).send("Please enter a valid email or username");
  } else if( findUserByEmail(userEmail)){//if the function successfully finds an email associated
    res.status(400).send("Email already exists!");
  } else {
    let userObj = { //creates a new user object
      id: userID,
      email: userEmail,
      password: hashedPassword
    };
    users[userID] = userObj; //adds the just created object into the users database
    req.session.user_ID = userID; //stores the generated ID into the secure hashed cookie
    res.redirect("/urls");
}});

app.get("/register", (req, res) => {
  if(req.session.user_ID){
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.user_ID]
    };
    res.render("urls_register", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if(req.session.user_ID === urlDatabase[req.params.shortURL].userID){//checking if the user's logged in
    if(urlDatabase[req.params.shortURL]){//checks if the short URL exist in the database
    let templateVars = { shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user: users[req.session.user_ID]
    };
      res.render("urls_show", templateVars);
    } else {
      res.send("That page doesn't exist!");//error msg if the website doesn't exist
    }
  } else if(req.session.user_ID !== urlDatabase[req.params.shortURL].userID){
  res.send("You don't have permission!");//error msg if user's not logged in
  } else {
    res.send("Please log in first!");
  };
});


app.post("/urls/:shortURL/delete", (req, res) => {
  if(req.session.user_ID === urlDatabase[req.params.shortURL].userID){//checks if the user has permission
    let idDeleted = req.params.shortURL;
    delete urlDatabase[idDeleted];
    res.redirect('/urls');
  } else if (req.session.user_ID){
    res.send("You are not on the right account!")
  } else {
    res.send("You don't have permission");
  };
});

app.get("/urls", (req, res) => {
  let userid = req.session.user_ID;
  if(userid){
    let templateVars = {
      urls: urlsForUser(req.session.user_ID),
      user: users[req.session.user_ID]
    };
    res.render("urls_index", templateVars);
  } else {
    res.send("User not logged in!");
  }
});

app.post("/urls", (req, res) => {//stores longURL and that user's ID with the key value of the shortURL
  let value = {longURL: req.body.longURL, userID: req.session.user_ID}
  let key = generateRandomString();
  urlDatabase[key] = value;
  res.redirect('/urls/'+key);
});

app.get("/u/:shortURL", (req, res) => { //making sure that other users can use the generated short URL
    const shortURL = urlDatabase[req.params.shortURL];
    const longURL = shortURL.longURL;
  if(longURL){//checks if the longURL exists
    res.redirect(longURL);//sets the http:// in case the users forget the entire link
  } else{
    res.send("Please make sure you typed it in correctly!");
  }
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
