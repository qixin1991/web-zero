module.exports = `let env = process.env.NODE_ENV;

let allowEnvs = ['development','production','staging'];
if ( allowEnvs.indexOf(env) < 0 ) {
  // Invalidation env. Load with a default value:development.
  env = 'development';
}
console.log(' ---> Loading config for: NODE_ENV='+env);

let db = require('./db_'+env);

let config = {
  Qiniu: db.Qiniu,
  Mongo: db.Mongo,
  Redis: db.Redis,
  Mysql: db.Mysql
};

module.exports = config;
`