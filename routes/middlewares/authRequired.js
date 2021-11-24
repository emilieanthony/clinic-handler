const jwt = require("jsonwebtoken");

module.exports = async function authRequiredMiddleware(req, res, next) {
  try {
    console.log(req.body);
    const token = req.body.authorization;
    console.log(token);
    if (!token)
      return res.status(401).json({
        errorMessage: "Authorization token is required",
      });
    const verified = jwt.verify(token, "SECRET");
    if (verified) {
      req.user = verified.ifExists;
      next();
    } else {
      res.sendStatus(401);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Iternal Server Error",
    });
  }
};
