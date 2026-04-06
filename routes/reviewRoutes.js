const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isReviewOwner} = require("../middleware.js");
const ReviewController = require("../controllers/reviews.js");

// Add Review
router.post("/", isLoggedIn, wrapAsync(ReviewController.addReview));

// Delete Review
router.get("/:reviewId", isLoggedIn, isReviewOwner, wrapAsync(ReviewController.deleteReview));

module.exports = router;