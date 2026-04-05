const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const Listing = require("./models/listing.js");
const listingRoutes = require("./routes/listingRoutes.js");
const reviewRoutes = require("./routes/reviewRoutes.js");
const URL = "mongodb://127.0.0.1:27017/airbnb";

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));

async function dbConnection() {
    await mongoose.connect(URL);
}

dbConnection().then(() => {
    console.log("Connected to AirBNB DB succesfully");
}).catch(() => {
    console.log("Failed to connect to the AirBNB DB");
});

// Testing route
app.get("/", (req, res) => {
    res.send("This is sample test home route");
})

// Sample listing save route
app.get("/testListing", async (req, res) => {
    let sampleListing = new Listing({
        title: "My villa",
        description: "New sample villa",
        price: 1200,
        location: "Kolkata",
        country: "India"
    });
    await sampleListing.save();
    console.log("Sample listing saved");
    res.send("Sample listing added");
})

// All listing routes
app.use("/listings", listingRoutes);

// All review routes
app.use("/listings/:id/reviews", reviewRoutes);

// For not found pages
app.use((req, res) => {
    res.status(404).render("error/404.ejs");
});

// For any error related to data from being sent from client to server
app.use((err, req, res, next)=>{
    const {statusCode = 500, message = "Something went wrong"} = err;
    res.render("error/error.ejs", {statusCode, message});
})

app.listen(8080, () => {
    console.log("Server started on port 8080");
})