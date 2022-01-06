const mongoose = require("mongoose");
const DentistModel = require("./models/dentist");

// Variables
const mongoURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@dentistimo0.vd9sq.mongodb.net/Dentistimo`;

// Connect to MongoDB
const connect = () =>
  mongoose.connect(
    mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );

const findDentists = async (filter) => {
  return DentistModel.find(filter).exec();
};

const findOneDentist = async (filter) => {
  return DentistModel.findOne(filter).exec();
};

const findDentistById = async (id) => {
  return DentistModel.findById(id).exec();
};

const saveDentist = async (dentist) => {
  const data = new DentistModel(dentist);
  return data.save();
};

module.exports.connect = connect;
module.exports.findDentists = findDentists;
module.exports.findOneDentist = findOneDentist;
module.exports.findDentistById = findDentistById;
module.exports.saveDentist = saveDentist;
