# web-zero

Nodejs web project code scaffold base on Koa@2.

# Install

```
npm install -g web-zero
```

# Usage

- Init project

```
cd ${your_project}
npm init # entry point: (index.js): app.js

web-zero init
```

- Create a new Biz Module

```
web-zero new users
```

Execute this in terminal, you'll see `routes/users.js` and `dao/users.js` that have been created.

- Delete a Biz Module

```
web-zero delete users
```

Execute this in terminal, you'll see `routes/users.js` and `dao/users.js` that have been deleted.

- Start webapp

> Remember to edit `conf/db_${env}.js`. These files are db settings.
>
> **Warning:** --async-await needs node v7

```
npm install
npm start
```

Have Fun!