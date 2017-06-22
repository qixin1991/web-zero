module.exports = `const mongo = require('./mongo'),
 ObjectId = require('mongodb').ObjectID;

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
                mongo.updateDocument('$option', { _id: doc._id }, doc, (err, result) => {
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
                mongo.removeDocument('$option', { _id: id }, (err, res) => {
                    if (err) reject("系统异常,删除失败!");
                    resolve(null);
                });
            });
    }
}`