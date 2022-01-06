require("dotenv").config();

const request = require("request");
const mqtt = require("./Mqtt");
const database = require("./Database");

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
        try {
          const result = await database.findOneDentist({
            id: currentDentist.id,
          });
          if (result === null) {
            await database.save(currentDentist);
            console.log(currentDentist.name + " saved to database.");
          } else {
            console.log(currentDentist.name + " already in database.");
          }
        } catch (err) {
          console.log(err.message);
        }
      }
    }
  );
}

const publishAllClinics = async () => {
  const dentists = await database.findDentists();
  dentists.forEach((dentist) => {
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

const startServer = () => {
  database.connect();
  listenToSubscriptions();
  // Updates database
  setInterval(() => updateDB(), 1000 * 60 * 60 * 24);
  updateDB();
};

module.exports.start = startServer;
