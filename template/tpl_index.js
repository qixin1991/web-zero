module.exports =  `const router = require('koa-router')();

router.get('/', async ctx => {
    ctx.body = '<h1>Welcome to web-zero!</h1>';
});

module.exports = router;`