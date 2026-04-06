const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const User = require("./user.js");
const { LISTING_CATEGORY_VALUES } = require("../utils/listingCategories.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        filename: {
            type: String,
            default: "listingimage"
        },
        url: {
            type: String,
            default: "https://shorturl.at/s24GO",
        }
    },
    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: LISTING_CATEGORY_VALUES,
        default: "rooms",
    },
    gstPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner : {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

// Delete all reviews on listing delete action
listingSchema.post("findOneAndDelete", async (listing)=>{
    if (listing) {
    await Review.deleteMany({_id : {$in : listing.reviews}});
    console.log('Delete Listing with all of its reviews');
    }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;