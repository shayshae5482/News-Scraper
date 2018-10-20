var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

//// scraping tools

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;
//var PORT = 3000;
//MONGO for HEROKU
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines"

mongoose.connect(MONGODB_URI);

// Express
var app = express();


// Use the morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// Connect Mongo DB

var PORT = process.env.PORT || 3000;
//mongoose.connect("mongodb://localhost/mongoHeadlines", { useNewUrlParser: true });


// Routes

app.get("/scrape", function(req, res) {
  
  axios.get("http://www.echojs.com/").then(function(response) {
    
    var $ = cheerio.load(response.data);

    // Get the h2 within an article
    $("article h2").each(function(i, element) {
      // leave an empty result object for the results
      var result = {};

      // Add the text and href of every link
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // See the result in the console (if you see it, it works!)
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, throw an error
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("The scrape is working! You're rockin' and rolling.");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If you the find Articles, send them back to the client as a json
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, throw an error
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id + req.params.id
  db.Article.findOne({ _id: req.params.id })
    // ..and add all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, throw error
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
     
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, throw error
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
