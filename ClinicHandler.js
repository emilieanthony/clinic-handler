require("dotenv").config();

const fetch = require("node-fetch");
const mqtt = require("./Mqtt");
const database = require("./Database");
const circuitBreaker = require("./CircuitBreaker");

/**  Listens to message reception and reacts based on the topic */
const listenToSubscriptions = () =>
  mqtt.client.on("message", async (topic, payload) => {
    console.log("Received Message:", topic, payload.toString());
    console.log(topic);
    switch (topic) {
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

const getDentistDataFromGithub = async () => {
  console.log("Fetching dentists from Github");
  return circuitBreaker
    .fire(
      fetch,
      "https://raw.githubusercontent.com/feldob/dit355_2020/master/dentists.json"
    )
    .then((response) => {
      return response.json();
    });
};

// Save Github dentists to database
const saveGithubDentists = async () => {
  try {
    const response = await getDentistDataFromGithub();
    console.log("Updating Database");
    for (let i = 0; i < response.dentists.length; i++) {
      let currentDentist = response.dentists[i];
      const result = await database.findOneDentist({
        id: currentDentist.id,
      });
      if (result === null) {
        await database.save(currentDentist);
        console.log(currentDentist.name + " saved to database.");
      } else {
        console.log(currentDentist.name + " already in database.");
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const publishAllClinics = async () => {
  const dentists = await database.findDentists();
  dentists.forEach((dentist) => {
    mqtt.client.publish(
      mqtt.publishedTopics.storedClinicTopic,
      JSON.stringify(dentist),
      { qos: 2 }
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
const getClinicFromDatabase = async (requestedClinic) => {
  let clinicID = requestedClinic._id;
  try {
    const clinic = await database.findDentistById(clinicID);
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
  } catch (err) {
    mqtt.client.publish(
      mqtt.publishedTopics.publishOneClinicFailed,
      JSON.stringify({ error: err.message }),
      { qos: 1 }
    );
  }
};

/**
 * This function is called in Menu to start the Clinic Handler
 * The funtion makes sure database is connected before updating the database and
 * that the logging in terminal is done in sequential order
 */
const startServer = async () => {
  try {
    await database.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB");
    console.error(err.stack);
    process.exit(1);
  }
  listenToSubscriptions();
  saveGithubDentists();
};

/**
 * What we expose from this file
 */
module.exports.start = startServer;
