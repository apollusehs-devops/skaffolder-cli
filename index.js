#!/usr/bin/env node

const prog = require('caporal');
const createCmd = require('./lib/create');
const loginCmd = require('./lib/login');
const logoutCmd = require('./lib/logout');

prog
    .version('1.0.0')
    .command('new project', 'Create a new Skaffolder project')
    .action(createCmd)
    .command('login', 'Log in into Skaffolder')
    .action(loginCmd)
    .command('logout', 'Log out from Skaffolder')
    .action(logoutCmd);
//.argument('<template>', 'Template to use')
//.option('--variant <variant>', 'Which <variant> of the template is going to be created')

prog.parse(process.argv);