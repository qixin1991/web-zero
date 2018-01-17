module.exports = {
  app: require('./tpl_app'),
  index: require('./tpl_index'),
  log: require('./tpl_log'),
  koa_router_ext: require('./tpl_router_ext'),
  config: require('./tpl_config'),
  db_development: require('./tpl_db_development'),
  db_staging: require('./tpl_db_staging'),
  db_production: require('./tpl_db_production'),
  mysql: require('./tpl_mysql'),
  redis: require('./tpl_redis'),
  mongo: require('./tpl_mongo'),
  qiniu: require('./tpl_qiniu'),
  base_router: require('./tpl_router'),
  base_dao: require('./tpl_dao'),
  tools: require('./tpl_tools'),
  router_mysql: require('./tpl_router_mysql'),
  mysql_dao: require('./tpl_dao_mysql')
}