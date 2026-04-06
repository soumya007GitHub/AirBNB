const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const {
    LISTING_CATEGORY_OPTIONS,
    LISTING_CATEGORY_VALUES,
} = require("../utils/listingCategories.js");

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports.index = async (req, res) => {
    const search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category =
        typeof req.query.category === "string" ? req.query.category : "";

    const filter = {};
    if (search) {
        const rx = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { title: { $regex: rx } },
            { location: { $regex: rx } },
            { country: { $regex: rx } },
        ];
    }
    if (category && LISTING_CATEGORY_VALUES.includes(category)) {
        filter.category = category;
    }

    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", {
        allListings,
        search,
        activeCategory: category,
        listingCategoryOptions: LISTING_CATEGORY_OPTIONS,
    });
};

module.exports.newListingView = async (req, res) => {
    res.render("listings/new.ejs", {
        listingCategoryOptions: LISTING_CATEGORY_OPTIONS,
    });
};

module.exports.newListingAdd = async (req, res, next) => {
    if (
        !req.body.title ||
        !req.body.description ||
        req.body.price === undefined ||
        req.body.price === "" ||
        !req.body.location ||
        !req.body.country
    ) {
        throw new ExpressError(400, "Listing Details are required.");
    }
    if (!req.body.category || !LISTING_CATEGORY_VALUES.includes(req.body.category)) {
        throw new ExpressError(400, "Please select a valid category.");
    }
    const gstPercentage = Number(req.body.gstPercentage);
    if (Number.isNaN(gstPercentage) || gstPercentage < 0 || gstPercentage > 100) {
        throw new ExpressError(400, "GST percentage must be between 0 and 100.");
    }
    if (!req.file || !req.file.path) {
        throw new ExpressError(400, "Image upload is required.");
    }
    const { title, description, price, location, country, category } = req.body;
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
        country,
        category,
        gstPercentage,
    });
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing added succesfully!");
    console.log("New listing added");
    res.redirect("/listings");
};

module.exports.showListingDetails = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "owner",
            },
        })
        .populate("owner");
    res.render("listings/show.ejs", { listing });
};

module.exports.showListingEditPage = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/update.ejs", {
        listing,
        listingCategoryOptions: LISTING_CATEGORY_OPTIONS,
    });
};

module.exports.updateListingDetails = async (req, res) => {
    const { id } = req.params;
    if (!req.body.category || !LISTING_CATEGORY_VALUES.includes(req.body.category)) {
        throw new ExpressError(400, "Please select a valid category.");
    }
    const gstPercentage = Number(req.body.gstPercentage);
    if (Number.isNaN(gstPercentage) || gstPercentage < 0 || gstPercentage > 100) {
        throw new ExpressError(400, "GST percentage must be between 0 and 100.");
    }
    const { title, description, price, location, country, category } = req.body;

    const update = {
        title,
        description,
        price,
        location,
        country,
        category,
        gstPercentage,
    };
    if (req.file && req.file.path) {
        update.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await Listing.findByIdAndUpdate(id, { $set: update });
    req.flash("updated", "Listing updated succesfully!");
    res.redirect("/listings");
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("deleted", "Listing deleted succesfully!");
    res.redirect("/listings");
};
