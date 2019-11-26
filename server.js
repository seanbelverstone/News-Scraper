// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");
const PORT = process.env.PORT || 3001

// Initialize Express
var app = express();

// Database configuration
var databaseUrl = "nytimes_scrape";
var collections = ["scrapedArticles", "savedArticles"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedArticles collection in the db
  db.scrapedArticles.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

app.post("/save", function(req, res) {
  console.log(req.body);

  db.savedArticles.insert(req.body, function(error, saved) {

    if (error) {
      console.log(error);
    }
    else {
      res.json(saved)
    }
  });
})

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios.get("https://www.nytimes.com/section/world").then(function(response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    // For each element with a "title" class
    $("article").each(function(i, element) {
      // Save the text and href of each link enclosed in the current element
      var title = $(element).find("h2").find("a").text();
      var img = $(element).find("a").find("img").attr("src");
      var caption = $(element).find("p").text();
      var link = $(element).find("a").attr("href");

      // If this found element had both a title and a link
      if (title && img) {
        // Insert the data in the scrapedArticles db
        db.scrapedArticles.insert({
          title: title,
          img: img,
          caption: caption,
          link: link
        },
        function(err, inserted) {
          if (err) {
            // Log the error if one is encountered during the query
            console.log(err);
          }
          else {
            // Otherwise, log the inserted data
            console.log(inserted);
          }
        });
      }
    });
    res.send(response);
  });
});

// Listen on port 3001
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});