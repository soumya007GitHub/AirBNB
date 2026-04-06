const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}

module.exports.newListingView = async (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.newListingAdd = async (req, res, next) => {
    if (!req.body.title || !req.body.description || req.body.price === undefined || req.body.price === "" || !req.body.location || !req.body.country) {
        throw new ExpressError(400, "Listing Details are required.");
    }
    if (!req.file || !req.file.path) {
        throw new ExpressError(400, "Image upload is required.");
    }
    const { title, description, price, location, country } = req.body;
    const url = req.file.path;
    const filename = req.file.filename;
    const newListing = new Listing({
        title,
        description,
        image: {
            filename: filename,
            url: url,
        },
        price,
        location,
        country
    });
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash('success', 'New Listing added succesfully!');
    console.log("New listing added");
    res.redirect("/listings");
};

module.exports.showListingDetails = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews",
        populate: {
            path: "owner"
        }}).populate("owner");
    res.render("listings/show.ejs", { listing });
};

module.exports.showListingEditPage = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/update.ejs", { listing });
};

module.exports.updateListingDetails = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, location, country } = req.body;

    const update = { title, description, price, location, country };
    if (req.file && req.file.path) {
        update.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await Listing.findByIdAndUpdate(id, { $set: update });
    req.flash('updated', 'Listing updated succesfully!');
    res.redirect("/listings");
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('deleted', 'Listing deleted succesfully!');
    res.redirect("/listings");
};