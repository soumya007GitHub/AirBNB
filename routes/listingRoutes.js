const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const ListingController = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

function uploadListingImage(req, res, next) {
    upload.single("image")(req, res, (err) => {
        if (err) {
            req.flash("error", err.message || "Image upload failed. Use PNG, JPG, JPEG, or WEBP and check Cloudinary credentials in .env.");
            return res.redirect("/listings/new");
        }
        next();
    });
}

function uploadListingImageOptional(req, res, next) {
    upload.single("image")(req, res, (err) => {
        if (err) {
            req.flash("error", err.message || "Image upload failed.");
            return res.redirect(`/listings/${req.params.id}/edit`);
        }
        next();
    });
}

// All listings
router.get("/", wrapAsync(ListingController.index));

// New listing add page
router.get("/new", isLoggedIn, wrapAsync(ListingController.newListingView));

// New listing add to db
router.post("/new", isLoggedIn, uploadListingImage, wrapAsync(ListingController.newListingAdd));

// show listing details
router.get("/:id", wrapAsync(ListingController.showListingDetails));

// show listing edit details page
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(ListingController.showListingEditPage));

// update listing details (optional new image via Cloudinary)
router.patch("/:id", isLoggedIn, isOwner, uploadListingImageOptional, wrapAsync(ListingController.updateListingDetails));

// delete listing entirely
router.get("/:id/delete", isLoggedIn, isOwner, wrapAsync(ListingController.deleteListing));

module.exports = router;