const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
module.exports.isLoggedIn = (req, res, next)=>{
    if(!req.isAuthenticated()){
            req.flash("error", "Please login to continue");
            res.redirect("/listings");
    }else{
        next();
    }
}

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (!listing.owner.equals(res.locals.currentLoggedInUser._id)) {
        req.flash("error", "You're not owner of this listing.");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewOwner = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect("/listings");
    }

    if (!review.owner.equals(res.locals.currentLoggedInUser._id)) {
        req.flash("error", "You're not owner of this review.");
        return res.redirect(`/listings/${id}`);
    }
    next();
}