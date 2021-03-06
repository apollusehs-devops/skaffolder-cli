let pathWorkspace = "./";
const pathTemplate = ".skaffolder/template/";
const fs = require("fs");
const path = require("path");
const async = require("async");
const chalk = require("chalk");

exports.pathTemplate = pathTemplate;

exports.generate = function(workspacePrefix, files, logger, cb) {
  let project = files.project;
  let modules = files.modules;
  let resources = files.resources;
  let dbs = files.dbs;
  let roles = files.roles;
  let genFiles = getGenFiles(workspacePrefix + pathTemplate);
  let log = [];

  try {
    // logger.info(chalk.green("START GENERATE "));
    log.push("<h1>START GENERATE</h1>");

    const utils = require("./GeneratorUtils.js");
    utils.init(workspacePrefix + pathWorkspace, project, modules, resources, dbs, roles);

    async.each(
      genFiles,
      function(file, cbFile) {
        log.push(
          "<div class='file-result elaborated'><label>Elaborate file</label><div class='file-name'>" + file.name + "</div></div>"
        );
        // logger.info(chalk.green("Elaborate file "), file.name);

        generateFile(file, log, utils, project, modules, resources, dbs);

        cbFile(null);
      },
      function(err) {
        log.push("<h2>GENERATION COMPLETE</h2>");

        cb(err, log);
      }
    );
  } catch (e) {
    console.error(e);
  }
};

const generateSingleFile = function(workspacePrefix, generateFilePath, data) {
  let log = [];

  // template file
  let templatePath = workspacePrefix + ".skaffolder/template";
  let fileTemplatePath = templatePath + path.sep + generateFilePath + ".hbs";
  let fileTemplateObj = parseTemplateFile(templatePath, fileTemplatePath);

  // Utils
  const utils = require("./GeneratorUtils.js");
  utils.init(workspacePrefix + pathWorkspace, data.project, data.modules, data.resources, data.dbs, data.roles);

  // Generate file
  generateFile(fileTemplateObj, log, utils, data.project, data.modules, data.resources, data.dbs);
};

const generateFile = function(file, log, utils, project, modules, resources, dbs, opt) {
  if (!file.forEachObj || file.forEachObj == "oneTime") {
    return utils.generateFile(log, file, {}, opt);
  } else if (file.forEachObj == "db") {
    if (opt && opt.paramsForEach) {
      for (let index in dbs) {
        if (dbs[index]._id.toString() == opt.paramsForEach) {
          let db = resources[index];
          db._entity = dbs[index]._entity;
          return utils.generateFile(
            log,
            file,
            {
              db: db
            },
            opt
          );
        }
      }
    } else {
      for (let index in dbs) {
        let db = resources[index];
        db._entity = dbs[index]._entity;
        utils.generateFile(
          log,
          file,
          {
            db: db
          },
          opt
        );
      }
    }
  } else if (file.forEachObj == "table") {
    for (let index in dbs) {
      let db = dbs[index];
      for (let indexEnt in dbs[index]._entity) {
        let entity = dbs[index]._entity[indexEnt];

        if (opt && opt.paramsForEach) {
          if (entity._id.toString() == opt.paramsForEach)
            return utils.generateFile(
              log,
              file,
              {
                entity: entity,
                db: db
              },
              opt
            );
        } else {
          utils.generateFile(
            log,
            file,
            {
              entity: entity,
              db: db
            },
            opt
          );
        }
      }
    }
  } else if (file.forEachObj == "module") {
    for (let index in modules) {
      let mod = modules[index];
      let moduleLink = {
        url: ""
      };
      let templateName = "";
      let templateResourceName = "";
      let linkUrl = "";
      let crudResource = "";

      if (mod.template) {
        let typeLink = "";

        // TROVA RISORSA CRUD
        if (mod._template_resource) {
          for (dbId in resources) {
            let resourcesForDb = resources[dbId]._resources;
            for (resId in resourcesForDb) {
              let resource = resourcesForDb[resId];
              if (mod._template_resource.toString() == resource._id) {
                crudResource = resource;
              }
            }
          }

          if (crudResource == "") {
            log.push("Resource CRUD not found: " + mod._template_resource.toString());
          }
        }

        // TROVA LINK MODULO
        for (modId in modules) {
          let module = modules[modId];
          if (
            module.template == "List_Crud" &&
            mod._template_resource &&
            module._template_resource &&
            module._template_resource.toString() == mod._template_resource.toString()
          ) {
            moduleLink = modules[modId];
          }
        }
      }

      if (opt && opt.paramsForEach) {
        if (mod._id.toString() == opt.paramsForEach) {
          return utils.generateFile(
            log,
            file,
            {
              module: mod,
              crudResource: crudResource,
              linkUrl: moduleLink.url.replace("{id}", "") + "/"
            },
            opt
          );
        }
      } else {
        utils.generateFile(
          log,
          file,
          {
            module: mod,
            crudResource: crudResource,
            linkUrl: moduleLink.url.replace("{id}", "") + "/"
          },
          opt
        );
      }
    }
  } else if (file.forEachObj == "resource") {
    for (let index in resources) {
      let db = resources[index];
      for (let indexRes in resources[index]._resources) {
        let resource = resources[index]._resources[indexRes];

        //console.log(resource._entity._attrs);
        if (opt && opt.paramsForEach) {
          if (resource._id.toString() == opt.paramsForEach)
            return utils.generateFile(
              log,
              file,
              {
                resource: resource,
                db: db
              },
              opt
            );
        } else {
          utils.generateFile(
            log,
            file,
            {
              resource,
              db: db
            },
            opt
          );
        }
      }
    }
  }
};

