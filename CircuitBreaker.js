const CircuitBreaker = require("opossum");

const options = {
  timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 300000, // After 30 seconds, try again.
};

/**
 * This function takes a async function and its arguments as parameters.
 */
const fire = (func, ...args) => {
  const breaker = new CircuitBreaker(func, options);
  return breaker.fire(...args);
};

module.exports.fire = fire;
