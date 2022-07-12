"use strict";

const Db = require("../classes/db");
const TinyPlayer = require('../classes/tinyDevice');
const Tools = require("../classes/tools");
const cookie = require('cookie'); //Para parsear las cookies que vengan en la request

class TallyData {
    constructor(data) {
      const date = new Date();
      this.partidoId=data.partidoId || 0;
      this.entradaId=data.entradaId || 0;
      this.newTallyId=data.newTallyId || 0;
      this.entradaIdAnterior=data.entradaIdAnterior || -1;
      this.oldTallyId=data.oldTallyId || 0;
      this.momento=data.momento || `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    }
}

const tallyDataInProgress = {}; // para guardar los tallyData's de los partidos en activo

exports.conectar = (cliente, io, clientesStatus) => {
    let clientIP =Tools.getIP(cliente.handshake.address);
    let status = true;
    let existe = clientesStatus.findIndex((x) => x.clientIP == clientIP);
    if (existe < 0) clientesStatus.push({clientIP,status}); //añadimos al listado
    else clientesStatus[existe].status = true; //desconectado
    //console.log (clientesStatus);

    console.log(Tools.now(),'Cliente conectado', clientIP," Id:",cliente.id,);

    //FORCE UPDATE SETTINGS > LISTA
    const db = Db.instance
    const settings = db.settings;
    settings.then((s) => {
        io.to(cliente.id).emit('settings-completa', s);
    });
};
exports.desconectar = (cliente, io, clientesStatus) => {
    cliente.on('disconnect', () => {
        let clientIP =Tools.getIP(cliente.handshake.address);
        let existe = clientesStatus.findIndex((x) => x.clientIP == clientIP);
        if (existe) clientesStatus[existe].status = false; //desconectado
        //console.log (clientesStatus);

        console.log(Tools.now(),'Cliente desconectado', clientIP," Id:",cliente.id,); 
    });
};
// obtener lista
exports.lista = (cliente, io) => {
    cliente.on('lista', () => {
        const db = Db.instance
        const camiones = db.camiones;
        camiones.then((lista) => {
            io.to(cliente.id).emit('lista-completa', lista);
        });
    });
};

// añadir a lista
exports.addtolista = (cliente, io, clientesStatus) => {
    console.log(`en socket addtolista, cliente:  clientsStatus: ${JSON.stringify(clientesStatus)} `);
    cliente.on('add-to-lista', (data) => {
        console.log(`en socket addtolista, data recibido ${JSON.stringify(data)}`);
        let d = new Date();
        d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
        data.created = d.toISOString().slice(0, 19).replace('T', ' ');
        console.log(`en socket addtolista, añadido created ${JSON.stringify(data)}`);
        const db = Db.instance
        return db.insertCamion(data).then( truck => {
            io.emit('lista-added', truck);
            console.log(`desde socket camión intro y emitido: ${JSON.stringify(truck)}`);
            //PLAY AVISO TINY PLAYERS
            let serverIP = Tools.getIPAddress();
            for (let i = 0, len = clientesStatus.length; i < len; i++) {
                let ip = clientesStatus[i].clientIP;
                //console.log("Player to Play Aviso:",ip);
                if ((ip.length>7)&& (ip != '127.0.0.1') && (ip != serverIP) && (clientesStatus[i].status)) {
                    var Player = new TinyPlayer(ip);
                    Player.playAviso();
                }
            }
            //*****TODO ROLLING SESSION ******/
            //cliente.handshake.session.touch().save();
            //console.log('insertCamion session data is %j.', cliente.handshake.session,"session Id", cliente.handshake.sessionID);
            /*const cookies = cookie.parse(cliente.handshake.headers.cookie); //Parseamos las cookies enviadas en la request
            let sessionId = (cookies['connect.sid'].split(".")[0].split(":"));
            sessionId = sessionId[sessionId.length-1];
            db.sessionStore.get(sessionId, function(err, session) {
                if (!err && session) {
                    var expires = new Date();
                    console.log(Tools.now(),"session:session_ID",sessionId,session);
                    session.cookie.maxAge = session.cookie.originalMaxAge;
                    expires.setSeconds(expires.getSeconds() + session.cookie.maxAge/1000);
                    session.cookie.expires = expires;
                    db.sessionStore.touch(sessionId, session);
                    db.sessionStore.save;
                }
            });*/
            // Programar el borrado automático
            const settings = db.settings;
            return settings.then((s) => {
                setTimeout(() => {
                    // Eliminar entrada
                    // Comprobar si no está ya eliminado antes (de forma manual)
                    db.getCamion(truck.id).then( result => {
                        if (result.length > 0 && !result[0].deleted) {
                            let d = new Date();
                            d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
                            const query = "UPDATE `truck` SET deleted = '" + d.toISOString().slice(0, 19).replace('T', ' ') + "' WHERE id=" + truck.id;
                            db.connection.query(query, (err, result) => {
                                if (err) {
                                    // TODO
                                    return console.warn(Tools.now(),err);
                                }
                                io.emit('lista-removed', {id: parseInt(truck.id)});
                            });
                        }
                    })
                }, s.t3*60*1000);
            });
        }).catch( err => {
            // Ha ido mal
            // TODO
            console.warn(Tools.now(),err);
        });
    });
};

// añadir a lista
exports.addtopartido = (cliente, io) => {
     console.log(`en socket addtopartido FUERA DEL ON `);
    cliente.on('add-new-partido', (footballMatch) => {
        console.log(`en socket "add-new-partido", partidoId: ${footballMatch.partidoId}`);
        console.log(`en socket "add-new-partido", user recibido: ${JSON.stringify(footballMatch.user)}`);
        const db = Db.instance
        return db.readFootballMatch(footballMatch).then( dataRead => {
            // footbalMatch es objeto tipo Partido que viene de 'submitMatchData' del dashboard.js y que contiene el user que ha pedido cargar los datos de un partido
            //caso que no haya asociación de cámaras hay que emitir un error
            // if (dataRead.err.active) throw(`Error en: ${dataRead.err.source}. ${dataRead.err.value}`);
            // al crear un nuevo partido cargo la variable global tallyDataInProgress para que al generar un primer tally o al generar tally aleatorio esté inicializada
            const date = new Date();
            const momento = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
            const data = {
                'partidoId': dataRead.partidoId,
                'entradaId': -1,
                'newTallyId': 0,
                'entradaIdAnterior': -1,
                'oldTallyId': 0,
                momento
            };
            const tallyData = new TallyData(data);
            tallyDataInProgress[dataRead.partidoId] = tallyData;
            console.log(`Inicializado objeto global tallyDataInProgress: ${JSON.stringify(tallyDataInProgress)}`);
            io.emit('partido-added', dataRead);
         // console.log(`NUEVO LECTURA PARTIDO RECIBIDO de DB en socket addtopartido: ${JSON.stringify(dataRead)}`);    
        }).catch( err => {
            // Ha ido mal
            // TODO
            console.warn(Tools.now(),err);
        });
    });
};
// genera tallies aleatorios

// Insertar genera primer tally


// función que debe ser la que esté escuchando a las mezcladoras y genera tallies cuando los recibe
exports.generaTallyAleatorio = (cliente, io) => {
    console.log(`Ha arrancado el generador de tallies aleatorio`);
    const entradas = [];
    for (let i = 1; i <= 24; i++) {
       entradas.push(i);
    }
    for (let i = 37; i <= 42; i++) {
        entradas.push(i);
    }
    entradas.push(45);
    const numEntradas= entradas.length;
    let entradaIdAnterior =-1;
    cliente.on('genera-tally-aleatorio', (partidoId) => {
        console.log(`En socket generaTallyAleatorio, partido: `,partidoId);
        const indiceEntradas = Math.floor(Math.random()*numEntradas); // este será el código que escucha el TSL y devuelve que partido (en funicón de la IP) y que entrada se ha activado
        // registro el instante enque ha llegado el nuevo tally
        const date = new Date();
        const momento = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
        // cargo tallyData para el partido detectado. está en un objeto que guarda los tallyData's de todos los partidos activos
        const tallyData = tallyDataInProgress[partidoId];
        tallyData.entradaIdAnterior=tallyData.entradaId; // la entrada que estaba activa al llegar nuevo tally la pongo como anterior
        tallyData.entradaId=entradas[indiceEntradas]; // indico la nueva entrada a mostrar
        tallyData.oldTallyId=tallyData.newTallyId; // almaceno en oldTallyId el ID de la tabla Tallies donde tendré que poner el tiempo off
        tallyData.momento=momento;
        // tallyDataInProgress[partidoId] = tallyData;
        // emito para que los clientes cambien a esta nueva entrada y guarden la anterior
        // io.emit('new-tally',tallyData);
        const db = Db.instance
            return db.newTally(tallyData).then((result) => {
                console.log(`en SOCKET generaTallyAleatorio resultado recibido de DB: ${JSON.stringify(result)}`);
                tallyData.newTallyId=result.insertId;
                // cargo por primera vez el objeto tallyDataInProgress para saber que partidos y que tienen activo
                tallyDataInProgress[partidoId] = tallyData;
                io.emit('new-tally',tallyData);
            }).catch( err => {
            // Ha ido mal
            // TODO
                    console.warn(Tools.now(),err);
                });;
    });
};
exports.gestionPeriodos = (cliente, io) => {
    cliente.on('pulsado-periodo', (periodo) => {
        
       // if (!periodo.active) {
            // const date = moment(new Date());
            // periodo.active=true;
            // periodo.horaInicio= date.format('HH:mm:ss');
            // he de escribir en BD la horaInicio para perido.PPID
            // periodo.partidoId=1; // esto lo debe devolver DB ya que lo tiene en la tabla Periodos_partido
            console.log(`En 'pulsado periodo' el momento de inicio: ${periodo.horaInicio} para el PPID: ${periodo.PPID}`);
            // hay que update tabla Periodos_partido para grabar hora de inicio
        // } else {
        //     periodo.err= {
        //         'active': true,
        //         'source':'gestionPeriodos',
        //         'value':'No puedes iniciar un periodo ya iniciado. Usa el botón FIN para finalizar el peirodo activo.'
        //     };
        // }
        // console.log(`En socket gestión Periodos, emito: ${JSON.stringify(periodo)}`);
        io.emit('periodo-iniciado',periodo);
    });
    cliente.on('pulsado-fin', (periodo) => {
        // he de escribir en BD para PPID el momentoFin
        console.log(`En 'pulsado fin' el momento de fin: ${periodo.horaFin} para el PPID: ${periodo.PPID}`);
        io.emit('periodo-finalizado',periodo);
    });
};
// eliminar de lista
exports.removefromlista = (cliente, io) => {
    cliente.on('remove-from-lista', (data) => {
        const db = Db.instance
        return db.deleteCamion(data).then( truck => {
            io.emit('lista-removed', data);
        }).catch( err => {
            // Ha ido mal
            // TODO
            console.warn(Tools.now(),err);
        });
    });
};

// obtener settings
exports.settings = (cliente, io) => {
    cliente.on('settings', () => {
        const db = Db.instance
        const settings = db.settings;
        settings.then((s) => {
            io.to(cliente.id).emit('settings-completa', s);
        });
    });
};

