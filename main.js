const request = require("request");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
const DentistsData = require("./models/dentist");
const dentist = require("./models/dentist");
//const MapsData = require("./models/map");
//const RequestData = require("./models/request");
//const ResponsesData = require("./models/response");

// Variables
const mongoURI = "mongodb://localhost:27017/dentistimoDB";
const port = process.env.PORT || 3000;
const connectUrl = `mqtt://localhost:1883`;

// Subscribed Topics
const newClinicTopic = "new_clinic";
const storedClinicTopic = "stored_new_clinic";
const getAllClinics = "get_all_clinics";
const getAClinic = "get_a_clinic";

// Published topics
const publishOneClinicFailed = 'send_a_clinic/failed'
const publishOneClinicSucceeded = 'send_a_clinic/succeeded'

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
  client.subscribe([newClinicTopic, getAllClinics, getAClinic], () => {
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
  } else if (topic === getAClinic){
    getClinic(payload);
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

/**
 * Method that parses the message into a json object and forwards it to query the database.
 * @param payload (message as a string). Needs to contain the database _id and be parsable into a JSON object.
 */
function getClinic(payload){
  let requestedClinic = JSON.parse(payload);
  getClinicFromDatabase(requestedClinic)
}

/**
 * Query the database to retrieve a given clinic. Publishes the result of the query to the appropriate topics via mqtt.
 * @param requestedClinic json object clinic: Needs to contain the database _id and be parsable into a JSON object.
 */
function getClinicFromDatabase(requestedClinic) {
  let clinicID = requestedClinic._id
  dentist.findById(clinicID, function(err, clinic){
    if (err){
      client.publish(publishOneClinicFailed, JSON.stringify({'error' : err.message}), {qos:1})
    }else{
      if(clinic !== null){
        client.publish(publishOneClinicSucceeded, JSON.stringify(JSON.stringify(clinic)), {qos:1})
      }else{
        client.publish(publishOneClinicFailed, JSON.stringify({'error' : 'Clinic not found in the database.'}), {qos:1})
      }
    }
  })
}
