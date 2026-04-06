const User = require("../models/user.js");

module.exports.index = (req, res)=>{
    res.render("users/signup.ejs");
};

module.exports.register = async (req, res) => {
    try {
        let { username, email, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash("error", "Username already taken.");
            return res.redirect("/user/signup");
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            req.flash("error", "Email already registered.");
            return res.redirect("/user/signup");
        }

        let user = new User({ username, email });

        const newUser = await User.register(user, password);

        req.login(newUser, (err) => {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("/user/signup");
            }
        req.flash("success", "Account created successfully");
            return res.redirect("/listings");
        });

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/user/signup");
    }
}

module.exports.loginPage = (req, res)=>{
    res.render("users/login.ejs");
};

module.exports.login = async(req, res)=>{
    const {username, password} = req.body;
    req.flash("success", `Welcome Back ${username}`);
    res.redirect("/listings");
};

module.exports.logout = (req, res)=>{
    req.logout((err)=>{
        if(err){
            req.flash("error", err);
        }
        req.flash("success", "You've been logged out successfully!");
        res.redirect("/listings");
    });
};