module.exports = `const redis = require('../dao/redis'),
    mongo = require('../dao/mongo'),
    config = require('../conf/config');

module.exports = () => {
    return async (ctx, next) => {
        ctx.getUserInfo = () => {
            return new Promise((resovle, reject) => {
                const token = ctx.cookies.get('token');
                if (!token) {
                    var err = new Error('您还未登录!');
                    err.name = "token_error";
                    reject(err);
                }
                redis.get(redis.generateKey(token), (err, value) => {
                    if (err || value == null) {
                        if (err) console.error(\`---> Redis 获取 Token异常: \${err} \n\t 将从Mongodb中获取...\`);
                        // get userinfo from mongodb by token string.
                        mongo.findDocument('users', { token: token, last_login: { $gte: new Date(new Date().getTime() - config.Redis.ttl * 1000) } }, (doc) => {
                            if (!doc) {
                                var err = new Error('登录信息已过期,请先登录!');
                                err.name = "token_error";
                                reject(err);
                            }
                            resovle(doc);
                        });
                    } else {
                        resovle(JSON.parse(value));
                    }
                });
            });
        };
        await next();
    }
}`