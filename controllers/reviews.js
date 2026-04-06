const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.addReview = async(req, res)=>{
    const {rating, comment} = req.body;
    const {id} = req.params;
    let newReview = new Review({
        comment: comment,
        rating: rating
    })
    newReview.owner = req.user._id;
    let review = await newReview.save();
    let listing = await Listing.findById(id);
    listing.reviews.push(review);
    await listing.save();
    req.flash('success', 'Review added succesfully!');
    console.log("Review added");
    res.redirect(`/listings/${id}`);
};


module.exports.deleteReview = async(req, res)=>{
    let {id, reviewId} = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Listing.findByIdAndUpdate(
        id,
        {
            $pull: {reviews : reviewId}
        }
    );
    req.flash('deleted', 'Review deleted succesfully!');
    console.log("Review Deleted Succesfully");
    res.redirect(`/listings/${id}`);
}