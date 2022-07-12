"use strict";

const body_parser = require("body-parser");
const cors = require("cors");
const express = require("express");
const session = require('express-session');
//const sharedsession = require("express-socket.io-session");
//const uuid = require('uuid/v4');
//const FileStore = require('session-file-store')(session);
const MySQLStore = require('express-mysql-session')(session);
const flash = require('express-flash-messages');

const Server = require("./classes/server");
const Db = require("./classes/db");
const Router = require("./routes/router");
const environment = require("./global/environment");
const Tools = require("./classes/tools");
const { version } = require('./package.json');
var path = require('path');


const server = Server.instance;

// BodyParser
server.app.use(body_parser.urlencoded({ extended: true }));
server.app.use(body_parser.json());

// Static
server.app.use(express.static(environment.PUBLIC));

// CORS
server.app.use(cors({ origin: true, credentials: true }));

// EJS
//server.app.set('views', __dirname + '/pages'); // set express to look in this folder to render our view
server.app.set('views', path.join(__dirname , 'pages')); // set express to look in this folder to render our view
server.app.set('view engine', 'ejs'); // configure template engine

// Flash msg
server.app.use(flash());

// Session
// add & configure middleware
const db = Db.instance;
db.sessionStore = new MySQLStore({}, db.connection);
var sessionMiddleware = session({
  secret: environment.SECRET,
  //store: new FileStore(),
  store: db.sessionStore,
  resave: true,
  rolling: true,
  saveUninitialized: false, //true,
  cookie: { secure: false, maxAge: 8*60*60*1000 }
});

server.app.use(sessionMiddleware);
/*server.io.use(sharedsession (sessionMiddleware, {
  autoSave:true
})); 


server.io.use(function(socket, next) {
  console.log('socket.handshake session data is %j.', socket.handshake.session,"session Id", socket.handshake.sessionID);
  socket.handshake.session.touch().save();
	next();
});
*/

// Rutas de servicios
server.app.use('/', Router);

//limpia camiones anteriores
db.checkDeleted().then((result) =>{
  server.start(() => {
      console.log (Tools.now(),"App Version:", version);
      let serverIP = Tools.getIPAddress();
      console.log(Tools.now(),`Servidor ${serverIP} corriendo en el puerto ${server.port}`);
  });
  return (console.log(Tools.now(),"BD Truck Checked:", result.message,")"));
});

