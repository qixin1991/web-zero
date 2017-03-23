module.exports = `const mysql = require('mysql'),
  config = require('../conf/config');

/* Note:
    在单核 CPU 情况下, pool 对象会是一个单例,
    多核 CPU 并且 Node 应用处于 cluster 模式情况下,则会是多例!
*/
let pool;
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
  //          let connection = mysql.createConnection({multipleStatements: true});
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
  /**
   * Operation For SQL query without page info.
   * 
   * @param {String} tabName Table name
   * @param {Object} params Query fields
   * @param {Function} callback Callback function
   */
  query: function (tabName, params, callback) {
    this.querySortedAndSpecifiedFields(tabName, null, { update_at: 'desc' }, params, (err, result) => {
      callback(err, result);
    });
  },
  // ---------------------------------------------------------------------------
  /**
   * Operation For SQL query without page info.
   * Default sorted desc by update time.
   * @param {String} tabName Table name
   * @param {Object} params Query fields
   * @param {Function} callback Callback function
   */
  querySpecifiedFields: function (tabName, specifiedFields, params, callback) {
    this.querySortedAndSpecifiedFields(tabName, specifiedFields, { update_at: 'desc' }, params, (err, result) => {
      callback(err, result);
    });
  },
  // ---------------------------------------------------------------------------
  /**
   * Operation For SQL query without page info.
   *  
   * @param {String} tabName Table name
   * @param {Array} specifiedFields Choose the specified fields to return. like 'select name,age,address from users;'
   * @param {Object} sortedObj Sorted object. Example: {update_at: desc, age asc}
   * @param {Object} params Query fields
   * @param {Function} callback Callback function
   */
  querySortedAndSpecifiedFields: function (tabName, specifiedFields, sortedObj, params, callback) {
    let queryStr = '';
    for (let i in params) {
      if (isNaN(params[i])) { // 非 number 类型，使用模糊检索方式
        queryStr += ' and ' + i + ' like \'%' + params[i] + '%\'';
      } else { // nunmber 类型，等值检索
        queryStr += ' and ' + i + '=' + params[i];
      }
    }

    let sql = \`select * from \${tabName} where 1=1 $\{queryStr} \`;
    if (specifiedFields) {
      let specifiedArr = [];
      for (let k of specifiedFields) {
        specifiedArr.push(k);
      }
      sql = \`select \${specifiedArr.join(',')} from \${tabName} where 1=1 \${queryStr} \`;
    }

    if (sortedObj) {
      sql += ' order by ';
      sortedArr = [];
      for (let j in sortedObj) {
        sortedArr.push(j + ' ' + sortedObj[j]);
      }
      sql += sortedArr.join(',');
    }
    this.exec(sql, null, (err, result) => {
      callback(err, result);
    });
  },
  // ---------------------------------------------------------------------------
  /**
   * Operation For Page & Search Query. Default ordered by update_at desc.
   * @param {String} tabName Table name
   * @param {Object} params query object
   * @param {Function} callback Callback function return { docs: [], count: Number }
   */
  list: function (tabName, params, callback) {
    this.listSortedAndSpecifiedFields(tabName, null, { update_at: 'desc' }, params, (err, result) => {
      callback(err, result);
    });
  },
  // ---------------------------------------------------------------------------
  /**
  * Operation For SQL Page Query with Sorted and Speicified Fields.
  *  
  * @param {String} tabName Table name
  * @param {Array} specifiedFields Choose the specified fields to return. like 'select name,age,address from users;'
  * @param {Object} sortedObj Sorted object. Example: {update_at: desc, age asc}
  * @param {Object} params Query fields. Contains page query info & search info.
  * @param {Function} callback Callback function
  */
  listSortedAndSpecifiedFields: function (tabName, specifiedFields, sortedObj, params, callback) {
    let page = params.page == null ? 1 : parseInt(params.page);
    let size = params.size == null ? 20 : parseInt(params.size);
    size = size > 200 ? 200 : size; // API speed limit for 200 records/times
    let skip = (page - 1) * size;
    delete params.page;
    delete params.size;
    let queryStr = '';
    for (let i in params) {
      if (isNaN(params[i])) { // 非 number 类型，使用模糊检索方式
        queryStr += ' and ' + i + ' like \'%' + params[i] + '%\'';
      } else { // nunmber 类型，等值检索
        queryStr += ' and ' + i + '=' + params[i];
      }
    }
    let sql = \`select * from \${tabName} where 1=1 \${queryStr} \`;
    if (specifiedFields) {
      let specifiedArr = [];
      for (let k of specifiedFields) {
        specifiedArr.push(k);
      }
      sql = \`select \${specifiedArr.join(',')} from \${tabName} where 1=1 \${queryStr} \`;
    }
    if (sortedObj) {
      sql += ' order by ';
      sortedArr = [];
      for (let j in sortedObj) {
        sortedArr.push(j + ' ' + sortedObj[j]);
      }
      sql += sortedArr.join(',');
    }
    // counts in page info.
    sql += \` limit ?,?; select count(*) as counts from \${tabName} where 1=1 \${queryStr}\`;
    this.exec(sql, [skip, size], (err, result) => {
      callback(err, { docs: result[0], count: result[1][0].counts });
    });
  },
  // ---------------------------------------------------------------------------
  /**
   * Insert a record.
   * @param {String} tabName Table name
   * @param {} params Array or Object
   * @param {Function} callback return (err,result)
   */
  insert: function (tabName, params, callback) {
    const sql = \`insert into \${tabName} set ?\`;
    this.execSafely(sql, params, (err, result) => {
      callback(err, result);
    });
  },
  // ---------------------------------------------------------------------------
  /**
   * Update a record
   * @param {String} tabName Table name
   * @param {Object} params Updated Object
   * @param {Function} callback return (err,result)
   */
  updateById: function (tabName, params, callback) {
    const sql = \`update \${tabName} set ? where id = ?\`;
    const id = params.id;
    delete params.id;
    this.execSafely(sql, [params, id], (err, result) => {
      callback(err, result);
    });
  },
  // ---------------------------------------------------------------------------
  /** insert,update,delete 等需要事务的场景下适用
   * @param {String} sql sql string
   * @param {}  params Or an {Object}
   * @param {Function} callback 回调函数,传递两个参数: [err,result] err为null时,执行成功,否则失败,执行rollback
  */
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
        let query = connection.query(sql, params, (err, result) => {
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
        console.log(' ---> SQL: %s', query.sql);
      });
    })
  },

  // ---------------------------------------------------------------------------
  /** select 操作等非强事务场景
   * @param {String} sql sql string
   * @param {Array}  params Or an {Object}
   * @param {Function} callback 回调函数,传递两个参数: [err,result] err为null时,执行成功,否则失败,执行rollback 
   */
  exec: (sql, params, callback) => {
    pool.getConnection((err, connection) => {
      if (err) {
        callback('--- 数据库连接失败! error:' + err, null);
      }
      let query = connection.query(sql, params, (err, result, fileds) => {
        // 释放连接,返回给连接池管理
        // console.log(connection);
        connection.release();
        callback(err, result);
      });
      console.log(' ---> SQL: %s', query.sql);
    });
  }
};
`