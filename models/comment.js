const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  title: String,
  text: String,
  author: String,
  timestamp: Date,
});

module.exports = mongoose.model("comment", CommentSchema);