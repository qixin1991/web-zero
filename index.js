#!/usr/bin/env node
const fs = require('fs'),
    path = require('path'),
    tpl = require(path.join(__dirname, 'template', 'tpl.js')),
    pwd = process.cwd(),
    operation = process.argv[2],
    option = process.argv[3],
    db_type = process.argv[4],
    project_name = path.basename(pwd);
let pkg = require(path.join(__dirname, 'package.example.json'));

if (!operation || (operation !== 'init' && !option)) {
    usage_info();
    process.exit(0);
}
switch (operation) {
    case 'init':
        init();
        break;
    case 'new':
        new_module(option);
        break;
    case 'delete':
        delete_module(option);
        break;
    default:
        usage_info();
        break;
}

function usage_info() {
    const usage = `Usage: web-zero operation [init | new | delete] option [module_name] [databse_type]\n\nExample:\n\t web-zero init \t\t\t Create a api project named current dir.\n\t web-zero new users \t\t Create routes/users.js and dao/users.js files.\n\t web-zero new users mysql \t Create users module with DB base on mysql.\n\t web-zero delete users \t\t Delete routes/users.js and dao/users.js files.`;
    console.log(usage);
}

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

/**
 * delete route and dao files.
 */
async function delete_module(option) {
    await del_route(option);
    await del_dao(option);
}

async function del_route(option) {
    await new Promise((resolve, reject) => {
        fs.unlink(path.join(pwd, 'routes', option + '.js'), (err) => { // asynchronous delete
            console.log(` ---> Delete File\troutes/${option}.js \tsuccess...`);
            resolve();
        });
    });
}

async function del_dao(option) {
    await new Promise((resolve, reject) => {
        fs.unlink(path.join(pwd, 'dao', option + '.js'), (err) => { // asynchronous delete
            console.log(` ---> Delete File\tdao/${option}.js\t\tsuccess...`);
            resolve();
        });
    });
}

async function new_route(option) {
    await new Promise((resolve, reject) => {
        if (db_type && db_type == 'mysql') {
            fs.writeFile(path.join(pwd, 'routes', option + '.js'), tpl.router_mysql.replace(/\$option/g, option), (err) => {
                if (err)
                    throw err;
                console.log(` ---> Create File\troutes/${option}.js \tsuccess...`);
                resolve();
            });
        } else {
            fs.writeFile(path.join(pwd, 'routes', option + '.js'), tpl.base_router.replace(/\$option/g, option), (err) => {
                if (err)
                    throw err;
                console.log(` ---> Create File\troutes/${option}.js \tsuccess...`);
                resolve();
            });
        }
    });
}

async function new_dao(option) {
    await new Promise((resolve, reject) => {
        if (db_type && db_type == 'mysql') {
            fs.writeFile(path.join(pwd, 'dao', option + '.js'), tpl.mysql_dao.replace(/\$option/g, option), (err) => {
                if (err)
                    throw err;
                console.log(` ---> Create File\tdao/${option}.js\t\tsuccess...`);
                resolve();
            });
        } else {
            fs.writeFile(path.join(pwd, 'dao', option + '.js'), tpl.base_dao.replace(/\$option/g, option), (err) => {
                if (err)
                    throw err;
                console.log(` ---> Create File\tdao/${option}.js\t\tsuccess...`);
                resolve();
            });
        }
    });
}

/**
 * create route,dao,middleware and conf dir.
 */
async function init_dir() {
    await new Promise((resolve, reject) => {
        fs.mkdir(path.join(pwd, 'routes'), (err) => {
            if (err && err.code !== 'EEXIST')
                throw err;
            console.log(' ---> Create Directory\troutes\t\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.mkdir(path.join(pwd, 'dao'), (err) => {
            if (err && err.code !== 'EEXIST')
                throw err;
            console.log(' ---> Create Directory\tdao\t\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.mkdir(path.join(pwd, 'middleware'), (err) => {
            if (err && err.code !== 'EEXIST')
                throw err;
            console.log(' ---> Create Directory\tmiddleware\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.mkdir(path.join(pwd, 'conf'), (err) => {
            if (err && err.code !== 'EEXIST')
                throw err;
            console.log(' ---> Create Directory\tconf\t\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.mkdir(path.join(pwd, 'tools'), (err) => {
            if (err && err.code !== 'EEXIST')
                throw err;
            console.log(' ---> Create Directory\ttools\t\t\tsuccess...');
            resolve();
        });
    });
}

async function init_file() {
    /**
    * create app.js and write tpl code into it.
    */
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'app.js'), tpl.app, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tapp.js\t\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'routes', 'index.js'), tpl.index, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\troutes/index.js \tsuccess...');
            resolve();
        });
    });

    /**
    * create middleware/log.js
    */
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'middleware', 'log.js'), tpl.log, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tmiddleware/log.js \tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'middleware', 'koa-router-ext.js'), tpl.koa_router_ext, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tmiddleware/koa-router-ext.js \tsuccess...');
            resolve();
        });
    });

    /**
     * create config.js | db_development.js | db_production.js | db_staging.js
     */
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'conf', 'config.js'), tpl.config, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tconf/config.js\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'conf', 'db_development.js'), tpl.db_development, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tconf/db_development.js \tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'conf', 'db_staging.js'), tpl.db_staging, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tconf/db_staging.js \tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'conf', 'db_production.js'), tpl.db_production, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tconf/db_production.js \tsuccess...');
            resolve();
        });
    });

    /**
     * create mongo.js | redis.js | qiniu.js | mysql.js
     */
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'dao', 'mongo.js'), tpl.mongo, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tdao/mongo.js\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'dao', 'redis.js'), tpl.redis, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tdao/redis.js\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'dao', 'qiniu.js'), tpl.qiniu, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tdao/qiniu.js\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'dao', 'mysql.js'), tpl.mysql, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\tdao/mysql.js\t\tsuccess...');
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'tools', 'security.js'), tpl.tools, (err) => {
            if (err)
                throw err;
            console.log(' ---> Create File\ttools/security.js \tsuccess...');
            resolve();
        });
    });
}

/**
 * add dependencies to package.json
 */
async function init_dependencies() {
    pkg.dependencies = {
        "ioredis": "^2.3.0",
        "koa": "^2.0.0",
        "koa-bodyparser": "^3.2.0",
        "koa-exception": "^2.0.0",
        "koa-router": "^7.0.1",
        "koa-router-form-parser": "0.0.1",
        "mongodb": "^2.2.8",
        "mysql": "^2.11.1",
        "qiniu": "^6.1.11",
        "superagent": "^2.1.0"
    }
    pkg.name = project_name;
    await new Promise((resolve, reject) => {
        fs.writeFile(path.join(pwd, 'package.json'), JSON.stringify(pkg, null, 4), (err) => {
            if (err)
                throw err;
            console.log(' ---> Add dependencies \tsuccess...');
            resolve();
        });
    });
}
