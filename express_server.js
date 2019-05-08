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


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:shortURL", (req, res) =>{
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
 res.clearCookie('username');
 res.redirect('/urls/');
});


app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]};
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
   username: req.cookies["username"]
 };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});