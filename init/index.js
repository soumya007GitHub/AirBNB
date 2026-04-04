const mongoose = require("mongoose");
const initialData = require("./data.js");
const Listing = require("../models/listing.js");
const URL = "mongodb://127.0.0.1:27017/airbnb";

async function dbConnection(){
    await mongoose.connect(URL);
}

dbConnection().then(()=>{
    console.log("Connected to AirBNB DB succesfully");
}).catch(()=>{
    console.log("Failed to connect to the AirBNB DB");
});


const feedDB = async ()=>{
    await Listing.deleteMany({});
    await Listing.insertMany(initialData.data);
    console.log("Data feeded into the db");
}

feedDB();