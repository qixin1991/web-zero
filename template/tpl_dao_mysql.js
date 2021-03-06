module.exports = `const mysql = require('$daoPath');

module.exports = {
    list: (params) => {
        return new Promise(
            (resolve, reject) => {
                mysql.list('$option', params, (err, res) => {
                    if (err) reject(new Error('查询失败，系统异常!'));
                    resolve(res);
                });
            }
        )
    },
    get: (params) => {
        return new Promise(
            (resolve, reject) => {
                mysql.findOne('$option', params, (err, res) => {
                    if (err) reject(new Error('查询失败，系统异常!'));
                    resolve(res);
                })
            });
    },
    create: (params) => {
        return new Promise(
            (resolve, reject) => {
                mysql.insert('$option', params, (err, res) => {
                    if (err) reject(new Error("保存失败，系统异常!"));
                    resolve(res);
                })
            }
        )
    },
    update: (params) => {
        return new Promise(
            (resolve, reject) => {
                if (!params.id) reject(new Error('id 为必传参数'));
                mysql.updateById('$option', params, (err, res) => {
                    if (err) reject(new Error("更新失败，系统异常!"));
                    resolve(res);
                });
            }
        )
    },
    /**
     * soft delete.
    */
    delete: (id) => {
        return new Promise(
            (resolve, reject) => {
                if (!id) reject(new Error('id 为必传参数'));
                mysql.deleteById('$option', id, (err, res) => {
                    if (err) reject(new Error("删除失败，系统异常!"));
                    resolve(res);
                });
            }
        )
    }
}`;