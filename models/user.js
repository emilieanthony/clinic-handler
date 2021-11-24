const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  userId: Number,
  firstName: String,
  lastName: String,
  email: String,
  dayOfBirth: Date,
});

module.exports = mongoose.model("users", UserSchema);