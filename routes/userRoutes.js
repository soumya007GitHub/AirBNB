const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const UserController = require("../controllers/users.js");

// Signup page
router.get("/signup", UserController.index);

// Register new user
router.post("/signup", wrapAsync(UserController.register));

// Login Page
router.get("/login", UserController.loginPage);

// Login
router.post("/login", passport.authenticate("local", {
    failureRedirect : "/user/login",
    failureFlash: true
}), wrapAsync(UserController.login));

// Logout
router.get("/logout", UserController.logout);

module.exports = router;