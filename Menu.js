const inquirer = require("inquirer");

const mqtt = require("./Mqtt.js");
const clinicHandler = require("./ClinicHandler");

/**
 * Waits for user input to close the clinic handler. Closing the clinic handler disconnects the component in a clean way from the system
 */
module.exports.printMenu = function () {
  clinicHandler.start();
  inquirer
    .prompt([
      {
        type: "terminate program",
        message: 'To close the program, press "x" followed by "enter" \n',
        name: "closeInput",
        validate: isX,
      },
    ])
    .then((answer) => {
      mqtt.disconnect();
      console.log("See you around!");
      process.exit();
    });
};

/**
 * Checks if the given value is === to x or X
 * @param value
 * @returns {string|boolean}
 */
const isX = (value) => {
  if (value === "x" || value === "X") {
    return true;
  }
  return 'Wrong input. Please press "x" followed by "enter" to quit the program';
};
