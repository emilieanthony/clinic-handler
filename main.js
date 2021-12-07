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
  client.subscribe([newClinicTopic], () => {
    console.log(`Subscribe to topic '${newClinicTopic}'`);
  });
});

// Handle messages on the topics that are subscribed to
client.on("message", (topic, payload) => {
  console.log("Received Message:", topic, payload.toString());
  const data = JSON.parse(payload);
  if (payload) console.log(data);
  if (topic === newClinicTopic) {
    const dentist = new DentistsData(data);
    dentist.save(function (err, newDentist) {
      if (err) return console.error(err);
      console.log(dentist.name + " saved to database.");
      client.publish(storedClinicTopic, JSON.stringify(newDentist));
    });
  }

  if (data.type === "users") {
    UserData.find((err, result) => {
      console.log(err);
      client.publish(topic, JSON.stringify(result), {
        qos: 0,
        retain: false,
      });
    });
  }

  if (data.type === "maps") {
    DentistsData.find((err, result) => {
      console.log(err);
      client.publish(topic, JSON.stringify(result), { qos: 0, retain: false });
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

// Updates database from json one time per minute
setInterval(() => updateDB(), 1000 * 60 * 60 * 24);
updateDB();

/* 
fetchData();
//http
const updateDB = async () => {
  const { dentists } = require("./assets/dentists.json");
  // delete all every time server starts
  await DentistsData.deleteMany({});
  // insert from JSON file
  await DentistsData.insertMany(dentists);
  // go over each dentist to publish for the dentists in the system
  dentists.forEach((dentist) => {
    client.publish(storedClinicTopic, JSON.stringify(dentist));
    console.log("Published dentists:" + dentist.name);
  });
  // await DentistsData.updateMany(dentists);
  // for (const d of dentists) {
  //   const dentist = await DentistsData.findOne({ id: d.id }).exec();
  //   if (!dentist) {
  //     await DentistsData.create(d);
  //   } else {
  //     await DentistsData.updateOne(d);
  //   }
  // }
}; */

// mqtt request for front
// const { client } = useMqttState();

// function handleClick(message) {
//   return client.publish('esp32/led', message);
// }
