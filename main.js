const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

const { public, private } = require("./routes");

// Variables
const mongoURI = "mongodb://localhost:27017/dentistimoDB";
const port = process.env.PORT || 3000;

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

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(public);
app.use(private);

app.listen(port, () => {
  console.log("Server start");
});

const mqtt = require("mqtt");
const connectUrl = `mqtt://localhost:1883`;
const topic = "/nodejs/mqtt";
const UserData = require("./models/user");
const MapsData = require("./models/map");
const DentistsData = require("./models/dentist");
const RequestData = require("./models/request");
const ResponsesData = require("./models/response");

const client = mqtt.connect(connectUrl, {
  // clientId,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  console.log("Connected");
  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}'`);
  });
});


client.on("message", (topic, payload) => {
  console.log("Received Message:", topic, payload.toString());
  const data = JSON.parse(payload);
  if (payload) console.log(data);

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
//http 
const updateDB = async () => {
  const { dentists } = require("./assets/dentists.json");
  await DentistsData.deleteMany({});
  await DentistsData.insertMany(dentists);
  // await DentistsData.updateMany(dentists);
  // for (const d of dentists) {
  //   const dentist = await DentistsData.findOne({ id: d.id }).exec();
  //   if (!dentist) {
  //     await DentistsData.create(d);
  //   } else {
  //     await DentistsData.updateOne(d);
  //   }
  // }
};
// updates database from json one time per minute
setInterval(() => updateDB(), 1000 * 60);

updateDB();

// mqtt request for front
// const { client } = useMqttState();

// function handleClick(message) {
//   return client.publish('esp32/led', message);
// }