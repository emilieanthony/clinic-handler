const request = require("request");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
const UserData = require("./models/user");
const DentistsData = require("./models/dentist");
const dentist = require("./models/dentist");
//const MapsData = require("./models/map");
//const RequestData = require("./models/request");
//const ResponsesData = require("./models/response");

// Variables
const mongoURI = "mongodb://localhost:27017/dentistimoDB";
const port = process.env.PORT || 3000;
const connectUrl = `mqtt://localhost:1883`;

// Topics
const newClinicTopic = "new_clinic";
const storedClinicTopic = "stored_new_clinic";
const getAllClinics = "get_all_clinics";

// Connect to MongoDB
mongoose.connect(
  mongoURI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (err) {
      console.error(`Failed to connect to MongoDB with URI: ${mongoURI}`);
      console.error(err.stack);
      process.exit(1);
    }
    console.log(`Connected to MongoDB with URI: ${mongoURI}`);
  }
);

// Connect MQTT
const client = mqtt.connect(connectUrl, {
  // clientId,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

// Subscribe to new topics
client.on("connect", () => {
  console.log("Connected");
  client.subscribe([newClinicTopic, getAllClinics], () => {
    console.log(`Subscribe to topic '${newClinicTopic}'`);
  });
});

// Handle messages on the topics that are subscribed to
client.on("message", async (topic, payload) => {
  console.log("Received Message:", topic, payload.toString());
  //if (payload) console.log(data);
  if (topic === newClinicTopic) {
    const data = JSON.parse(payload);
    const dentist = new DentistsData(data);
    dentist.save(function (err, newDentist) {
      if (err) return console.error(err);
      console.log(dentist.name + " saved to database.");
      client.publish(storedClinicTopic, JSON.stringify(newDentist));
    });
  } else if (topic === getAllClinics) {
    const dentists = await dentist.find();
    dentists.forEach((dentist) => {
      client.publish(storedClinicTopic, JSON.stringify(dentist));
      console.log("Published dentists:" + dentist.name);
    });
  }
});

// Get dentist data and publish
function updateDB() {
  request(
    "https://raw.githubusercontent.com/feldob/dit355_2020/master/dentists.json",
    { json: true },
    async (err, res, body) => {
      if (err) {
        return console.log(err);
      }
      await DentistsData.deleteMany({});
      //store in database
      DentistsData.create(body.dentists, function (err, dentists) {
        if (err) {
          console.error(err);
          return;
        }
        dentists.forEach((dentist) => {
          client.publish(storedClinicTopic, JSON.stringify(dentist));
          console.log("Published dentists:" + dentist.name);
        });
      });
    }
  );
}

// Updates database
setInterval(() => updateDB(), 1000 * 60 * 60 * 24);
updateDB();

