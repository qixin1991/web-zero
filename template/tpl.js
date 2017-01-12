module.exports = {
  app: `"use strict";
var Koa = require('koa');
var bodyParser = require('koa-bodyparser');
var ex = require('koa-exception');
var logger = require('./middleware/log');
var fs = require('fs');
const path = require('path');

const app = new Koa();
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
// // 异常统一处理器: 捕获业务代码抛出的异常,用户也可自己手动捕获异常,手动捕获后将不会被该处理器处理.
app.use(ex('CN'));
app.use(bodyParser());

const routerDir = path.join(__dirname, 'routes');
// 读取路由文件
var readFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(routerDir, (err, files) => {
      resolve(files.filter((f) => {
        // 过滤出 .js文件
        return f.endsWith('.js') && f != 'base.js';
      }))
    });
  });
};

(async () => {
  let files = await readFiles();
  // console.log(files);
  for (var file of files) {
    app.use(require(path.join(routerDir, file)).routes());
  }
})();

var port = 3000;
app.listen(port, function () {
  console.log('Server running on port ' + port);
});
`,
  base: `var KoaRouter = require('koa-router');
var redis = require('../dao/redis');
var mongo = require('../dao/mongo');
var config = require('../conf/config');
var formidable = require('formidable');

KoaRouter.prototype.getUserInfo = (token) => {
  return new Promise((resovle, reject) => {
    if (!token) {
      var err = new Error('您还未登录!');
      err.name = "token_error";
      reject(err);
    }
    redis.get(redis.generateKey(token), (err, value) => {
      if (err || value == null) {
        if (err) console.error('---> Redis 获取 Token异常: %s 将从Mongodb中获取...', err);

        mongo.findDocument(mongo.USERS, { token: token, ValidFor: 'Y', ValidTo: { $gt: new Date() }, last_login: { $gte: new Date(new Date().getTime() - config.Redis.ttl * 1000) } }, function (doc) {
          if (!doc) {
            err = new Error('登录信息已过期,请先登录!');
            err.name = "token_error";
            reject(err);
          } else {
            // cache into redis
            var key = redis.generateKey(token);
            var loginInfo = {
              CardCode: doc.CardCode, CardName: doc.CardName,
              is_admin: doc.is_admin, roles: doc.roles, station: doc.station,
              station_name: doc.station_name, Name: doc.Name,
              City: doc.City, County: doc.County, Street: doc.Street,
              GroupName: doc.GroupName,
              ValidTo: doc.ValidTo,
              U_ServiceMode: doc.U_ServiceMode
            };
            if (doc.is_jzez) // 家装e站的账号
              loginInfo.is_jzez = doc.is_jzez;
            redis.set(key, JSON.stringify(loginInfo), config.Redis.ttl);
            resovle(loginInfo);
          }
        });

      } else {
        value = JSON.parse(value);
        resovle(value);
      }
    });
  })
};

/**
 *  上传文件表单转换.
 *  返回文件路径(用完记得删除文件)
 */
KoaRouter.prototype.formParse = function (ctx) {
  return function (done) {
    var form = new formidable.IncomingForm();
    //设置上传目录
    form.uploadDir = '/tmp/';
    form.keepExtensions = true;
    form.parse(ctx.req, function (err, fields, files) {
      if (err) {
        done(err, null);
      }
      var path = files.uploadFile.path;
      done(null, path);
    });
  }
}

module.exports = KoaRouter;
`,
  log: `// Logger middleware
module.exports = function () {
    return async (ctx, next) => {
        var start = new Date;
        await next();
        if (ctx.path === '/favicon.ico') {
            ctx.response.status = 200;
        } else {
            console.log('---> token:', ctx.cookies.get('token'));
        }
        var ms = new Date() - start;
        console.log(\`\x1b[32m \${new Date().toLocaleDateString()} \${new Date().toLocaleTimeString()} - \x1b[1m \${ctx.method} \${ctx.status} \x1b[0m \x1b[36m \${ctx.url} \x1b[0m - \x1b[33m \${ms} ms \x1b[0m\`);
    }
}`,
  config: `var env = process.env.NODE_ENV;

var allowEnvs = ['development','production','staging'];
if ( allowEnvs.indexOf(env) < 0 ) {
  // Invalidation env. Load with a default value:development.
  env = 'development';
}
console.log('---> 当前环境变量: NODE_ENV='+env);

var db = require('./db_'+env);

var config = {
  Qiniu: db.Qiniu,
  Mongo: db.Mongo,
  Redis: db.Redis,
  Mysql: db.Mysql,
  JzezMiddle: db.JzezMiddle
};

module.exports = config;
`,
  db_development: `var config = {
  Qiniu: {
    ACCESS_KEY: '1lTt7-6RLPvQCOWU8d_BbRf9ce4C_FmtdLPfgENS',
    SECRET_KEY: 'aSiJeim8Hqsw96v8wXzSsLWsPXwXFOdfaNCDqXkO',
    bucket: 'development'
  },
  Mongo: {
    url: 'mongodb://172.20.8.109:27017,172.20.8.110:27017/substation-admin-sys?replicaSet=rs0&readPreference=secondary&extendedOperators=true'
    // url: 'mongodb://172.20.8.109:27017/substation-admin-sys'
  },
  Redis: {
    host: '172.20.7.108',
    port: 6379,
    db: 0,
    ttl: 60 * 60 * 24 * 7,   // expires in 7 days.
    cluster: [
      {
        host: '172.20.8.109',
        port: 6379
      },
      {
        host: '172.20.8.109',
        port: 6380
      },
      {
        host: '172.20.8.109',
        port: 6381
      },
      {
        host: '172.20.8.110',
        port: 6379
      },
      {
        host: '172.20.8.110',
        port: 6380
      },
      {
        host: '172.20.8.110',
        port: 6381
      }
    ]
  },
  Mysql: {
    host: '172.20.7.78',
    user: 'root',
    password: '123456',
    database: 'substation-admin-sys',
    connectionLimit: 500,
    charset: 'UTF8_GENERAL_CI',
    connectTimeout: 10000,
    dateStrings: true,
    multipleStatements: true,
    master1: {
      host: '172.20.7.78',
      user: 'root',
      password: '123456',
      database: 'substation-admin-sys',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    },
    slave1: {
      host: '172.20.7.79',
      user: 'root',
      password: '123456',
      database: 'substation-admin-sys',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    }
  },
  JzezMiddle: {
    url: 'http://172.20.7.87:8080/sap',
    api_accout_query: '/substation/queryBalance',
    api_bills: '/substation/querySerial',
    api_bills_download: '/substation/exportSerial',
    api_payment: '/pay/collectionApply',
    api_urgent: '/order/fee',
    api_calculate: '/order/calculate',
    api_buy: '/order',
    api_order_status: '/otms/shareOrder'
  }
};

module.exports = config;
`,
  db_staging: `var config = {
  Qiniu: {
    ACCESS_KEY: '1lTt7-6RLPvQCOWU8d_BbRf9ce4C_FmtdLPfgENS',
    SECRET_KEY: 'aSiJeim8Hqsw96v8wXzSsLWsPXwXFOdfaNCDqXkO',
    bucket: 'development'
  },
  Mongo: {
    url: 'mongodb://172.20.8.111:27017,172.20.8.112:27017/substation-admin-sys?replicaSet=rs0&readPreference=secondary&extendedOperators=true'
    // url: 'mongodb://172.20.8.109:27017/substation-admin-sys'
  },
  Redis: {
    host: '172.20.7.108',
    port: 6379,
    db: 0,
    ttl: 60 * 60 * 24 * 7,   // expires in 7 days.
    cluster: [
      {
        host: '172.20.8.111',
        port: 6379
      },
      {
        host: '172.20.8.111',
        port: 6380
      },
      {
        host: '172.20.8.112',
        port: 6379
      },
      {
        host: '172.20.8.112',
        port: 6380
      },
      {
        host: '172.20.8.113',
        port: 6379
      },
      {
        host: '172.20.8.113',
        port: 6380
      }
    ]
  },
  Mysql: {
    host: '172.20.7.78',
    user: 'root',
    password: '123456',
    database: 'substation-admin-sys',
    connectionLimit: 500,
    charset: 'UTF8_GENERAL_CI',
    connectTimeout: 10000,
    dateStrings: true,
    multipleStatements: true,
    master1: {
      host: '172.20.7.78',
      user: 'root',
      password: '123456',
      database: 'substation-admin-sys',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    },
    slave1: {
      host: '172.20.7.79',
      user: 'root',
      password: '123456',
      database: 'substation-admin-sys',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    }
  },
  JzezMiddle: {
    url: 'http://172.20.7.111:8081/sap',
    api_accout_query: '/substation/queryBalance',
    api_bills: '/substation/querySerial',
    api_bills_download: '/substation/exportSerial',
    api_payment: '/pay/collectionApply',
    api_urgent: '/order/fee',
    api_calculate: '/order/calculate',
    api_buy: '/order',
    api_order_status: '/otms/shareOrder'
  }
};

module.exports = config;
`,
  db_production: `var config = {
  Qiniu: {
    ACCESS_KEY: 'TO_Hl06y-css7V5FXgdgyYsKC947a2WSmd8NrSNn',
    SECRET_KEY: 'lfnS-5-h-pwCDmqYvQa2CSPH20dsvxD_-m-OCUhI',
    bucket: 'sales'
  },
  Mongo: {
    url: 'mongodb://172.20.9.83:27017,172.20.9.84:27017,172.20.9.85:27017,172.20.9.86:27017/substation-admin-sys?replicaSet=rs0&readPreference=secondary&extendedOperators=true'
  },
  Redis: {
    host: '172.20.7.108',
    port: 6379,
    db: 0,
    ttl: 60 * 60 * 24 * 7,   // expires in 7 days.
    cluster: [
      {
        host: '172.20.9.91',
        port: 7001
      },
      {
        host: '172.20.9.92',
        port: 7001
      },
      {
        host: '172.20.9.93',
        port: 7001
      },
      {
        host: '172.20.9.94',
        port: 7001
      },
      {
        host: '172.20.9.95',
        port: 7001
      },
      {
        host: '172.20.9.96',
        port: 7001
      }
    ]
  },
  Mysql: {
    host: '172.20.7.108',
    user: 'root',
    password: 'jzez@2506',
    database: 'substation-admin-sys',
    connectionLimit: 500,
    charset: 'UTF8_GENERAL_CI',
    connectTimeout: 10000,
    dateStrings: true,
    multipleStatements: true,
    master1: {
      host: '172.20.7.78',
      user: 'root',
      password: '123456',
      database: 'substation-admin-sys',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    },
    slave1: {
      host: '172.20.7.79',
      user: 'root',
      password: '123456',
      database: 'substation-admin-sys',
      connectionLimit: 500,
      charset: 'UTF8_GENERAL_CI',
      connectTimeout: 10000,
      dateStrings: true,
      multipleStatements: true
    }
  },
  JzezMiddle: {
    url: 'http://172.20.9.23/sap',
    api_accout_query: '/substation/queryBalance',
    api_bills: '/substation/querySerial',
    api_bills_download: '/substation/exportSerial',
    api_payment: '/pay/collectionApply',
    api_urgent: '/order/fee',
    api_calculate: '/order/calculate',
    api_buy: '/order',
    api_order_status: '/otms/shareOrder'
  }
};

module.exports = config;
`,
  mysql: `var mysql = require('mysql');
var config = require('../conf/config');

/* Note:
    在单核 CPU 情况下, pool 对象会是一个单例,
    多核 CPU 并且 Node 应用处于 cluster 模式情况下,则会是多例!
*/
var pool;
if (!pool) {
  //  pool = mysql.createPool({
  //   host            : config.Mysql.host,
  //   user            : config.Mysql.user,
  //   password        : config.Mysql.password,
  //   database        : config.Mysql.database,
  //   connectionLimit : config.Mysql.connectionLimit,
  //   charset         : config.Mysql.charset,
  //   connectTimeout  : config.Mysql.connectTimeout,
  //   dateStrings     : config.Mysql.dateStrings,
  //   multipleStatements: true
  //   /**
  //   Multiple statement queries:
  //     Support for multiple statements is disabled for security
  //     reasons (it allows for SQL injection attacks if values are not properly escaped).
  //     To use this feature you have to enable it for your connection:
  //          var connection = mysql.createConnection({multipleStatements: true});
  //   */
  // });
  pool = mysql.createPoolCluster();
  pool.add(config.Mysql.master1);
  pool.add(config.Mysql.slave1);
}

module.exports = {
  getPool: () => {
    return pool;
  },

  // ---------------------------------------------------------------------------
  // insert,update,delete 等需要事务的场景下适用
  // callback 回调函数,传递两个参数: [err,result] err为null时,执行成功,否则失败,执行rollback
  execSafely: (sql, params, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        callback('--- 数据库连接失败! error:' + err, null);
      }
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          callback('--- 开启事务失败! error:' + err, null);
        }
        var query = connection.query(sql, params, (err, result) => {
          if (err) {
            connection.rollback(() => {
              callback('--- sql 执行失败! error:' + err, null);
            });
          }
          connection.commit((err) => {
            if (err) {
              connection.rollback(() => {
                callback('--- 提交事务失败! error:' + err, null);
              });
            }
            // 释放连接,返回给连接池管理
            connection.release();
            callback(null, result);
          });
        })
        console.log(query.sql);
      });
    })
  },

  // ---------------------------------------------------------------------------
  // select 操作等非强事务场景
  exec: (sql, params, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        callback('--- 数据库连接失败! error:' + err, null);
      }
      var query = connection.query(sql, params, (err, result, fileds) => {
        // 释放连接,返回给连接池管理
        // console.log(connection);
        connection.release();
        callback(err, result);
      });
      console.log(query.sql);
    });
  }
};
`,
  redis: `var Redis = require('ioredis');
var config = require('../conf/config');
var mongo = require('./mongo');
var Redlock = require('redlock');
var security = require('../tools/security');

/* Note:
    在单核 CPU 情况下, cluster 对象会是一个单例,
    多核 CPU 并且 Node 应用处于 cluster 模式情况下,则会是多例!
*/
var cluster;
if (!cluster) {
  cluster = new Redis.Cluster(config.Redis.cluster, {
    scaleReads: 'slave' // 读写分离
  });
}

// 订阅实例 防止#Error: Connection in subscriber mode, only subscriber commands may be used
// var sub;
// if (!sub) sub = new Redis.Cluster(config.Redis.cluster, {
//   scaleReads: 'slave' // 读写分离
// });

// var redlock;
// if (!redlock) {
//   redlock = new Redlock([cluster], {
//     driftFactor: 0.01, // time in ms. the expected clock drift
//     retryCount: 3, // the max number of times Redlock will attempt to lock a resource before erroring
//     retryDelay: 200 // time in ms
//   })
// }

// the maximum amount of time you want the key locked,
// keeping in mind that you can extend the lock up until
// the point when it expires
// var lockTtl = 2000;

// Redis 分布式锁key
// function getLockKey(str) {
//   return 'lock:' + security.generateMd5String(str);
// }

// 消费用户新增消息
// function comsumerMessage(message) {
//   var key = getLockKey(message);
//   message = JSON.parse(message);

//   redlock.lock(key, lockTtl, (err, lock) => {
//     if (err) {
//       console.log('---> 任务终止, Key: %s 已经被其它线程锁定', key);
//     } else {
//       mongo.insertDocumentNorepeatForPhone(mongo.CUSTOMERS, message, (data) => {
//         if (data) {
//           console.log('---> 重复的电话号码: %s', data);
//         }
//         console.log('---> Redis消息处理完成 ...');
//         // 不要释放锁,这样其余线程就不会执行插入DB的操作,不用担心死锁, LockKey会在2秒后自动删除.
//         // lock.unlock(function(err){
//         //   console.log('---> Key: %s 已经被其它线程释放', key);
//         // });
//       });
//     }
//   });

// }

// // 订阅消息
// sub.subscribe('CUSTOMERS', 'test', (err, count) => {
//   // \`count\` represents the number of channels we are currently subscribed to.
//   console.log('---> 已经订阅了 %s 个频道', count);
// });

// // 处理订阅消息
// sub.on('message', (channel, message) => {
//   console.log('Receive message %s from channel %s', message, channel);
//   switch (channel) {
//     case 'CUSTOMERS':
//       comsumerMessage(message);
//       break;

//     default:
//       console.log('---> 其它的消息: %', message);
//       break;
//   }
// });

module.exports = {

  getClusterClient: () => {
    return cluster;
  },
  generateKey: (token) => {
    return 'token:' + token;
  },

  del: (key) => {
    cluster.del(key);
  },

  get: (key, callback) => {
    cluster.get(key, (err, value) => {
      callback(err, value);
    });
  },

  // expires is an optional parameter.
  set: (key, value, expires, callback) => {
    if (typeof expires === 'undefined') {
      cluster.set(key, value);
    } else {
      var pipeline = cluster.pipeline();
      pipeline.set(key, value).expire(key, expires).exec((err, results) => {
        if (err) {
          console.error('--- redis set error:', err);
        }
        callback(err, results);
      });
    }
  },

  // 获取 hash_table 的 field
  hkeys: (key, callback) => {
    cluster.hkeys(key, (err, results) => {
      callback(err, results);
    });
  },

  // key => table_name , field => field
  hset: (key, field, value) => {
    cluster.hset(key, field, value);
  },

  // field:optional parameter.
  hget: (key, field, callback) => {
    cluster.hget(key, field, (err, value) => {
      callback(err, value);
    })
  },

  hgetall: (key, callback) => {
    cluster.hgetall(key, (err, results) => {
      callback(err, results);
    });
  },

  hmset: (key, map, callback) => {
    cluster.hmset(key, map);
  }
};
`,
  mongo: `/**
  Create By brainqi@outlook.com  2016-08-12 09:40:00

  MongoDB common operation utils:
  - Insert One Document.
  - Insert Many Documents.
  - Insert Document without repeat.Phone number is the specified key.
  - Find Document.
  - Find Specified Document.
  - Find All Documents with a Query Filter and Return results with page info.
  - Find All Documents with a Query Filter and without page query.
  - Find All Specified Documents with a Query Filter and without page query.
  - Find Specified Documents with a Query Filter and page query.
  - Find Doc count.
  - Update One Document.
  - Update Many Documents.
  - FindAndModify Documents.
  - Remove One Document.
  - Remove Many Document.
*/
var config = require('../conf/config');
var MongoClient = require('mongodb').MongoClient;
var db;

// MongoClient connection pooling.
MongoClient.connect(config.Mongo.url, (err, database) => {
    if (err) throw err;
    // Initialize connection once.
    db = database;
});

module.exports = {
    // collection_names.
    /**
     * 用户
     */
    USERS: 'users',
    /**
     * 员工
     */
    EMPLOYEES: 'employees',
    /**
     * 客户
     */
    CUSTOMERS: 'customers',
    /**
     * 产品
     */
    PRODUCTS: 'products',
    /**
     * SAP产品分类
     */
    CATEGORY: 'category',
    /**
     * 加急卡
     */
    URGENT: 'urgents',
    /**
     * 销售单
     */
    SALES: 'sales',
    /**
     * 采购单
     */
    SUB_SALES: 'sub_sales',
    /**
     * 备货单
     */
    BAK_SALES: 'bak_sales',
    /**
     * 流水号通用生成器
     */
    SERIAL_NUMBER: 'serial_number',
    /**
     * 销售单 - 计算一口价
     */
    QUOTES: 'quotes',
    /**
     * 备货
     */
    STOCKS: 'stocks',
    /**
     * 权限
     */
    PERMISSIONS: 'permissions',
    /**
     * 定制品
     */
    CUSTOM_PRODUCTS: 'custom_products',
    /**
     * 材料分类
     */
    MATERIAL_CATEGORY: 'material_category',
    /**
     * 供应商管理
     */
    SUPPLIER: 'supplier',
    /**
     * 施工报价分类
     */
    CONSTRUCTION_QUOTE_CATEGORY: 'construction_quote_category',
    /**
     * 施工报价
     */
    CONSTRUCTION_QUOTE: 'construction_quote',
    /**
     * 首页 - 培训
     */
    TRAINING: 'training',
    /**
     * 首页 - 通知
     */
    ANNOUNCEMENT: 'announcement',
    /**
     * 施工一口价
     */
    CONSTRUCTION_FIXED_PRICE: 'construction_fixed_price',
    /**
     * 材料报价模版
     */
    TPL_MATERIAL_QUOTE: 'tpl_material_quote',
    /**
     * 施工报价模版
     */
    TPL_CONSTRUCTION_QUOTE: 'tpl_construction_quote',
    /**
     * 调品规则
     */
    RULE_PRODUCT: 'rule_product',
    /**
     * 调品规则 - 分站自营价
     */
    RULE_PRODUCT_PRICE: 'rule_product_price',
    /**
     * 项目报价
     */
    PROJECT_QUOTE: 'project_quote',

    // role name.
    // ROLE_DESIGNER: 'designer',
    // ROLE_MARKET: 'market',
    // ROLE_SALES: 'sales',
    // ROLE_ACCOUNTANT: 'accountant',

    /**
     * Get Mongo Database Instance.
     */
    getDB: () => {
        return db;
    },
    /** 
     * Insert one document.
    */
    insertDocument: (collectionName, doc, callback) => {
        var collection = db.collection(collectionName);
        collection.insertOne(doc, (err, result) => {
            if (err) {
                console.error('---------------- Mongodb 保存单个失败:', err);
            }
            callback(err, result);
        });
    },

    // ---------------------------------------------------------------------------
    /**
     * Insert many documents.
     */
    insertDocuments: (collectionName, docs, callback) => {
        var collection = db.collection(collectionName);
        collection.insertMany(docs, (err, result) => {
            if (err) {
                console.error('---------------- Mongodb 保存多个文档失败:', err);
            }
            // console.log(result.result.n);   // result Contains the result document from MongoDB
            // console.log(result.ops.length); //ops Contains the documents inserted with added _id fields
            callback(err, result);
        });

    },

    // ---------------------------------------------------------------------------
    /**
     * Insert Document without repeat.Phone number is the specified key.
     */
    insertDocumentNorepeatForPhone: (collectionName, doc, callback) => {

        var collection = db.collection(collectionName);
        collection.update({ Phone2: doc.Phone2, station: doc.station }, { $setOnInsert: doc }, { upsert: true }, (err, res) => {
            if (res.result.upserted == null) {
                // console.log('---> 重复数据不录入! ', doc);
                callback(doc.Phone2);
            } else {
                // console.log('---> 新录入数据:', doc);
                callback(null);
            }

        });

        // var bulk = db.collection(collectionName).initializeUnorderedBulkOp()
        // bulk.find({name: doc.name, phone: doc.phone})
        //     .upsert()
        //     .replaceOne(doc);

        // deprecate 防止数据重复而采用的让多线程错峰执行,已经改由Redis分布式锁实现.
        // 随机超时时间,防止多线程带来的数据重复插入问题 
        // var timeout = Math.random()*1500;
        // setTimeout(function() {
        //   bulk.execute();
        // }, timeout);
        // bulk.execute(function(err, result){
        //   console.log(result.nMatched);
        //   // console.log('---> s :',bulk.s);
        //   if (bulk.s.bulkResult.nMatched == 1) {
        //     console.log('---> 重复数据: ',doc);
        //   }

        // });

        // callback();
        // console.log('---> result : ',bulk.s.bulkResult);

    },

    // ---------------------------------------------------------------------------
    /**
     * Upsert document.
     */
    upsertDocument: (collectionName, queryDoc, upsertDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.update(queryDoc, upsertDoc, { upsert: true }, (err, result) => {
            callback(err, result);
        });
    },

    /**
     * Find One Document.
     */
    findDocument: (collectionName, queryDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.findOne(queryDoc).then((doc) => {
            callback(doc);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Document.
     */
    findSpecifiedDocument: (collectionName, queryDoc, specifiedDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.findOne(queryDoc, specifiedDoc).then((doc) => {
            callback(doc);
        });
    },

    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a Query Filter and Return results with page info.
     */
    findDocuments: (collectionName, queryDoc, callback) => {
        /**
        queryDoc:
        {
          doc:{'age': 18, 'name': /brain/},  # name = new RegExp(name); Note:模糊查询,需要使用正则,而不是简单的 / 字符串拼接
          pageParam:{'page':1, 'size': 20}
        }
        */
        var pageParam = queryDoc.pageParam == null ? new Object() : queryDoc.pageParam;
        var page = pageParam.page == null ? 1 : parseInt(pageParam.page);
        var size = pageParam.size == null ? 20 : parseInt(pageParam.size);
        size = size > 200 ? 200 : size; // 接口保护,每次最多允许获取200条数据
        var skip = (page - 1) * size;
        var doc = queryDoc.doc; // can be an empty object.
        var collection = db.collection(collectionName);

        // 默认按照创建时间降序排列
        collection.find(doc)
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                if (err) {
                    console.error('---------------- Mongodb 查询失败 :', err);
                }
                collection.count(doc,
                    (err, count) => {
                        var results = new Object();
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },

    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a Query Filter and without page query.
     */
    findAllDocuments: (collectionName, queryDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a sorted document and a Query Filter and without page query.
     */
    findAllDocumentsSorted: (collectionName, queryDoc, sortDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc)
            .sort(sortDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Specified Documents with a Query Filter and without page query.
     */
    findAllSpecifiedDocuments: (collectionName, queryDoc, specifiedDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Documents with a Query Filter and page query.
     */
    findSpecifiedDocuments: (collectionName, queryDoc, specifiedDoc, callback) => {
        var pageParam = queryDoc.pageParam == null ? new Object() : queryDoc.pageParam;
        var page = pageParam.page == null ? 1 : parseInt(pageParam.page);
        var size = pageParam.size == null ? 20 : parseInt(pageParam.size);
        size = size > 200 ? 200 : size; // 接口保护,每次最多允许获取200条数据
        var skip = (page - 1) * size;
        var doc = queryDoc.doc; // can be an empty object.
        var collection = db.collection(collectionName);

        collection.find(doc, specifiedDoc)
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                if (err) {
                    console.error('---------------- Mongodb 查询失败 :', err);
                }
                collection.count(doc,
                    (err, count) => {
                        var results = new Object();
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Sorted Documents with a Query Filter and page query.
     */
    findSpecifiedSortedDocuments: (collectionName, queryDoc, specifiedDoc, sortDoc, callback) => {
        var pageParam = queryDoc.pageParam == null ? new Object() : queryDoc.pageParam;
        var page = pageParam.page == null ? 1 : parseInt(pageParam.page);
        var size = pageParam.size == null ? 20 : parseInt(pageParam.size);
        size = size > 200 ? 200 : size; // 接口保护,每次最多允许获取200条数据
        var skip = (page - 1) * size;
        var doc = queryDoc.doc; // can be an empty object.
        var collection = db.collection(collectionName);

        collection.find(doc, specifiedDoc)
            .sort(sortDoc)
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                if (err) {
                    console.error('---------------- Mongodb 查询失败 :', err);
                }
                collection.count(doc,
                    (err, count) => {
                        var results = new Object();
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Specified Sorted Documents without page Filter query.
     */
    findAllSpecifiedSortedDocuments: (collectionName, queryDoc, specifiedDoc, sortDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .sort(sortDoc)
            .toArray(
            (err, docs) => {
                if (err) {
                    console.error('---------------- Mongodb 查询失败 :', err);
                }
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Doc count.
     */
    findCount: (collectionName, queryDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.count(queryDoc, (err, count) => {
            callback(count);
        })
    },
    // ---------------------------------------------------------------------------
    /**
     * Update one document.
     */
    updateDocument: (collectionName, conditionDoc, updatedDoc, callback) => {
        var collection = db.collection(collectionName);
        var update_doc = null;
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        if (updatedDoc.hasOwnProperty('$push') || updatedDoc.hasOwnProperty('$unset')) {
            update_doc = updatedDoc;
        } else {
            updatedDoc.updateAt = new Date();
            update_doc = { $set: updatedDoc };
        }
        collection.updateOne(conditionDoc, update_doc, (err, result) => {
            if (err) {
                console.error('---------------- Mongodb 更新单个文档失败:', err);
            }
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Update many documents.
     */
    updateDocuments: (collectionName, conditionDoc, updatedDoc, callback) => {
        updatedDoc.updateAt = new Date();
        var collection = db.collection(collectionName);
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        collection.updateMany(conditionDoc, { $set: updatedDoc }, (err, result) => {
            if (err) {
                console.error('---------------- Mongodb 更新多个文档失败:', err);
            }
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * findAndModify requires a sort parameter. 
     * 
     * The {new: true} option will return the updated document when boolean true. 
     * If set to false, it will return the old document before update. 
     * 
     */
    FindAndModifyDocument: (collectionName, queryDoc, sortDoc, updateDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.findAndModify(queryDoc, sortDoc, updateDoc, { new: true }, (err, result) => {
            if (err) {
                console.error('---> FindAndModify Error: %s', err);
            }
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Remove one document.
     */
    removeDocument: (collectionName, doc, callback) => {
        var collection = db.collection(collectionName);
        collection.deleteOne(doc, (err, result) => {
            if (err) {
                console.error('---------------- Mongodb 删除单个文档失败:', err);
            }
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Remove Many documents.
     */
    removeDocuments: (collectionName, doc, callback) => {
        var collection = db.collection(collectionName);
        collection.deleteMany(doc, (err, result) => {
            if (err) {
                console.error('---------------- Mongodb 删除多个文档失败:', err);
            }
            callback(err, result);
        });
    }
};
`,
  qiniu: `var qiniu = require("qiniu");
var config = require('../conf/config');

qiniu.conf.ACCESS_KEY = config.Qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.Qiniu.SECRET_KEY;
bucket = config.Qiniu.bucket;

/**
 * 构建上传策略函数
 */
function uptoken(key) {
  var putPolicy = new qiniu.rs.PutPolicy(bucket + ":" + key);
  return putPolicy.token();
}

function uploadToQiniu(uptoken, key, localFile, callback) {
  var extra = new qiniu.io.PutExtra();
  qiniu.io.putFile(uptoken, key, localFile, extra, (err, ret) => {
    if (!err) {
      // 上传成功， 处理返回值
      // console.log(ret.hash, ret.key, ret.persistentId);
      callback(null, ret.hash, ret.key);
    } else {
      // 上传失败， 处理返回代码
      // console.log(err);
      callback(err, null, null);
    }
  });
}

module.exports = {
  /** key       : 上传到七牛后保存的文件名
  *   filePath  : 要上传文件的本地路径
  */
  uploadFile: (key, filePath, callback) => {
    //生成上传 Token
    token = uptoken(key);
    uploadToQiniu(token, key, filePath, (err, hash, key) => {
      callback(err, hash, key);
    });
  },
  deleteFile: (key, callback) => {
    var client = new qiniu.rs.Client();
    client.remove(bucket, key, (err, ret) => {
      if ((!err)) {
        console.log('delete ok.');
      } else {
        console.log(err);
      }
      callback(err, ret);
    });
  }
};
`,
  base_router: `var base = require('./base');
var dao = require('../dao/$option');
var router = new base({
    prefix: '/$option'
});

router.get('/', function* () {
    var doc = {};
    var data = this.query;
    var params = {};
    params.pageParam = { page: data.page, size: data.size };
    params.doc = doc;
    this.body = { code: 200, data: yield dao.list(params) };
});

router.post('/', function* () {
    var user = yield router.getUserInfo(this.cookies.get('token'));
    var data = this.request.body;
    data.createAt = new Date();
    yield dao.create(data);
    this.body = { code: 200, msg: 'ok' };
});

router.put('/', function* () {
    var user = yield router.getUserInfo(this.cookies.get('token'));
    var data = this.request.body;
    yield dao.update(data);
    this.body = { code: 200, msg: 'ok' };
});

router.delete('/', function* () {
    var id = this.query._id;
    yield dao.delete(id);
    this.body = { code: 200, msg: 'ok' };
});
router.get('/detail', function* () {
    var doc = yield dao.get(this.query._id);
    this.body = { code: 200, data: doc };
});

module.exports = router;`,
  base_dao: `var mongo = require('./mongo');
var ObjectId = require('mongodb').ObjectID;

module.exports = {
    list: (params) => {
        return (done) => {
            mongo.findDocuments('$option', params, (results) => {
                done(null, results);
            });
        }
    },
    get: (param) => {
        return (done) => {
            mongo.findDocument('$option', param, (doc) => {
                done(null, doc);
            });
        }
    },
    create: (doc) => {
        return (done) => {
            mongo.insertDocument('$option', doc, (err, result) => {
                if (err) done(new Error("系统异常，新增失败!"), null);
                done(null, null);
            });
        }
    },
    update: (doc) => {
        return (done) => {
            mongo.updateDocument('$option', { _id: new ObjectId(doc._id) }, doc, (err, result) => {
                if (err != null || result.result.n == 0) {
                    done(new Error("系统异常,更新失败!"), null);
                } else {
                    done(null, null);
                }
            });
        }
    },
    delete: (id) => {
        return (done) => {
            mongo.removeDocument('$option', { _id: new ObjectId(id) }, (err, res) => {
                if (err) done(new Error("系统异常,删除失败!"), null);
                done(null, null);
            });
        }
    }
}`
}