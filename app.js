const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const URL = "mongodb://127.0.0.1:27017/airbnb";

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));

async function dbConnection(){
    await mongoose.connect(URL);
}

dbConnection().then(()=>{
    console.log("Connected to AirBNB DB succesfully");
}).catch(()=>{
    console.log("Failed to connect to the AirBNB DB");
});


app.get("/", (req, res)=>{
    res.send("This is sample test home route");
})

app.get("/testListing", async (req, res)=>{
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


app.get("/listings", async (req, res)=>{
   const allListings = await Listing.find({});
   res.render("listings/index.ejs", {allListings});
})

app.get("/listings/new", async(req, res)=>{
    res.render("listings/new.ejs");
})

app.post("/listings/new", async (req, res)=>{
    const {title, description, image, price, location, country} = req.body;
    const newListing = new Listing({
        title,
        description,
        image : {
            url: image,
        },
        price,
        location,
        country
    });
    await newListing.save();
    console.log("New listing added");
    res.redirect("/listings");
})

app.get("/listings/:id", async(req, res)=>{
    const {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", {listing});
})


app.get("/listings/:id/edit", async (req, res)=>{
    const {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/update.ejs", {listing});
});

app.patch("/listings/:id", async (req, res)=>{
    const {id} = req.params;
    const {title, description, image, price, location, country} = req.body;
    await Listing.findByIdAndUpdate(id, {
        title, description, image : {url: image || "https://shorturl.at/s24GO"}, price, location, country
});
    res.redirect("/listings");
});

app.get("/listings/:id/delete", async (req, res)=>{
    const {id} = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
});


app.listen(8080, ()=>{
    console.log("Server started on port 8080");
})