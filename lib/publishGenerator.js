const generatorUtils = require("../utils/generator");
const validator = require("../utils/validator");
const chalk = require("chalk");
const questionService = require("../utils/questionService");
const projectService = require("../service/projectService");

module.exports = async (args, options, logger) => {
  // VALIDATOR
  if (!validator.isSkaffolderFolder()) return;

  const resultOverwrite = await questionService.askConfirm(
    "Do you want to share ./.skaffolder/template folder with the Skaffolder community?"
  );
  if (resultOverwrite.value == true) {
    // get files
    let genFiles = generatorUtils.getGenFiles("./.skaffolder/template");

    // get helpers
    let extra = {};
    try {
      extra = require(process.cwd() + "/extra");

      for (let i in extra.helpers) {
        extra.helpers[i].fn = extra.helpers[i].fn.toString();
      }
    } catch (e) {}

    projectService.shareGenerator(genFiles, extra.helpers, function() {
      logger.info(chalk.green("✔  Generator files shared"));
      logger.info(
        chalk.blue("The Skaffolder team will check this generator and it will be published if quality standards are ok.")
      );
      logger.info(chalk.blue("We will contact you at your account email"));
    });
  } else {
    process.exit(0);
  }
};
