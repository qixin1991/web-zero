# web-zero

Nodejs web project code scaffold base on Koa@2.

# demo
![web-zero-demo](http://brain.qiniudn.com/web-zero-demo.gif)

# Install

```
npm install -g web-zero
```

# Usage

```
➜ web-zero
Usage: web-zero operation [init | new | delete] option [module_name] [databse_type]

Example:
	 web-zero init 			 Create a api project named current dir.
	 web-zero new users 		 Create routes/users.js and dao/users.js files.
	 web-zero new users mysql 	 Create users module with DB base on mysql.
	 web-zero delete users 		 Delete routes/users.js and dao/users.js files.
```

# Example

- Init project

```
mkdir web-zero-example && cd web-zero-example
web-zero init
```

- Create a new Biz Module

```
web-zero new users
```

Execute this in terminal, you'll see `routes/users.js` and `dao/users.js` that have been created.

- Create a new Biz Module with dao base on mysql

```
web-zero new users mysql
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
Now, open browser to visit [http://localhost:3000](http://localhost:3000)

Have Fun!

# TODO

- ~~Add mysql regular CRUD support~~
