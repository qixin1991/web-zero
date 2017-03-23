module.exports = `const Redis = require('ioredis'),
 config = require('../conf/config'),
 mongo = require('./mongo'),
 security = require('../tools/security');

/* Note:
    在单核 CPU 情况下, cluster 对象会是一个单例,
    多核 CPU 并且 Node 应用处于 cluster 模式情况下,则会是多例!
*/
let cluster;
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
      let pipeline = cluster.pipeline();
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
`