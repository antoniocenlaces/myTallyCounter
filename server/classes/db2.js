"use strict";

const mysql = require('mysql');
const environment = require("../global/environment");
const fs = require('fs');
const Tools = require("./tools");

class Db2 {
    constructor() {
        this.sessionStore = null;

        //mode pool connection
        /*this.connection  = mysql.createPool(environment.MYSQL);
           this.connection.on('acquire', function (connection) {
            console.log(Tools.now(),`Connection BD ${connection.threadId} acquired`);
        });
        this.connection.on('connection', function (connection) {
            //connection.query('SET SESSION auto_increment_increment=1')
            console.log(Tools.now(),`Connection BD ${connection.threadId} on`);
        });
        */
        //mode one connection
        this.connection = mysql.createConnection(environment.MYSQL2);
        console.log(`Configuración BD2: ${JSON.stringify(environment.MYSQL2)}`);
         var del = this.connection._protocol._delegateError;
         this.connection._protocol._delegateError = function(err, sequence){
            if (err.fatal) {
            console.trace(Tools.now(),'fatal error: ' + err.message);
            }
            return del.call(this, err, sequence);
        };
        this.connection.connect((err) => {
            if (err) {
                console.log(err.code); // 'ECONNREFUSED'
                console.log(err.fatal); // true
                this._intance = null;
                return;
            }
            console.log(Tools.now(),'Connected to database');
            
            setInterval(()=>{
                console.log(Tools.now(),'Heartbeat to database');
                const query = "SELECT * FROM `Usuarios` WHERE `UsuarioID` = 1"; // query database to get all the settings
                this.query(query, (err, result) => {
                    if (err) {
                        // TODO
                        return console.warn(err);
                    }
                });
            },60*1000);
        });

        this.connection.on('error', function(err) {
            console.error(Tools.now(),err.code); // 'ER_BAD_DB_ERROR'
            console.error(Tools.now(),err.fatal); // '_ERROR'
        });
          
    }

    static get instance() {
        return this._intance || (this._intance = new this());
    }

    deleteCamion(data) {
        let d = new Date();
        d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
        const query = "UPDATE `truck` SET deleted = '" + d.toISOString().slice(0, 19).replace('T', ' ') + "' WHERE id=" + data.id;
        return this.query(query);
    }

    insertCamion(data) {
        let d = new Date();
        d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
        const sqldata = [
            data.matricula,
            data.transporte,
            data.dock,
            d.toISOString().slice(0, 19).replace('T', ' '),
            null
        ];
        const sql = "INSERT INTO `truck` (`matricula`, `transporte`, `dock`, `created`, `deleted`) VALUES ?";
        return this.query(sql, [[sqldata]]).then( result => {
            return this.settings.then( s => {
                // Va bien
                const truck = {
                    id: result.insertId,
                    matricula: sqldata[0],
                    transporte: sqldata[1],
                    dock: sqldata[2],
                    created: sqldata[3],
                    deleted: sqldata[4]
                };
                const slug = Tools.slug(sqldata[1]);
                if (s.transports_by_slug[slug]) {
                    truck.transport_full = s.transports_by_slug[slug];    
                }
                return truck;
            });
        });
    }

    getCamion(id) {
        const query = "SELECT * FROM `truck` WHERE `id` = " + id.toString(); // query database to get all the settings
        return this.query(query);
    }

    getCamiones() {
        const query = "SELECT * FROM `truck` WHERE `deleted` is NULL ORDER BY id DESC"; // query database to get all the settings
        return this.query(query).then((result) => {
            return this.settings.then( s => {
                result = result.map( truck => {
                    const slug = Tools.slug(truck.transporte);
                    if (!s.transports_by_slug[slug]) {
                        return truck;
                    }
                    truck.transport_full = s.transports_by_slug[slug];
                    return truck;
                });
                return result;
            });
        }).catch((err) => {
            console.warn(Tools.now(),err);
        });
    }

    checkDeleted() {
        return this.settings.then( res => {
            let now = new Date();
            now.setTime( now.getTime() - now.getTimezoneOffset()*60*1000 );
            let d = new Date();
            d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 - res.t3*60000 );
            //const query = "UPDATE `truck` SET deleted = '" + now.toISOString().slice(0, 19).replace('T', ' ') + "' WHERE deleted is null AND created < '" + d.toISOString().slice(0, 19).replace('T', ' ') + "'"; //no hay borrado programado que las borre
            const query = "UPDATE `truck` SET deleted = '" + now.toISOString().slice(0, 19).replace('T', ' ') + "' WHERE deleted is null";
            return this.query(query).catch((err) => {
                console.warn(Tools.now(), err);
            });
        });
    }

    get camiones() {
        return this.getCamiones();
    }

    clearSettings() {
        this._settings = null;
    }

    getSettings() {
        const query = "SELECT * FROM `settings` ORDER BY id ASC"; // query database to get all the settings
        return this.query(query).then((result) => {
            this._settings = {};
            result.forEach(v => {
                if (v.key == 'transports') {
                    let aux = v.value_text.split(",");
                    const transports = [];
                    const transports_by_slug = {};
                    aux.forEach((name) => {
                        name = name.trim();
                        let logo = '';
                        const slug = Tools.slug(name);
                        if (fs.existsSync('./' + environment.PUBLIC + '/carrierLogos/' + slug + '.png')) {
                            logo = '/carrierLogos/' + slug + '.png';
                        } else if (fs.existsSync('./' + environment.PUBLIC + '/carrierLogos/' + slug + '.jpg')) {
                            logo = '/carrierLogos/' + slug + '.jpg';
                        }
                        if (logo) {
                            transports_by_slug[slug] = {name, logo, slug};
                            transports.push(transports_by_slug[slug]);
                        } else {
                            name = name.substring(0,15);//limit max text showed
                            transports.push({name}); 
                        }
                    });
                    this._settings[v.key] = transports;
                    this._settings[v.key + "_by_slug"] = transports_by_slug;
                } else {
                    this._settings[v.key] = v.value_integer; // TODO: mejorar para otros valores
                }
            })
            return this._settings;
        }).catch((err) => {
            console.warn(Tools.now(),err);
        });
    }

    get settings() {
        if (this._settings) {
            return new Promise( ( resolve, reject ) => { resolve(this._settings) } );
        }
        return this.getSettings();
    }

    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );
                resolve( rows );
            } );
        } );
    }
 

}
module.exports = Db2;