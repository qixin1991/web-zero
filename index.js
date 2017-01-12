#!/usr/bin/env node
const fs = require('fs'),
    path = require('path'),
    tpl = require(path.join(__dirname, 'template', 'tpl.js')),
    pwd = process.cwd(),
    operation = process.argv[2],
    option = process.argv[3];
console.log(pwd);
var pkg = require(path.join(pwd, 'package.json'));

switch (operation) {
    case 'init':
        var g = init();
        g.next();
        g.next();
        g.next();
        break;
    case 'new':
        if (!option) {
            console.error('please tell me the module name!');
            break;
        }
        var g = new_module(option);
        g.next();
        g.next();
        break;
    default:
        console.log(' Usage: web-zero operation [init | new] option [module_name]');
        break;
}

/**
 * init project.
 */
function* init() {
    yield init_dir();
    yield init_file();
    yield init_dependencies();
}

/**
 * create route and dao files.
 */
function* new_module(option) {
    yield new_route(option);
    yield new_dao(option);
}

function new_route(option) {
    fs.writeFile(path.join(pwd, 'routes', option + '.js'), tpl.base_router.replace(/\$option/g, option), (err) => {
        if (err)
            throw err;
        console.log(` ---> Create File routes/${option}.js success...`);
    });
}

function new_dao(option) {
    fs.writeFile(path.join(pwd, 'dao', option + '.js'), tpl.base_dao.replace(/\$option/g, option.toUpperCase()), (err) => {
        if (err)
            throw err;
        console.log(` ---> Create File dao/${option}.js success...`);
    });
}

/**
 * create route,dao,middleware and conf dir.
 */
function init_dir() {
    fs.mkdir(path.join(pwd, 'routes'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create Directory routes success...');
    });

    fs.mkdir(path.join(pwd, 'dao'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create Directory dao success...');
    });

    fs.mkdir(path.join(pwd, 'middleware'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create Directory middleware success...');
    });

    fs.mkdir(path.join(pwd, 'conf'), (err) => {
        if (err && err.code !== 'EEXIST')
            throw err;
        console.log(' ---> Create Directory conf success...');
    });
}

function init_file() {
    /**
    * create app.js and write tpl code into it.
    */
    fs.writeFile(path.join(pwd, 'app.js'), tpl.app, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File app.js success...');
    });

    /**
     * create routes/base.js
     */
    fs.writeFile(path.join(pwd, 'routes', 'base.js'), tpl.base, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File routes/base.js success...');
    });

    /**
    * create middleware/log.js
    */
    fs.writeFile(path.join(pwd, 'middleware', 'log.js'), tpl.log, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File middleware/log.js success...');
    });

    /**
     * create config.js | db_development.js | db_production.js | db_staging.js
     */
    fs.writeFile(path.join(pwd, 'conf', 'config.js'), tpl.config, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File conf/config.js success...');
    });

    fs.writeFile(path.join(pwd, 'conf', 'db_development.js'), tpl.db_development, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File conf/db_development.js success...');
    });

    fs.writeFile(path.join(pwd, 'conf', 'db_staging.js'), tpl.db_staging, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File conf/db_staging.js success...');
    });

    fs.writeFile(path.join(pwd, 'conf', 'db_production.js'), tpl.db_production, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File conf/db_production.js success...');
    });

    /**
     * create mongo.js | redis.js | qiniu.js | mysql.js
     */
    fs.writeFile(path.join(pwd, 'dao', 'mongo.js'), tpl.mongo, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File dao/mongo.js success...');
    });

    fs.writeFile(path.join(pwd, 'dao', 'redis.js'), tpl.redis, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File dao/redis.js success...');
    });

    fs.writeFile(path.join(pwd, 'dao', 'qiniu.js'), tpl.qiniu, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File dao/qiniu.js success...');
    });

    fs.writeFile(path.join(pwd, 'dao', 'mysql.js'), tpl.mysql, (err) => {
        if (err)
            throw err;
        console.log(' ---> Create File dao/mysql.js success...');
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

    fs.writeFile(path.join(pwd, 'package.json'), JSON.stringify(pkg, null, 4), (err) => {
        if (err)
            throw err;
        console.log(' ---> Add dependencies success...');
    });
}
