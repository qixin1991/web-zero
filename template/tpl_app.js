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

// Logger middleware
app.use(logger());
app.use(ex('CN'));
app.use(bodyParser());
app.use(formParser());
// getUserInfo Middleware. Warning: if the user info saved at mysql, remember to edit this module to adpter it. Default user info was saved at mongodb.
app.use(routerExt());

const routerDir = path.join(__dirname, 'routes');
let readFiles = (readDir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(readDir, (err, files) => {
      resolve(files.filter((f) => {
        return f.endsWith('.js') || fs.statSync(path.join(readDir, f)).isDirectory();
      }));
    });
  });
};

// load router and nested router
async function loadRoutes(readDir) {
  let files = await readFiles(readDir);
  for (let file of files) {
    try {
      let currentPath = path.join(readDir, file);
      if (fs.statSync(currentPath).isDirectory()) {
        await loadRoutes(currentPath);
      } else {
        app.use(require(currentPath).routes());
      }
    } catch (error) {
      console.error(' ---> Start Failure.',error);
      process.exit(0);
    }
  }
}

(async () => {
  await loadRoutes(routerDir);
})();

let port = 3000;
app.listen(port, function () {
  console.log(\` ---> Server running on port: \${port}\`);
});
`