const UserData = require("../../models/user");

const users = (req, res) => {
  UserData.find((err, result) => {
    console.log(err);
    res.status(200).json(result);
  });
};

const user = (req, res) => {
  const id = req.params.id;
  UserData.findOne({ id }, req.body, (err, result) => {
    if (err) {
      return next(err);
    }
    console.log(result);
    res.status(201).json(result);
  });
};

module.exports = users;
