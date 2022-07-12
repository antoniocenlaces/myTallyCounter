"use strict";

const mysql = require('mysql');
const environment = require("../global/environment");
const fs = require('fs');
const Tools = require("./tools");

class Db {
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
        this.connection = mysql.createConnection(environment.MYSQL);
        console.log(`Configuración BD: ${JSON.stringify(environment.MYSQL)}`);
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
                const query = "SELECT * FROM `truck` WHERE `id` = 0"; // query database to get all the settings
                this.query(query, (err, result) => {
                    if (err) {
                        // TODO
                        return console.warn(err);
                    }
                });
            },60*60*1000);
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
        console.log(`en insertCamion comprueba que dates recibo: ${JSON.stringify(data)}`)
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

    insertFootballMatch(data) {
        const sqldata=[
            data.descripcion,
            data.jornada,
            data.unidadMovil,
            data.ip
        ]
        const sql="INSERT INTO `Partidos` (Descripcion,JornadaID,UMID,IPaddress) VALUES ?";
        return this.query(sql, [[sqldata]]).then( result => {
           data.partidoId= result.insertId;
           data.registrando=false;
           data.conectado=false;
            return data;
            });
    }

   // Función para leer todos los datos de un partido y enviarlos a ventana de visualización
   // Si no hay asociación de Entradas-Cámaras para ese partido devuelve un error en la propiedad err
    readFootballMatch(data) {
        //
        // primero verifica si ese partido tiene entradas-cámaras definidas
        console.log(`Soy db.js en readFootballMatch, recibo leer partidoId: ${data.partidoId}`);
        const partidoId=data.partidoId;
        let sql="SELECT EMID FROM Entradas_mezcladora WHERE PartidoID="+partidoId;
        data.err={active:false};
        return this.query(sql).then(result => {
            // console.log(`Dentro de consulta a mezcladora: ${JSON.stringify(result)}`);
            if (result.length>0) {
             // existe una lista de Entradas-Cámaras para este paritdo, voy a ver si ha alguna EVS definida en la tabla Entradas_mezcladora
                sql="SELECT EMID FROM Entradas_mezcladora INNER JOIN Entradas USING (EntradaID) WHERE PartidoID="+partidoId+" AND esEVS=1";
                return this.query(sql).then(result => {
                    if (result.length>0) { // al menos hay un EVS definido, por tanto debe existir una relación de cámaras en tabla EVS
                        sql="SELECT EVSID FROM EVS WHERE PartidoID="+partidoId;
                        return this.query(sql).then(result => {
                            if (result.length>0) { // hay algún EVS asociado a cámaras en tabla EVS
                                data.err.active=false;
                            } else {
                                data.err.source='checkEVS';
                                data.err.value='No existe asociación de cámaras para las EVS definidas';
                                data.err.active=true;
                            }
                            return data;
                        });
                    } else { // no se han definido EVS para este partido, lo cual no es un error
                        data.err.active=false;
                    }
                    return data;
                });
            } else {
                data.err.source='readFootballMatch';
                data.err.value='No existe asociación de cámaras para este partido';
                data.err.active=true;
            }
            return data;
        }).then(result => {
            if (result.err.active) { // si no hay entradas-camaras devuelve err.active=true y un mensaje
                return result;
            } else { // caso que se encuentren entradas-camaras definidas, consulta los datos de ese partido y su lista entradas-camaras
                sql="SELECT p.PartidoID, p.Descripcion, p.IPaddress, j.Descripcion as 'Jornada',  e.EntradaID, v.esEVS, e.Descripcion_camara, u.Nombre as 'Unidad_Movil' FROM Partidos p INNER JOIN Jornadas j USING (JornadaID) INNER JOIN Unidades_Moviles u USING (UMID) INNER JOIN Entradas_mezcladora e USING (PartidoID) INNER JOIN Entradas v USING (EntradaID) WHERE p.PartidoID="+partidoId;
                return this.query(sql).then( result => {  // el resultado de la consulta va construyendo el objeto Partido y Camaras
                   // console.log(`he entrado hasta leer datos partido y entradas: ${JSON.stringify(result)}`);
                    data.descripcion=result[0].Descripcion;
                    data.jornada=result[0].Jornada;
                    data.unidadMovil=result[0].Unidad_Movil;
                    data.ip=result[0].IPaddress;
                    data.registrando=false;
                    data.conectado=false;
                    data.camaras=[];
                    result.forEach(element => {
                       const camara = {'entradaId': element.EntradaID, 'descripcion': element.Descripcion_camara, 'esEVS': element.esEVS, 'contador': '00:00:00','unixTimer': -3600000,'on': false, EVSs: []};
                       // añado el atributo EVSs al objeto camara, que es un array de objetos que contiene el EVSID y la Descripcion_camara de cada EVS definido
                       sql="SELECT EVSID, Descripcion_camara as 'Descripcion' FROM EVS WHERE PartidoID="+partidoId+" AND EntradaID="+camara.entradaId;
                       return this.query(sql).then(result => {
                            if (result.length>0) { // como aquí result es un array que contiene todas las cámaras asociadas con este EVS, he de iterar en él
                               result.forEach (element =>{
                                const EVS= {'evsid': element.EVSID, 'descripcion': element.Descripcion};
                                camara.EVSs.push(EVS);});
                            } 
                            data.camaras.push(camara);
                       });
                    });  
                    return data;
                }).then(data => { // voy a insertar en el objeto data (Partido) los periodos de partido definidos
                        sql="SELECT p.PPID, c.Descripcion, p.Hora_inicio, p.Hora_fin, p.PeriodoID, p.Orden FROM Periodos_partido p INNER JOIN Periodos_conteo c USING (PeriodoID) WHERE PartidoID="+partidoId;
                        return this.query(sql).then(result => {
                            if (result.length>0) {
                                data.periodos=[];
                                result.forEach(element => {
                                    const periodo = {'PPID': element.PPID, 'nombre':element.Descripcion, 'horaInicio': element.Hora_inicio, 'horaFin': element.Hora_fin, 'partidoId': partidoId, 'periodoId': element.PeriodoID, 'orden': element.Orden};
                                    data.periodos.push(periodo);
                                });
                            } else {
                                data.err.source='readFootballMatch';
                                data.err.value='No existe ningún periodo de conteo para este partido';
                                data.err.active=true;
                            }
                            return data;
                        });
                    });

            }
        });
    }
   // recibe tallyData = {
