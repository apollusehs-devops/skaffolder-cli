const request = require("request");
const cache = require("persistent-cache");
const globals = cache();
const chalk = require("chalk");
const properties = require("../properties");

module.exports = function(options, cb) {
  let token = globals.getSync("token");

  if (!options.headers) options.headers = {};
  if (token && !options.public) options.headers.Token = token;

  request(options, function(error, response, body) {
    if (error) {
      error = {
        message: error.code
      };
      console.error(chalk.red(error.message));
      if (cb) return cb(error.message);
      else process.exit(0);
    } else if (
      (body && typeof body == "String" && body.toLowerCase() == "not authorized") ||
      (body && body.message && body.message.toLowerCase() == "not authorized") ||
      response.statusCode == 502
    ) {
      error = {
        message: "Not Authorized, try to change user the command: 'sk login' or check the command you ran"
      };
      console.error(chalk.red(error.message));
      if (cb) return cb(error.message);
      else process.exit(0);
    } else if (response.statusCode == 401) {
      error = {
        message: "You should login with the command: 'sk login'"
      };
      console.error(chalk.red(error.message));
      if (cb) return cb(error.message);
      else process.exit(0);
    } else if (response.statusCode == 405) {
      error = {
        message: "User not allowed\r\nYou should login with command: 'sk login'"
      };
      console.error(chalk.red(error.message));
      if (cb) return cb(error.message);
      else process.exit(0);
    } else if (response.statusCode == 403) {
      error = {
        message: "Not permitted: " + body.message
      };
      console.error(chalk.red(error.message));
      console.error(chalk.blue("Please visit " + chalk.yellow(properties.endpoint + "/#!/upgrade")));
      if (cb) return cb(error.message);
      else process.exit(0);
    } else if (response.statusCode == 404) {
      error = {
        message: "URL not found"
      };
      console.error(chalk.red(body));
      if (cb) return cb(error.message);
      else process.exit(0);
    } else if (response.statusCode != 200) {
      error = {
        message: "ERROR " + response.statusCode
      };
      console.error(chalk.red(error.message));
      if (cb) return cb(error.message);
      else process.exit(0);
    }

    try {
      body = JSON.parse(body);
    } catch (e) {
      //console.log(chalk.yellow(e));
    }
    return cb(error, body);
  });
};