// Convert folder file hbs to generator files db
const getGenFiles = function(pathTemplate) {
  let klawSync = require("klaw-sync");

  if (!fs.existsSync(pathTemplate)) return null;

  //console.log("-----" + pathTemplate);
  return klawSync(pathTemplate, {
    nodir: true
  })
    .map(file => {
      return parseTemplateFile(pathTemplate, file.path);
    })
    .filter(file => file);
};

const getProperties = (content, nameFileTemplate, pathTemplate) => {
  // get properties
  let start = "**** PROPERTIES SKAFFOLDER ****";
  let end = "**** END PROPERTIES SKAFFOLDER ****";
  let startPropr = content.indexOf(start);
  let endPropr = content.indexOf(end);

  if (startPropr == -1 || endPropr == -1) {
    console.warn(chalk.yellow("WARN:") + " Properties Skaffoler not found in file " + nameFileTemplate);
    return {
      template: content,
      forEachObj: "oneTime"
    };
  }

  let properties = content.substr(startPropr + start.length, endPropr - start.length);

  // backticks
  res = properties.search(/`(.|\r\n|\r|\n)*`/g);
  backticks = properties.match(/`(.|\r\n|\r|\n)*`/g);
  for (i in backticks) {
    replacement = backticks[i]
      .replace(/"/g, '\\"')
      .replace(/`/g, '"')
      .replace(/\r\n/g, "\\r\\n")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t");
    properties = properties.replace(backticks[i], replacement);
  }
  properties = JSON.parse(properties);

  // search list edit template
  let nameTemplateList = nameFileTemplate + "_SK_LIST.hbs";
  let fileNameList = pathTemplate + "/" + nameTemplateList;
  if (fs.existsSync(fileNameList)) {
    properties.templateList = fs.readFileSync(fileNameList, "utf-8");
  }

  let nameTemplateEdit = nameFileTemplate + "_SK_EDIT.hbs";
  let fileNameEdit = pathTemplate + "/" + nameTemplateEdit;
  if (fs.existsSync(fileNameEdit)) {
    properties.templateEdit = fs.readFileSync(fileNameEdit, "utf-8");
  }

  // set template
  properties.template = content.substr(endPropr + end.length);

  if (properties.template.charAt(0) == "\r") properties.template = properties.template.substr(1);

  if (properties.template.charAt(0) == "\n") properties.template = properties.template.substr(1);

  if (!properties.forEachObj) properties.forEachObj = "oneTime";

  return properties;
};

function parseTemplateFile(pathTemplate, filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let nameFileTemplate = path.relative(pathTemplate, filePath);
  // Remove extension
  if (nameFileTemplate.substr(-4) == ".hbs") {
    nameFileTemplate = nameFileTemplate.substr(0, nameFileTemplate.length - 4);
    // CHECK LIST EDIT FILE
    if (nameFileTemplate.substr(-8) == "_SK_EDIT" || nameFileTemplate.substr(-8) == "_SK_LIST") {
      nameFileTemplate = nameFileTemplate.substr(0, nameFileTemplate.length - 8);
      return null;
    }
    // get properties
    let genFile = getProperties(content, nameFileTemplate, pathTemplate);
    genFile.name = nameFileTemplate;
    return genFile;
  } else {
    // Binary file
    let content = fs.readFileSync(filePath, "binary");
    return {
      templateBinary: content,
      name: nameFileTemplate
    };
  }
}

exports.getGenFiles = getGenFiles;
exports.generateFile = generateFile;
exports.parseTemplateFile = parseTemplateFile;
exports.generateSingleFile = generateSingleFile;
