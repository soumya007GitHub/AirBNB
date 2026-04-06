require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const Listing = require("./models/listing.js");
const listingRoutes = require("./routes/listingRoutes.js");
const reviewRoutes = require("./routes/reviewRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const URL = process.env.ATLAS_DB_URL;

// connect-mongo v6: use MongoStore.create({ mongoUrl, crypto }) — not createWebCryptoAdapter({ mongoUrl, crypto })
const sessionSecret =
    process.env.SESSION_SECRET || "dev-only-session-secret-change-in-production";

const store = MongoStore.create({
    mongoUrl: URL,
    touchAfter: 24 * 3600,
    crypto: {
        secret: sessionSecret,
    },
});

const sessionOptions = {
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


async function dbConnection() {
    await mongoose.connect(URL);
}

dbConnection().then(() => {
    console.log("Connected to AirBNB DB succesfully");
}).catch(() => {
    console.log("Failed to connect to the AirBNB DB");
});

// Flash message middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.updated = req.flash("updated");
    res.locals.deleted = req.flash("deleted");
    res.locals.error = req.flash("error");
    res.locals.currentLoggedInUser = req.user;
    next();
})

// Testing route
// app.get("/", (req, res) => {
//     res.send("This is sample test home route");
// })

// Sample listing save route
app.get("/testListing", async (req, res) => {
    let sampleListing = new Listing({
        title: "My villa",
        description: "New sample villa",
        price: 1200,
        location: "Kolkata",
        country: "India"
    });
    await sampleListing.save();
    console.log("Sample listing saved");
    res.send("Sample listing added");
})

// Test user account creation
app.get("/demouser", async (req, res) => {
    let fakeUser = {
        email: "student@gmail.com",
        username: "soumya724"
    }
    let newUser = await User.register(fakeUser, "helloworld");
    res.send(newUser);
})

// All listing routes
app.use("/listings", listingRoutes);

// All review routes
app.use("/listings/:id/reviews", reviewRoutes);

// All user routes
app.use("/user", userRoutes);

// For not found pages
app.use((req, res) => {
    res.status(404).render("error/404.ejs");
});

// For any error related to data from being sent from client to server
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.render("error/error.ejs", { statusCode, message });
})

app.listen(8080, () => {
    console.log("Server started on port 8080");
})