module.exports = `// Logger middleware
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
}`