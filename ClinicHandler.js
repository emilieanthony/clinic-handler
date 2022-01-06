require("dotenv").config();

const request = require("request");
const mongoose = require("mongoose");
const DentistsData = require("./models/dentist");
const mqtt = require("./Mqtt");

// Variables
const mongoURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@dentistimo0.vd9sq.mongodb.net/Dentistimo`;

// Connect to MongoDB
const connectToDatabase = () =>
  mongoose.connect(
    mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err) {
      if (err) {
        console.error("Failed to connect to MongoDB");
        console.error(err.stack);
        process.exit(1);
      }
      console.log("Connected to MongoDB");
    }
  );

/**  Listens to message reception and reacts based on the topic */
const listenToSubscriptions = () =>
  mqtt.client.on("message", async (topic, payload) => {
    console.log("Received Message:", topic, payload.toString());
    console.log(topic);
    switch (topic) {
      case mqtt.subscribedTopics.newClinicTopic:
        addNewClinic(payload);
        break;
      case mqtt.subscribedTopics.getAllClinics:
        console.log("Publish all clinics");
        publishAllClinics();
        break;
      case mqtt.subscribedTopics.getAClinic:
        getClinic(payload);
        break;
      default:
        break;
    }
  });

const addNewClinic = (payload) => {
  try {
    let data = JSON.parse(payload);
    const dentist = new DentistsData(data);
    DentistsData.findOne(dentist.id, function (err, result) {
      if (result === null) {
        dentist.save(function (err, newDentist) {
          if (err) return console.error(err);
          console.log(dentist.name + " saved to database.");
          mqtt.client.publish(
            mqtt.publishedTopics.storedClinicTopic,
            JSON.stringify(newDentist)
          );
        });
      } else {
        console.log(dentist.name + " already in database.");
        mqtt.client.publish(
          mqtt.publishedTopics.storedClinicTopic,
          JSON.stringify(isInDatabase)
        );
      }
    });
  } catch (error) {
    mqtt.client.publish(
      mqtt.publishedTopics.publishError,
      "Parsing error: " + error.toString()
    );
    console.log(error);
  }
};

const publishAllClinics = async () => {
  const dentist = await DentistsData.find();
  dentist.forEach((dentist) => {
    mqtt.client.publish(
      mqtt.publishedTopics.storedClinicTopic,
      JSON.stringify(dentist)
    );
    console.log("Published dentists:" + dentist.name);
  });
};
/**
 * Method that parses the message into a json object and forwards it to query the database.
 * @param payload (message as a string). Needs to contain the database _id and be parsable into a JSON object.
 */
function getClinic(payload) {
  try {
    let requestedClinic = JSON.parse(payload);
    getClinicFromDatabase(requestedClinic);
  } catch (error) {
    mqtt.client.publish(
      mqtt.publishedTopics.publishError,
      "Parsing error: " + error.toString()
    );
    console.log(error);
  }
}

/**
 * Query the database to retrieve a given clinic. Publishes the result of the query to the appropriate topics via mqtt.
 * @param requestedClinic json object clinic: Needs to contain the database _id and be parsable into a JSON object.
 */
function getClinicFromDatabase(requestedClinic) {
  let clinicID = requestedClinic._id;
  DentistsData.findById(clinicID, function (err, clinic) {
    if (err) {
      mqtt.client.publish(
        mqtt.publishedTopics.publishOneClinicFailed,
        JSON.stringify({ error: err.message }),
        { qos: 1 }
      );
    } else {
      if (clinic !== null) {
        mqtt.client.publish(
          mqtt.publishedTopics.publishOneClinicSucceeded,
          JSON.stringify(JSON.stringify(clinic)),
          { qos: 1 }
        );
      } else {
        mqtt.client.publish(
          mqtt.publishedTopics.publishOneClinicFailed,
          JSON.stringify({ error: "Clinic not found in the database." }),
          { qos: 1 }
        );
      }
    }
  });
}

// Get dentist data from URL and publish
function updateDB() {
  console.log("Updating Database");
  request(
    "https://raw.githubusercontent.com/feldob/dit355_2020/master/dentists.json",
    { json: true },
    async (err, res, body) => {
      if (err) {
        return console.log(err);
      }
      for (let i = 0; i < body.dentists.length; i++) {
        let currentDentist = body.dentists[i];
        DentistsData.findOne({ id: currentDentist.id }, function (err, result) {
          if (err) {
            console.log(err.message);
          } else {
            if (result === null) {
              let newDentist = new DentistsData(currentDentist);
              newDentist.save(function (err, currentDentist) {
                if (err) {
                  return console.error(err);
                } else {
                  console.log(currentDentist.name + " saved to database.");
                }
              });
            } else {
              console.log(currentDentist.name + " already in database.");
            }
          }
        });
      }
    }
  );
}

const startServer = () => {
  connectToDatabase();
  listenToSubscriptions();
  // Updates database
  setInterval(() => updateDB(), 1000 * 60 * 60 * 24);
  updateDB();
};

module.exports.start = startServer;
