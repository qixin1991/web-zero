#!/usr/bin/env babel-node
const fs = require('fs'),
    path = require('path');
const tpl = require(path.join(__dirname, 'template', 'tpl.js'));
var pkg = require('./package.json');

const operation = process.argv[2],
    option = process.argv[3];

switch (operation) {
    case 'init':
        init();
        break;
    case 'new':
        if (!option) {
            console.error('please tell me the module name!');
            break;
        }
        new_module(option);
        break;
    default:
        console.log(' Usage: web-zero operation [init | new] option [module_name]');
        break;
}
// init();

/**
 * init project.
 */
async function init() {
    await init_dir();
    await init_file();
    await init_dependencies();
}

/**
 * create route and dao files.
 */
async function new_module(option) {
    await new_route(option);
    await new_dao(option);
}

function new_route(option) {
    fs.writeFile(path.join(__dirname, 'routes', option + '.js'), tpl.base_router.replace(/\$option/g, option), (err) => {
        if (err)
            throw err;
        console.log(` ---> Create routes/${option}.js success...`);
    });
}

function new_dao(option) {
    fs.writeFile(path.join(__dirname, 'dao', option + '.js'), tpl.base_dao.replace(/\$option/g, option.toUpperCase()), (err) => {
        if (err)
            throw err;
        console.log(` ---> Create dao/${option}.js success...`);
    });
}

/**
 * create route and dao dir.
 */
function init_dir() {
    fs.mkdir(path.join(__dirname, 'routes'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create routes dir success...');
    });

    fs.mkdir(path.join(__dirname, 'dao'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create dao dir success...');
    });

    fs.mkdir(path.join(__dirname, 'middleware'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create middleware dir success...');
    });

    fs.mkdir(path.join(__dirname, 'conf'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create middleware dir success...');
    });
}

function init_file() {
    /**
    * create app.js and write tpl code into it.
    */
    fs.writeFile(path.join(__dirname, 'app.js'), tpl.app, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create app.js success...');
    });

    /**
     * create routes/base.js
     */
    fs.writeFile(path.join(__dirname, 'routes', 'base.js'), tpl.base, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create routes/base.js success...');
    });

    /**
    * create middleware/log.js
    */
    fs.writeFile(path.join(__dirname, 'middleware', 'log.js'), tpl.log, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create middleware/log.js success...');
    });

    /**
     * create config.js | db_development.js | db_production.js | db_staging.js
     */
    fs.writeFile(path.join(__dirname, 'conf', 'config.js'), tpl.config, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create conf/config.js success...');
    });

    fs.writeFile(path.join(__dirname, 'conf', 'db_development.js'), tpl.db_development, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create conf/db_development.js success...');
    });

    fs.writeFile(path.join(__dirname, 'conf', 'db_staging.js'), tpl.db_staging, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create conf/db_staging.js success...');
    });

    fs.writeFile(path.join(__dirname, 'conf', 'db_production.js'), tpl.db_production, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create conf/db_production.js success...');
    });

    /**
     * create mongo.js | redis.js | qiniu.js | mysql.js
     */
    fs.writeFile(path.join(__dirname, 'dao', 'mongo.js'), tpl.mongo, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create dao/mongo.js success...');
    });

    fs.writeFile(path.join(__dirname, 'dao', 'redis.js'), tpl.redis, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create dao/redis.js success...');
    });

    fs.writeFile(path.join(__dirname, 'dao', 'qiniu.js'), tpl.qiniu, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create dao/qiniu.js success...');
    });

    fs.writeFile(path.join(__dirname, 'dao', 'mysql.js'), tpl.mysql, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create dao/mysql.js success...');
    });
}

/**
 * add dependencies to package.json
 */
function init_dependencies() {
    pkg.dependencies = {
        "expect.js": "^0.3.1",
        "formidable": "^1.0.17",
        "ioredis": "^2.3.0",
        "koa": "^2.0.0",
        "koa-bodyparser": "^3.2.0",
        "koa-exception": "^2.0.0",
        "koa-router": "^7.0.1",
        "moment": "^2.15.1",
        "mongodb": "^2.2.8",
        "mysql": "^2.11.1",
        "qiniu": "^6.1.11",
        "redlock": "^2.0.1",
        "superagent": "^2.1.0"
    }

    fs.writeFile(path.join(__dirname, 'package.json'), JSON.stringify(pkg, null, 4), (err) => {
        if (err)
            throw err;
        console.log(' ---> Add dependencies success...');
    });
}
