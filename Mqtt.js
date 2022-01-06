const mqtt = require("mqtt");
const connectUrl = `mqtt://localhost:1883`;

/**
 * Object of subscribed topics. Used for exporting all topics at once
 */
const subscribedTopics = {
  getAllClinics: "get_all_clinics",
  getAClinic: "get_a_clinic",
};

const subscribedTopicsValues = Object.values(subscribedTopics);

/**
 * Object of published topics. Used for exporting all topics at once
 */
const publishedTopics = {
  storedClinicTopic: "stored_new_clinic",
  publishOneClinicFailed: "send_a_clinic/failed",
  publishOneClinicSucceeded: "send_a_clinic/succeeded",
  publishError: "clinicService/Error",
};

/**
 * Connect MQTT
 */
const client = mqtt.connect(connectUrl, {
  clientId: "Clinic Handler n°" + Math.random().toString(16).substr(2, 8),
  clean: true,
  will: {
    topic: "Team5/Dentistimo/ClinicHandler/LastWill",
    payload: "Clinic handler has been disconnected from the system",
    qos: 1,
  },
});

/**
 * Subscribe to new topics
 */
client.on("connect", () => {
  console.log("Connected");
  client.subscribe(subscribedTopicsValues, () => {
    console.log("Subscribes to topics:", subscribedTopicsValues);
  });
});

/**
 * Unsubscribe and disconnect from the broker
 */
function disconnect() {
  subscribedTopicsValues.forEach((topic) => {
    client.unsubscribe(topic, console.log("Unsubscribing to topic " + topic));
  });
  client.end();
  console.log("Disconnecting from MQTT broker.");
}

/**
 * What we expose from this file
 */
module.exports.client = client;
module.exports.disconnect = disconnect;
module.exports.subscribedTopics = subscribedTopics;
module.exports.publishedTopics = publishedTopics;
