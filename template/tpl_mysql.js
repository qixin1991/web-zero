module.exports = `const mysql = require('mysql'),
 config = require('../conf/config');

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
`