//     partidoId,
//     entradaId,
//     'newTallyId': 0,
//     entradaIdAnterior,
//     'oldTallyId': 0,
//     momento
// };
// función newTally escribe momento en el TallyID que sale (TiempoOFF) y genera nuevo TallyID para entrada escribiendo momento en TiempoON, devuelde el nuevo TallyID creado en 'newTallyId'
    newTally(tallyData) {
        let sql= "";
        if (tallyData.oldTallyId) { // hay que poner TiempoOFF en 'oldTallyId'
            sql="UPDATE Tallies SET TiempoOFF='"+tallyData.momento+"' WHERE TallyID="+tallyData.oldTallyId;
            return this.query(sql).then(result => {
                // abrá que anidar también la consulta para crear nuevo tally
                console.log(`en newTally poniendo TiempoOFF ${JSON.stringify(result)}`);
                return result;
            }).then(() => { // hay que crear nuevo registro en Tallies con la entrada nueva
                sql="INSERT INTO Tallies (PartidoID, EntradaID, TiempoON) VALUES ("+tallyData.partidoId+","+tallyData.entradaId+",'"+tallyData.momento+"')";
                return this.query(sql).then(result => {
                    // abrá que anidar también la consulta para crear nuevo tally
                    console.log(`en newTally creando nuevo Tally ${JSON.stringify(result)}`);
                    return result;
                });
            });
        } else { // solo hay que crear nuevo tally
            sql="INSERT INTO Tallies (PartidoID, EntradaID, TiempoON) VALUES ("+tallyData.partidoId+","+tallyData.entradaId+",'"+tallyData.momento+"')";
            return this.query(sql).then(result => {
                // abrá que anidar también la consulta para crear nuevo tally
                console.log(`en newTally creando nuevo Tally ${JSON.stringify(result)}`);
                return result;
            });
        }
        
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
    getPartidos() {
        const query= "SELECT p.PartidoID, p.Descripcion, j.JornadaID, j.Descripcion as 'Jornada' FROM Partidos p INNER JOIN Jornadas j USING (JornadaID)";
        return this.query(query).then((result)=> {
            return result;
        }).catch((err) => {
            console.warn(Tools.now(),err);
        });
    }
    get partidos() {
        return this.getPartidos();
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
           // let partidos=[];
         //   partidos=this.getPartidos();
         //   console.log('Tipos de dato partidos',typeof(partidos));
         //   console.log(`voy a mostrar si hay algo en this.getPartidos()`);
         //   Object.entries(this.getPartidos()).forEach(p=>{console.log(`${JSON.stringify(p)}`);});
            // this._settings.partidos=partidos;
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
                // console.log(`en la query de db.js con sql=: ${sql}`);
                // console.log(`en la query de db.js argum: ${JSON.stringify(args)}`);
                if ( err )
                    return reject( err );
                    // console.log(`en la query de db.js rows: ${JSON.stringify(rows)}`);
                resolve( rows );
            } );
        } );
    }
 

}

module.exports = Db;
