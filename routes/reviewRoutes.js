const express = require("express");
const router = express.Router({mergeParams: true});
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.post("/", wrapAsync(async(req, res)=>{
    const {rating, comment} = req.body;
    const {id} = req.params;
    let newReview = new Review({
        comment: comment,
        rating: rating
    })
    let review = await newReview.save();
    let listing = await Listing.findById(id);
    listing.reviews.push(review);
    await listing.save();

    console.log("Review added");
    res.redirect(`/listings/${id}`);
}));

router.get("/:reviewId", wrapAsync(async(req, res)=>{
    let {id, reviewId} = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Listing.findByIdAndUpdate(
        id,
        {
            $pull: {reviews : reviewId}
        }
    );
    console.log("Review Deleted Succesfully");
    res.redirect(`/listings/${id}`);
}));

module.exports = router;