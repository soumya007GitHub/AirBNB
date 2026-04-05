const express = require("express");
const router = express.Router({mergeParams: true});
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");

// All listings
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New listing add page
router.get("/new", wrapAsync(async (req, res) => {
    res.render("listings/new.ejs");
}));

// New listing add to db
router.post("/new", wrapAsync(async (req, res, next) => {
    if(!req.body.title || !req.body.description || !req.body.image || !req.body.price || !req.body.location || !req.body.country){
        throw new ExpressError(400, "Listing Details are required.");
    }
        const { title, description, image, price, location, country } = req.body;
        const newListing = new Listing({
            title,
            description,
            image: {
                url: image,
            },
            price,
            location,
            country
        });
        await newListing.save();
        console.log("New listing added");
        res.redirect("/listings");
}));

// show listing details
router.get("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
}));

// show listing edit details page
router.get("/:id/edit", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/update.ejs", { listing });
}));

// update listing details
router.patch("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, image, price, location, country } = req.body;
    await Listing.findByIdAndUpdate(id, {
        title, description, image: { url: image || "https://shorturl.at/s24GO" }, price, location, country
    });
    res.redirect("/listings");
}));

// delete listing entirely
router.get("/:id/delete", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

module.exports = router;