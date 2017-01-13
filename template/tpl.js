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
// 异常统一处理器: 捕获业务代码抛出的异常,用户也可自己手动捕获异常,手动捕获后将不会被该处理器处理.
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
  for (var file of files) {
    try {
      app.use(require(path.join(routerDir, file)).routes());
    } catch (error) {
      console.error(' ---> 启动失败，似乎数据库配置有问题哦~');
      process.exit(0);
    }
  }
})();

var port = 3000;
app.listen(port, function () {
  console.log(\` ---> Server running on port: \${port}\`);
});
`,
  base: `var KoaRouter = require('koa-router');
var formidable = require('formidable');

KoaRouter.prototype.getUserInfo = (token) => {
  return new Promise((resovle, reject) => {
    if (!token) {
      var err = new Error('您还未登录!');
      err.name = "token_error";
      reject(err);
    }
    // Login userinfo
    resovle({});
  });
};

/**
 *  上传文件表单转换.
 *  返回文件路径(如果是临时文件，用完记得删除文件)
 */
KoaRouter.prototype.formParse = function (ctx) {
  return new Promise((resovle, reject) => {
    var form = new formidable.IncomingForm();
    //设置上传目录
    form.uploadDir = '/tmp/';
    form.keepExtensions = true;
    form.parse(ctx.req, function (err, fields, files) {
      if (err) {
        reject(err);
      }
      var path = files.uploadFile.path;
      resovle(path);
    });
  });
}

module.exports = KoaRouter;
`,
  log: `// Logger middleware
module.exports = function () {
    return async (ctx, next) => {
        var start = new Date();
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
console.log(' ---> 当前环境变量: NODE_ENV='+env);

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
`,
  db_staging: `var config = {
  Qiniu: {
    ACCESS_KEY: '',
    SECRET_KEY: '',
    bucket: ''
  },
  Mongo: {
    url: 'mongodb://'
  },
  Redis: {
    host: '',
    port: 6379,
    db: 0,
    ttl: 60 * 60 * 24 * 7,   // expires in 7 days.
    cluster: [
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
`,
  db_production: `var config = {
  Qiniu: {
    ACCESS_KEY: '',
    SECRET_KEY: '',
    bucket: ''
  },
  Mongo: {
    url: 'mongodb://'
  },
  Redis: {
    host: '',
    port: 6379,
    db: 0,
    ttl: 60 * 60 * 24 * 7,   // expires in 7 days.
    cluster: [
      {
        host: '',
        port: 7001
      },
      {
        host: '2',
        port: 7001
      },
      {
        host: '',
        port: 7001
      },
      {
        host: '',
        port: 7001
      },
      {
        host: '',
        port: 7001
      },
      {
        host: '',
        port: 7001
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

router.get('/', async ctx => {
    var doc = {};
    var data = this.query;
    var params = {};
    params.pageParam = { page: data.page, size: data.size };
    params.doc = doc;
    ctx.body = { code: 200, data: await dao.list(params) };
});

router.post('/', async ctx => {
    var user = await router.getUserInfo(this.cookies.get('token'));
    var data = this.request.body;
    data.createAt = new Date();
    await dao.create(data);
    ctx.body = { code: 200, msg: 'ok' };
});

router.put('/', async ctx => {
    var user = await router.getUserInfo(this.cookies.get('token'));
    var data = this.request.body;
    await dao.update(data);
    ctx.body = { code: 200, msg: 'ok' };
});

router.delete('/', async ctx => {
    var id = this.query._id;
    await dao.delete(id);
    ctx.body = { code: 200, msg: 'ok' };
});
router.get('/detail', async ctx => {
    var doc = await dao.get(this.query._id);
    ctx.body = { code: 200, data: doc };
});

module.exports = router;`,
  base_dao: `var mongo = require('./mongo');
var ObjectId = require('mongodb').ObjectID;

module.exports = {
    list: (params) => {
        return new Promise(
            (resolve, reject) => {
                mongo.findDocuments('$option', params, (results) => {
                    resolve(results);
                });
            });
    },
    get: (param) => {
        return new Promise(
            (resolve, reject) => {
                mongo.findDocument('$option', param, (doc) => {
                    resolve(doc);
                });
            });
    },
    create: (doc) => {
        return new Promise(
            (resolve, reject) => {
                mongo.insertDocument('$option', doc, (err, result) => {
                    if (err) reject("系统异常，新增失败!");
                    resolve(null);
                });
            });
    },
    update: (doc) => {
        return new Promise(
            (resolve, reject) => {
                mongo.updateDocument('$option', { _id: new ObjectId(doc._id) }, doc, (err, result) => {
                    if (err != null || result.result.n == 0) {
                        reject("系统异常,更新失败!");
                    } else {
                        resolve(null);
                    }
                });
            });
    },
    delete: (id) => {
        return new Promise(
            (resolve, reject) => {
                mongo.removeDocument('$option', { _id: new ObjectId(id) }, (err, res) => {
                    if (err) reject("系统异常,删除失败!");
                    resolve(null);
                });
            });
    }
}`,
  tools: `var crypto = require('crypto');

module.exports = {
  generateSha256String: function (str) {
    var sha256 = crypto.createHash('sha256');
    return sha256.update(str, 'utf-8').digest('hex');
  },
  generateMd5String: function (str) {
    var md5 = crypto.createHash('md5');
    return md5.update(str).digest('hex');
  }
};`
}