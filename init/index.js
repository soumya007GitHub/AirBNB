const mongoose = require("mongoose");
let initialData = require("./data.js");
const Listing = require("../models/listing.js");
const { LISTING_CATEGORY_VALUES } = require("../utils/listingCategories.js");
const URL = "mongodb://127.0.0.1:27017/airbnb";

async function dbConnection(){
    await mongoose.connect(URL);
}

dbConnection().then(()=>{
    console.log("Connected to AirBNB DB succesfully");
}).catch(()=>{
    console.log("Failed to connect to the AirBNB DB");
});


const feedDB = async () => {
    await Listing.deleteMany({});
    const rows = initialData.data.map((obj, i) => ({
        ...obj,
        owner: obj.owner || "69d37f202f84959528548733",
        category:
            obj.category ||
            LISTING_CATEGORY_VALUES[i % LISTING_CATEGORY_VALUES.length],
        gstPercentage:
            typeof obj.gstPercentage === "number"
                ? obj.gstPercentage
                : [5, 12, 18][i % 3],
    }));
    await Listing.insertMany(rows);
    console.log("Data feeded into the db");
};

feedDB();