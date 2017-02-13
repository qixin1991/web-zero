module.exports = `"use strict";
const Koa = require('koa'),
  bodyParser = require('koa-bodyparser'),
  ex = require('koa-exception'),
  logger = require('./middleware/log'),
  fs = require('fs'),
  path = require('path'),
  formParser = require('koa-router-form-parser'),
  routerExt = require('./middleware/koa-router-ext'),
  app = new Koa();

// Cross-origin
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  await next();
});

// X-Response-Time Middleware
app.use(async (ctx, next) => {
  var start = new Date();
  await next();
  var ms = new Date() - start;
  ctx.set('X-Response-Time', ms + 'ms');
});

// Logger middleware
app.use(logger());
app.use(ex('CN'));
app.use(bodyParser());
app.use(formParser());
app.use(routerExt());

const routerDir = path.join(__dirname, 'routes');
var readFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(routerDir, (err, files) => {
      resolve(files.filter((f) => {
        return f.endsWith('.js') && f != 'base.js';
      }))
    });
  });
};

(async () => {
  let files = await readFiles();
  for (var file of files) {
    try {
      app.use(require(path.join(routerDir, file)).routes());
    } catch (error) {
      console.error(' ---> Start Failure, please check the config files.');
      process.exit(0);
    }
  }
})();

var port = 3000;
app.listen(port, function () {
  console.log(\` ---> Server running on port: \${port}\`);
});
`