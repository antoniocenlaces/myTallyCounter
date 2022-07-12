"use strict";

exports.SERVER_PORT = Number(process.env.PORT) || 5000;
exports.MYSQL = {
  connectionLimit: 10,
  host: "192.168.1.145",
  user: "operador",
  password: "NiotecOp15!",
  database: "tally_model",
  debug: false,
};
/* exports.MYSQL2 = {
    connectionLimit : 10,
    host            : '192.168.0.114',
    user            : 'operador',
    password        : 'NiotecOp15!',
    database        : 'tally_model',
    debug           : false
}; */
exports.SECRET = "noselodigasanadie";
exports.PUBLIC = "public";
exports.PLAYERS_IP_REBOOT =
  process.env.IP_PLAYERS || "192.168.0.19X,192.168.0.19X"; //si hay ips se envia API/REBOOT DS Tiny al iniciar server
