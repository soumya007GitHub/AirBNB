const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoosePkg = require("passport-local-mongoose");
const passportLocalMongoose =
    typeof passportLocalMongoosePkg === "function"
        ? passportLocalMongoosePkg
        : passportLocalMongoosePkg.default;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    }
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;