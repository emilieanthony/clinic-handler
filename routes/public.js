const express = require("express");
const router = express.Router();
const main = require("./public_api/main.api");
const comments = require("./public_api/comments.api");
const map = require("./public_api/map.api");
const users = require("./public_api/user.api");
const jwt = require("jsonwebtoken");
var authRequiredMiddleware = require("./middlewares/authRequired");

router.get("/main", main);
router.get("/comments", comments);
router.get("/map", map);
router.get("/users",users);
router.get("/user",users);

module.exports = router;
