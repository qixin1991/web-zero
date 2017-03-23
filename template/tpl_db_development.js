module.exports = `let config = {
  Qiniu: {
    ACCESS_KEY: '',
    SECRET_KEY: '',
    bucket: ''
  },
  Mongo: {
    url: 'mongodb://'
  },
  Redis: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    ttl: 60 * 60 * 24 * 7,   // expires in 7 days.
    cluster: [
      {
        host: '127.0.0.1',
        port: 6379
      },
      {
        host: '',
        port: 6379
      },
      {
        host: '',
        port: 6379
      },
      {
        host: '',
        port: 6379
      },
      {
        host: '',
        port: 6379
      },
      {
        host: '',
        port: 6379
      }
    ]
  },
  Mysql: {
    host: '',
    user: '',
    password: '',
    database: '',
    connectionLimit: 500,
    charset: 'UTF8_GENERAL_CI',
    connectTimeout: 10000,
    dateStrings: true,
    multipleStatements: true,
    master1: {
      host: '',
      user: '',
      password: '',
      database: '',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    },
    slave1: {
      host: '',
      user: '',
      password: '',
      database: '',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    }
  }
};

module.exports = config;
`