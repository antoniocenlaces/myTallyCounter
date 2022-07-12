"use strict";

const express = require("express");
const crypto = require('crypto');

const Server = require("../classes/server");
const path = require('path');
const Db = require("../classes/db");
// const Db2 = require("../classes/db2");
const Tools = require("../classes/tools");
const environment = require("../global/environment");

const { version } = require('../package.json');
const { Console } = require("console");

const router = express.Router();

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        return res.redirect("/login");
    });
});

// create the login get and post routes
router.all('/login', (req, res) => {
    if (req.method != "POST") {
        //console.log("router.all:NOT POST> render login");
        return res.render('login.ejs', {
            title: 'Login',
            message: '',
            appVersion: version
        });
    }
    var post = req.body;
    var name = post.username;
    var pass = post.passwd;
    const passwd = crypto.createHmac('sha256', environment.SECRET)
        .update(pass)
        .digest('hex');

    var query = "SELECT id, first_name, last_name, username FROM `user` WHERE `username`='" + name + "' and passwd = '" + passwd + "'";
    const db = Db.instance;
    // console.log("router.all:POST> db.connection.query CONECTADO");
    db.connection.query(query, (err, result) => {
        // console.log("router.all:POST> response query RESPONDIDA QUERY");
        if (result && result.length) {
            req.session.userId = result[0].id;
            req.session.user = result[0];
            // console.log("router.all:POST> render admin",req.session.userId,req.session.user);
            // console.log(`Intro datos usuario OK: ${JSON.stringify(result)}`);
            return res.redirect('/admin');
        } else {
            // console.log("router.all:POST> render login",req.session.userId,req.session.user);
            // console.log(`Datos usuario NO OK: ${JSON.stringify(result)}`);
            return res.render('login.ejs', {
                title: 'Login',
                message: 'Nombre de usuario o contraseña erronea.',
                appVersion: version
            });
        }
    });
    /*     var query2 = "SELECT UsuarioID,Nombre,AutorizacionID FROM `Usuarios`";                           
        const db2=Db2.instance;
        // console.log("Intentando conexión a Tally");
        db2.connection.query(query2, (err, result) => {
            // console.log(" RESPONDIDA QUERY");
            // console.log(`Result respuesta tally: ${JSON.stringify(result)}`);
        }); */
});



router.use(
    function (req, res, next) {
        //req.session.touch().save();
        var user = req.session.user,
            userId = req.session.userId;
        //console.log("router.use>",req.session.userId,req.session.user);
        //console.log('req. session data is %j.', req.session,"session Id", req.sessionID);
        if (userId == null) {
            //console.log("router.use>redirect login",req.session.userId,req.session.user);
            return res.redirect("/login");
        }
        next();
    }
)

router.get('/', (req, res) => {
    var user = req.session.user;
    const db = Db.instance;
    const settings = db.settings;
    const partidos = db.partidos;
    settings.then((s) => {
        partidos.then((p) => {
            // console.log(`en router /admin recibo obj partido: ${JSON.stringify(p)}`);
            // console.log(`Ver usuario en session: ${JSON.stringify(req.session)}`);
            res.render('admin/index.ejs', {
                title: 'Dashboard',
                user: req.session.user,
                t1: s.t1,
                transports: s.transports.sort(Tools.compareName),
                transports_by_slug: s.transports_by_slug,
                now: new Date(),
                appVersion: version,
                partidos: p
            });
        });
    }).catch(err => {
        console.warn("ERROR", err);
    });
});



// Sirve el dashboard
router.get('/admin', (req, res) => {
    var user = req.session.user;
    const db = Db.instance;
    const settings = db.settings;
    const partidos = db.partidos;
    settings.then((s) => {
        partidos.then((p) => {
            // console.log(`en router /admin recibo obj partido: ${JSON.stringify(p)}`);
            // console.log(`Ver usuario en session: ${JSON.stringify(req.session)}`);
            res.render('admin/index.ejs', {
                title: 'Dashboard',
                user: req.session.user,
                t1: s.t1,
                transports: s.transports.sort(Tools.compareName),
                transports_by_slug: s.transports_by_slug,
                now: new Date(),
                appVersion: version,
                partidos: p
            });
        });
    }).catch(err => {
        console.warn("ERROR", err);
    });
});

/*
router.get('/admin/delete/:id', (req, res) => {
    const query = "UPDATE `truck` SET deleted = '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "' WHERE id=" + req.params.id;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        const server = Server.instance;
        server.io.emit( 'lista-removed', {id: parseInt(req.params.id)});
        return res.redirect('/admin');
    });
});
*/

/*
router.post('/admin', (req, res) => {
    const db = Db.instance;
    return db.insertCamion(req.body).then( truck => {
        const server = Server.instance;
        server.io.emit( 'lista-added', truck);
        // Programar el borrado automático
        const settings = db.settings;
        return settings.then((s) => {
            setTimeout(() => {
                // Eliminar entrada
                const query = "UPDATE `truck` SET deleted = '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "' WHERE id=" + truck.id;
                db.connection.query(query, (err, result) => {
                    if (err) {
                        return console.warn(err);
                    }
                    server.io.emit( 'lista-removed', {id: parseInt(truck.id)});
                });
            }, s.t3*60*1000);
            return res.redirect('/admin');
        });
    }).catch( err => {
        // Ha ido mal
        return res.status(500).send(err);
    });
});*/

router.get('/admin/settings', (req, res) => {
    // TODO: usar los settings de la clase
    // execute query
    //const query = "SELECT * FROM `settings` WHERE `key` in ('t1', 't2', 't3', 't4', 'pageSize') ORDER BY id ASC"; // query database to get all the settings
    const query = "SELECT * FROM `settings` WHERE `key` in ('t1', 't2', 't3', 't4') ORDER BY id ASC"; // query database to get all the settings
    const db = Db.instance;
    //const server = Server.instance;
    //console.log("ClientesStatus:",server.clientsStatus);

    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('admin/config_display.ejs', {
            title: 'Config display settings',
            user: req.session.user,
            settings: result,
            appVersion: version
        });
    });
});

router.post('/admin/settings', (req, res) => {
    let message = '';
    const data = req.body;
    const column = data.column || 'value_integer';
    delete data.column;
    const sql = "UPDATE `settings` SET `" + column + "`=? WHERE `key`=?";
    let promises = [];
    const db = Db.instance;
    Object.keys(data).forEach((k) => {
        promises.push(db.query(sql, [parseInt(data[k]), k]));
    });
    Promise.all(promises).then(values => {
        db.clearSettings();
        const settings = db.settings;
        settings.then((s) => {
            const server = Server.instance;
            server.io.emit('settings-completa', s);
        });
        req.flash('success', 'Parámetros guardados correctamente');
        return res.redirect('/admin/settings');
    }).catch(err => {
        req.flash('error', err.message);
        return res.redirect('/admin/settings');
    })
});

/* CARRIER */
router.get('/admin/carrier', (req, res) => {
    // TODO: usar los settings de la clase
    // execute query
    const query = "SELECT * FROM `settings` WHERE `key` in ('transports') ORDER BY id ASC"; // query database to get all the settings
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('admin/config_carrier.ejs', {
            title: 'Config display settings',
            user: req.session.user,
            settings: result,
            appVersion: version
        });
    });
});

router.post('/admin/carrier', (req, res) => {
    let message = '';
    const data = req.body;
    const column = data.column || 'value_text';
    delete data.column;
    const sql = "UPDATE `settings` SET `" + column + "`=? WHERE `key`=?";
    let promises = [];
    //console.log("data:",data);
    const db = Db.instance;
    Object.keys(data).forEach((k) => {
        //console.log("data[k]:",data[k]);
        //console.log("[k]:",k);
        promises.push(db.query(sql, [(data[k].toUpperCase()), k]));
    });
    Promise.all(promises).then(values => {
        db.clearSettings();
        const settings = db.settings;
        settings.then((s) => {
            const server = Server.instance;
            server.io.emit('settings-completa', s);
        });
        req.flash('success', 'Parámetros guardados correctamente');
        return res.redirect('/admin/carrier');
    }).catch(err => {
        req.flash('error', err.message);
        return res.redirect('/admin/carrier');
    })
});

/* USERS */
router.get('/admin/users/create', (req, res) => {
    res.render('admin/users/user_register.ejs', {
        title: 'Create user',
        user: req.session.user,
        appVersion: version,
    });
});

router.get('/admin/users/delete', (req, res) => {
    const query = "SELECT * FROM `user` ORDER BY username ASC"; // query database to get all the users

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('admin/users/user_delete.ejs', {
            title: 'Delete user',
            user: req.session.user,
            users: result.filter(user => user.username != 'admin'),
            appVersion: version
        });
    });
});

router.get('/admin/users/update/:id?', (req, res) => {
    let query = "SELECT * FROM `user` ORDER BY id ASC"; // query database
    if (undefined !== req.params.id) {
        // Editar perfil
        query = "SELECT * FROM `user` WHERE id = " + req.params.id; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('admin/users/user_update.ejs', {
            title: 'Update user',
            user: req.session.user,
            users: (undefined !== req.params.id) ? result : result.filter(user => user.username != 'admin'),
            appVersion: version

        });
    });
});

router.post('/admin/users/delete', (req, res) => {
    let message = '';
    const userid = req.body.userid;
    const query = 'DELETE FROM user WHERE id = ' + userid;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "delete user:", err.message);
            req.flash('error', 'Seleccione un usuario'); //req.flash('error', err.message);
            req.flash('userid', userid);
            return res.redirect('/admin/users/delete');
        }
        req.flash('success', 'Usuario borrado correctamente');
        return res.redirect('/admin/users/delete');
    });
});

router.post('/admin/users/update/:id?', (req, res) => {
    let uri = '/admin/users/create';
    const userid = req.body.userid || req.params.id;
    const username = req.body.username;
    const create = !userid;
    if (!create) {
        if (req.params.id) {
            uri = '/admin/users/update/' + req.params.id;
        } else {
            uri = '/admin/users/update';
        }
    }
    const new_pass1 = req.body.pass1;
    const new_pass2 = req.body.pass2;
    if (new_pass1 != new_pass2) {
        req.flash('error', 'Las contraseñas deben coincidir!');
        req.flash('username', req.body.username);
        req.flash('userid', userid);
        return res.redirect(uri);
    }
    let query, updateQuery;
    if (create) {
        // Create
        query = "SELECT * FROM `user` WHERE username = '" + username + "'";
        updateQuery = "INSERT INTO `user` (username, passwd) VALUES ('" + username + "', '%pass%')";
    } else {
        // Update
        query = "SELECT * FROM `user` WHERE id = " + userid;
        updateQuery = "UPDATE `user` SET passwd = '%pass%' WHERE id=" + userid;
    }
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('username', req.body.username);
            req.flash('userid', userid);
            return res.redirect(uri);
        }
        if (!create && result.length == 0) {
            // Username not exist
            req.flash('error', 'Nombre de usuario no existe');
            req.flash('username', req.body.username);
            req.flash('userid', userid);
            return res.redirect(uri);
        }
        if (create && result.length > 0) {
            // Username already exist
            req.flash('error', 'Nombre de usuario ya existe');
            req.flash('username', req.body.username);
            req.flash('userid', userid);
            return res.redirect(uri);
        }
        const passwd = crypto.createHmac('sha256', environment.SECRET)
            .update(new_pass1)
            .digest('hex');
        // update user into database
        updateQuery = updateQuery.replace('%pass%', passwd);
        db.connection.query(updateQuery, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                req.flash('username', req.body.username);
                req.flash('userid', userid);
                return res.redirect(uri);
            }
            req.flash('success', (create) ? 'Usuario creado correctamente' : 'Usuario modificado correctamente');
            return res.redirect(uri);
        });
    });
});





























































































































































































































































































/* (clpp, 08/07/2022) - PARTIDOS: football_match/... (sidevar.ejs)  */

/* Register "MATCH" - From "GET" Method Form */
router.get('/football_match/register', (req, res) => {
    // Nested query (1 out of 5)
    let sportsDayQuery = "SELECT * FROM `Jornadas` ORDER BY Descripcion ASC;"; // query database to get all the "SportsDay"

    // Array declaration to store partial "results" 
    let jornadas = [];
    let unidadesMoviles = [];
    let mezcladoras = [];
    let entradas = [];
    let camaras = [];

    const db = Db.instance;
    db.connection.query(sportsDayQuery, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        jornadas = result;
        // Nested query (2 out of 5)
        let mobileUnitQuery = 'SELECT * FROM `Unidades_Moviles` ORDER BY Nombre ASC'; // query database to get all the "Mobile Units"
        db.connection.query(mobileUnitQuery, (err, result) => {
            if (err) {
                return res.redirect('/admin');
            }
            unidadesMoviles = result;
            // Nested query (3 out of 5)
            let mixerQuery = 'SELECT * FROM `Mezcladoras` ORDER BY Nombre ASC'; // query database to get all the "Mixers"
            db.connection.query(mixerQuery, (err, result) => {
                if (err) {
                    return res.redirect('/admin');
                }
                mezcladoras = result;
                // Nested query (4 out of 5)
                let inputQuery = 'SELECT * FROM `Entradas` ORDER BY Descripcion ASC'; // query database to get all the "Cameras"
                db.connection.query(inputQuery, (err, result) => {
                    if (err) {
                        return res.redirect('/admin');
                    }
                    entradas = result;
                    // Nested query (5 out of 5)
                    let camerasQuery = 'SELECT * FROM `Entradas_mezcladora` ORDER BY Descripcion_camara ASC'; // query database to get all the "Mixer Inputs"
                    db.connection.query(camerasQuery, (err, result) => {
                        if (err) {
                            return res.redirect('/admin');
                        }
                        camaras = result;
                        res.render('football_match/match_register.ejs', {
                            title: 'Register Match',
                            user: req.session.user,
                            jornadas,
                            unidadesMoviles,
                            mezcladoras,
                            entradas,
                            camaras,
                            appVersion: version
                        });
                    });
                });
            });
        });
    });
});

/* Register "MATCH" - From "POST" Method Form */
router.post('/football_match/register', (req, res) => {
    const uri = '/football_match/register/';
    const matchSportsDay = req.body.matchSportsDay;
    const matchReference = req.body.matchReference.trim();
    const assignedMobileUnit = req.body.assignedMobileUnit;
    const assignedIPAddress = req.body.assignedIPAddress.trim();
    const assignedProducer = req.body.assignedProducer.trim();
    const assignedMixer = req.body.assignedMixer;

    if (matchReference.length == 0 || assignedIPAddress.length == 0 || assignedProducer.length == 0) {
        // Campos "Ref. partido y/o Dirección IP asignada y/o Realizador" no pueden estar vacios
        req.flash('error', `Registro FALLIDO. Alguno de los siguientes campos: "Ref. Partido", "Dirección IP Asignada" y/o "Realizador" está vacío. Por favor rellene todos los campos.`);
        return res.redirect(uri);
    }

    const query = "INSERT INTO `Partidos` (JornadaID, Descripcion, UMID, IPaddress, Realizador, MezcladoraID) VALUES ('" + matchSportsDay + "', '" + matchReference + "', '" + assignedMobileUnit + "', '" + assignedIPAddress + "', '" + assignedProducer + "', '" + assignedMixer + "')";
    console.log(query);
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        console.log(result);
        if (err) {
            req.flash('error', 'Todos los campos deben estar cumplimentados');
            return res.redirect(uri);
        }
        req.flash('success', `Partido registrado correctamente.`);
        return res.redirect(uri);
    });
});











/* (clpp, 08/07/2022 - CONFIGURACIÓN: configuration/cameras/... (sidebar.ejs) */

/* Register "CAMERA" - From "GET" Method Form */
router.get('/configuration/cameras/register', (req, res) => {
    res.render('configuration/cameras/cameras_register.ejs', {
        title: 'Register Camera',
        user: req.session.user,
        appVersion: version,
    });
});

/* Register "CAMERA" - From "POST" Method Form */
router.post('/configuration/cameras/register', (req, res) => {
    const uri = '/configuration/cameras/register/';
    const cameraDescription = req.body.cameraDescription.trim();

    if (cameraDescription.length == 0) {
        // Campo "Descripción de la Cámara" no válida
        req.flash('error', `Registro FALLIDO. La "Descripción de la Cámara" no puede estar vacía.`);
        // req.flash('cameraDescription', cameraDescription);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Camaras` WHERE Descripcion ='" + cameraDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Descripción de Cámara" existente
            req.flash('error', `Registro FALLIDO. La descripción "${cameraDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        }

        query = "INSERT INTO `Camaras` (Descripcion) VALUES ('" + cameraDescription + "')";

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Cámara registrada correctamente. Descripción de la cámara: "${cameraDescription}"`);
            // req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        });
    });
});

/* Update "CAMERA" - From "GET" Method Form */
router.get('/configuration/cameras/update/:CamaraID?', (req, res) => {
    let query = "SELECT * FROM `Camaras` ORDER BY Descripcion ASC"; // query database
    if (undefined !== req.params.CamaraID) {
        // Editar perfil
        query = "SELECT * FROM `Camaras` WHERE CamaraID = " + req.params.CamaraID; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/cameras/cameras_update.ejs', {
            title: 'Update Camera',
            user: req.session.user,
            cameras: result,
            appVersion: version,
        });
    });
});

/* Update "CAMERA" - From "POST" Method Form */
router.post('/configuration/cameras/update/:CamaraID?', (req, res) => {
    const uri = '/configuration/cameras/update';
    const cameraID = req.body.cameraID || req.params.CamaraID;
    const cameraDescription = req.body.cameraDescription.trim();

    if (cameraDescription.length == 0) {
        // Campo "Descripción de la Cámara" no válida
        req.flash('error', `Modificación FALLIDA. La "Descripción de la Cámara" no puede estar vacía.`);
        // req.flash('cameraDescription', cameraDescription);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Camaras` WHERE Descripcion='" + cameraDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Cámara" existente
            req.flash('error', `Modificación FALLIDA. La descripción "${cameraDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        }

        query = "UPDATE `Camaras` SET Descripcion ='" + cameraDescription + "' WHERE CamaraID=" + cameraID;

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Cámara modificada correctamente. Nueva descripción de la cámara: "${cameraDescription}"`);
            // req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        });
    });

    console.log(`uri: `, uri);
    console.log(`cameraID: `, cameraID);
    console.log(`cameraDescription: `, cameraDescription);
    console.log(``);
});

/* Delete "CAMERA" - From "GET" Method Form */
router.get('/configuration/cameras/delete', (req, res) => {
    const query = "SELECT * FROM `Camaras` ORDER BY Descripcion ASC"; // query database to get all the "Cameras"

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/cameras/cameras_delete.ejs', {
            title: 'Delete Camera',
            user: req.session.user,
            cameras: result,
            appVersion: version
        });
    });
});

/* Delete "CAMERA" - From "POST" Method Form */
router.post('/configuration/cameras/delete/', (req, res) => {
    const uri = '/configuration/cameras/delete';
    const cameraDescription = req.body.cameraDescription;
    const query = 'DELETE FROM Camaras WHERE CamaraID = ' + cameraDescription;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "Borrar cámara:", err.message);
            req.flash('error', 'Seleccione cámara'); //req.flash('error', err.message);
            req.flash('cameraDescription', cameraDescription);
            return res.redirect(uri);
        }
        req.flash('success', `Cámara borrada correctamente`);
        return res.redirect(uri);
    });
});



/* (clpp, 07/07/2022 - CONFIGURACIÓN: configuration/match_periods/... (sidebar.ejs) */

/* Register "MATCH PERIOD" - From "GET" Method Form */
router.get('/configuration/match_periods/register', (req, res) => {
    res.render('configuration/match_periods/match_periods_register.ejs', {
        title: 'Register Match Period',
        user: req.session.user,
        appVersion: version,
    });
});

/* Register "MATCH PERIOD" - From "POST" Method Form */
router.post('/configuration/match_periods/register', (req, res) => {
    const uri = '/configuration/match_periods/register/';
    const matchPeriodDescription = req.body.matchPeriodDescription.trim();

    if (matchPeriodDescription.length == 0) {
        // Campo "Descripción del Periodo de Partido" no válido
        req.flash('error', `Registro FALLIDO. La "Descripción del Periodo de Partido" no puede estar vacía.`);
        // req.flash('matchPeriodDescription', matchPeriodDescription);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Periodos_conteo` WHERE Descripcion ='" + matchPeriodDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Descripión del Periodo de Partido" existente
            req.flash('error', `Registro FALLIDO. La descripción "${matchPeriodDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        }

        query = "INSERT INTO `Periodos_conteo` (Descripcion) VALUES ('" + matchPeriodDescription + "')";

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Periodo de partido registrado correctamente. Descripción del periodo de partido: "${matchPeriodDescription}"`);
            // req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        });
    });
});

/* Update "MATCH PERIOD" - From "GET" Method Form */
router.get('/configuration/match_periods/update/:PeriodoID?', (req, res) => {
    let query = "SELECT * FROM `Periodos_conteo` ORDER BY Descripcion ASC"; // query database
    if (undefined !== req.params.PeriodoID) {
        // Editar perfil
        query = "SELECT * FROM `Periodos_conteo` WHERE PeriodoID = " + req.params.PeriodoID; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/match_periods/match_periods_update.ejs', {
            title: 'Update Match Period',
            user: req.session.user,
            matchPeriods: result,
            appVersion: version,
        });
    });
});

/* Update "MATCH PERIOD" - From "POST" Method Form */
router.post('/configuration/match_periods/update/:PeriodoID?', (req, res) => {
    const uri = '/configuration/match_periods/update';
    const matchPeriodID = req.body.matchPeriodID || req.params.PeriodoID;
    const matchPeriodDescription = req.body.matchPeriodDescription.trim();

    if (matchPeriodDescription.length == 0) {
        // Campo "Descripción del Periodo de Partido" no válido
        req.flash('error', `Modificación FALLIDA. La "Descripción del Periodo de Partido" no puede estar vacía.`);
        // req.flash('matchPeriodDescription', matchPeriodDescription);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Periodos_conteo` WHERE Descripcion ='" + matchPeriodDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Periodo de Partido" existente
            req.flash('error', `Modificación FALLIDA. La descripción "${matchPeriodDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        }

        query = "UPDATE `Periodos_conteo` SET Descripcion ='" + matchPeriodDescription + "' WHERE PeriodoID=" + matchPeriodID;

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Periodo de partido modificado correctamente. Nueva descripción del periodo de partido: "${matchPeriodDescription}"`);
            // req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        });
    });

    console.log(`uri: `, uri);
    console.log(`matchPeriodID: `, matchPeriodID);
    console.log(`matchPeriodDescription: `, matchPeriodDescription);
    console.log(``);
});

/* Delete "MATCH PERIOD" - From "GET" Method Form */
router.get('/configuration/match_periods/delete', (req, res) => {
    const query = "SELECT * FROM `Periodos_conteo` ORDER BY Descripcion ASC"; // query database to get all the "Match Periods"

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/match_periods/match_periods_delete.ejs', {
            title: 'Delete Match Period',
            user: req.session.user,
            matchPeriods: result,
            appVersion: version
        });
    });
});

/* Delete "MATCH PERIOD" - From "POST" Method Form */
router.post('/configuration/match_periods/delete/', (req, res) => {
    const uri = '/configuration/match_periods/delete';
    const matchPeriodDescription = req.body.matchPeriodDescription;
    const query = 'DELETE FROM Periodos_conteo WHERE PeriodoID = ' + matchPeriodDescription;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "Borrar periodo de partido:", err.message);
            req.flash('error', 'Seleccione periodo de partido'); //req.flash('error', err.message);
            req.flash('matchPeriodDescription', matchPeriodDescription);
            return res.redirect(uri);
        }
        req.flash('success', `Periodo de partido borrado correctamente`);
        return res.redirect(uri);
    });
});



/* (clpp, 07/07/2022 - CONFIGURACIÓN: configuration/mixer_inputs/... (sidebar.ejs) */

/* Register "MIXER INPUT" - From "GET" Method Form */
router.get('/configuration/mixer_inputs/register', (req, res) => {
    res.render('configuration/mixer_inputs/mixer_inputs_register.ejs', {
        title: 'Register Mixer',
        user: req.session.user,
        appVersion: version,
    });
});

/* Register "MIXER INPUT" - From "POST" Method Form */
router.post('/configuration/mixer_inputs/register', (req, res) => {
    const uri = '/configuration/mixer_inputs/register/';
    const mixerInputDescription = req.body.mixerInputDescription.trim();
    const isEVS = req.body.isEVS;

    if (mixerInputDescription.length == 0) {
        // Campo "Descripción de la Entrada a Mezcladora" no válido
        req.flash('error', `Registro FALLIDO. La "Descripción de la Entrada a Mezcladora" no puede estar vacía.`);
        // req.flash('mixerInputDescription', mixerInputDescription);
        req.flash('isEVS', isEVS);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Entradas` WHERE Descripcion ='" + mixerInputDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('mixerInputDescription', mixerInputDescription);
            req.flash('isEVS', isEVS);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Descripción de Entrada a Mezcladora" existente
            req.flash('error', `Registro FALLIDO. La descripción "${mixerInputDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('mixerInputDescription', mixerInputDescription);
            req.flash('isEVS', isEVS);
            return res.redirect(uri);
        }

        query = "INSERT INTO `Entradas` (Descripcion, esEVS) VALUES ('" + mixerInputDescription + "','" + isEVS + "')";

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            if (isEVS == 0) {
                req.flash('success', `Entrada a mezcladora registrada correctamente. Descripción de la entrada a mezcladora: "${mixerInputDescription}", ¿Entrada de tipo EVS?: "NO"`);
            }
            if (isEVS == 1) {
                req.flash('success', `Entrada a mezcladora registrada correctamente. Descripción de la entrada a mezcladora: "${mixerInputDescription}", ¿Entrada de tipo EVS?: "SI"`);
            }
            // req.flash('mixerInputDescription', mixerInputDescription);
            // req.flash('isEVS', isEVS);
            return res.redirect(uri);
        });
    });
});

/* Update "MIXER INPUT" - From "GET" Method Form */
router.get('/configuration/mixer_inputs/update/:EntradaID?', (req, res) => {
    let query = "SELECT * FROM `Entradas` ORDER BY Descripcion ASC"; // query database
    if (undefined !== req.params.EntradaID) {
        // Editar perfil
        query = "SELECT * FROM `Entradas` WHERE EntradaID = " + req.params.EntradaID; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/mixer_inputs/mixer_inputs_update.ejs', {
            title: 'Update Mixer Input',
            user: req.session.user,
            mixerInputs: result,
            appVersion: version,
        });
    });
});

/* Update "MIXER INPUT" - From "POST" Method Form */
router.post('/configuration/mixer_inputs/update/:EntradaID?', (req, res) => {
    const uri = '/configuration/mixer_inputs/update';
    const mixerInputID = req.body.mixerInputID || req.params.EntradaID;
    const mixerInputDescription = req.body.mixerInputDescription.trim();
    const isEVS = req.body.isEVS;

    if (mixerInputDescription.length == 0) {
        // Campo "Descripción de la Entrada a Mezcladora" no válido
        req.flash('error', `Modificación FALLIDA. La "Descripción de la Entrada a Mezcladora" no puede estar vacía.`);
        // req.flash('mixerInputDescription', mixerInputDescription);
        req.flash('isEVS', isEVS);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Entradas` WHERE Descripcion='" + mixerInputDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('mixerInputDescription', mixerInputDescription);
            req.flash('isEVS', isEVS);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Descripción de Entrada a Mezcladora" existente
            req.flash('error', `Modificación FALLIDA. La descripción "${mixerInputDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('mixerInputDescription', mixerInputDescription);
            req.flash('isEVS', isEVS);
            return res.redirect(uri);
        }

        query = "UPDATE `Entradas` SET Descripcion ='" + mixerInputDescription + "', esEVS = '" + isEVS + "' WHERE EntradaID=" + mixerInputID;

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            if (isEVS == 0) {
                req.flash('success', `Entrada a mezcladora modificada correctamente. Nueva descripción de la entrada a mezcladora: "${mixerInputDescription}", ¿Entrada de tipo EVS?: "NO"`);
            }
            if (isEVS == 1) {
                req.flash('success', `Entrada a mezcladora modificada correctamente. Nueva descripción de la entrada a mezcladora: "${mixerInputDescription}", ¿Entrada de tipo EVS?: "SI"`);
            }
            // req.flash('mixerInputDescription', mixerInputDescription);
            // req.flash('isEVS', isEVS);
            return res.redirect(uri);
        });
    });

    console.log(`uri: `, uri);
    console.log(`mixerInputID: `, mixerInputID);
    console.log(`mixerInputDescription: `, mixerInputDescription);
    console.log(`isEVS: `, isEVS);
    console.log(``);
});

/* Delete "MIXER INPUT" - From "GET" Method Form */
router.get('/configuration/mixer_inputs/delete', (req, res) => {
    const query = "SELECT * FROM `Entradas` ORDER BY Descripcion ASC"; // query database to get all the "Mobile Units"

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/mixer_inputs/mixer_inputs_delete.ejs', {
            title: 'Delete Mixer Input',
            user: req.session.user,
            mixerInputs: result,
            appVersion: version
        });
    });
});

/* Delete "MIXER INPUT" - From "POST" Method Form */
router.post('/configuration/mixer_inputs/delete/', (req, res) => {
    const uri = '/configuration/mixer_inputs/delete';
    const mixerInputDescription = req.body.mixerInputDescription;
    const query = 'DELETE FROM Entradas WHERE EntradaID = ' + mixerInputDescription;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "Borrar entrada a mezcladora:", err.message);
            req.flash('error', 'Seleccione entrada a mezcladora'); //req.flash('error', err.message);
            req.flash('mixerInputDescription', mixerInputDescription);
            return res.redirect(uri);
        }
        req.flash('success', `Entrada a mezcladora borrada correctamente`);
        return res.redirect(uri);
    });
});



/* (clpp, 07/07/2022 - CONFIGURACIÓN: configuration/mixers/... (sidebar.ejs) */

/* Register "MIXER" - From "GET" Method Form */
router.get('/configuration/mixers/register', (req, res) => {
    res.render('configuration/mixers/mixers_register.ejs', {
        title: 'Register Mixer',
        user: req.session.user,
        appVersion: version,
    });
});

/* Register "MIXER" - From "POST" Method Form */
router.post('/configuration/mixers/register', (req, res) => {
    const uri = '/configuration/mixers/register/';
    const mixerName = req.body.mixerName.trim();
    const mixerBrand = req.body.mixerBrand.trim();
    const mixerModel = req.body.mixerModel.trim();

    if (mixerName.length == 0) {
        // Campo "Nombre" no válido
        req.flash('error', `Registro FALLIDO. El "Nombre" no puede estar vacío.`);
        // req.flash('mixerName', mixerName);
        req.flash('mixerBrand', mixerBrand);
        req.flash('mixerModel', mixerModel);
        return res.redirect(uri);
    }

    let query = "SELECT Nombre FROM `Mezcladoras` WHERE Nombre='" + mixerName + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('mixerName', mixerName);
            req.flash('mixerBrand', mixerBrand);
            req.flash('mixerModel', mixerModel);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Nombre de Mezcladora" existente
            req.flash('error', `Registro FALLIDO. El nombre "${mixerName}" ya está registrado. Introduzca uno nuevo.`);
            // req.flash('mixerName', mixerName);
            req.flash('mixerBrand', mixerBrand);
            req.flash('mixerModel', mixerModel);
            return res.redirect(uri);
        }

        query = "INSERT INTO `Mezcladoras` (Nombre, Marca, Modelo) VALUES ('" + mixerName + "','" + mixerBrand + "','" + mixerModel + "')";

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Mezcladora registrada correctamente. Nombre: "${mixerName}", Marca: "${mixerBrand}", Modelo: "${mixerModel}"`);
            // req.flash('mixerName', mixerName);
            // req.flash('mixerBrand', mixerBrand);
            // req.flash('mixerModel', mixerModel);
            return res.redirect(uri);
        });
    });
});

/* Update "MIXER" - From "GET" Method Form */
router.get('/configuration/mixers/update/:MezcladoraID?', (req, res) => {
    let query = "SELECT * FROM `Mezcladoras` ORDER BY Nombre ASC"; // query database
    if (undefined !== req.params.MezcladoraID) {
        // Editar perfil
        query = "SELECT * FROM `Mezcladoras` WHERE MezcladoraID = " + req.params.MezcladoraID; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/mixers/mixers_update.ejs', {
            title: 'Update Mixer',
            user: req.session.user,
            mixerUnits: result,
            appVersion: version,
        });
    });
});

/* Update "MIXER" - From "POST" Method Form */
router.post('/configuration/mixers/update/:MezcladoraID?', (req, res) => {
    const uri = '/configuration/mixers/update';
    const mixerID = req.body.mixerID || req.params.MezcladoraID;
    const mixerName = req.body.mixerName.trim();
    const mixerBrand = req.body.mixerBrand.trim();
    const mixerModel = req.body.mixerModel.trim();

    if (mixerName.length == 0) {
        // Campo "Nombre" no válido
        req.flash('error', `Modificación FALLIDA. El "Nombre" no puede estar vacío.`);
        // req.flash('mixerName', mixerName);
        req.flash('mixerBrand', mixerBrand);
        req.flash('mixerModel', mixerModel);
        return res.redirect(uri);
    }

    let query = "SELECT Nombre FROM `Mezcladoras` WHERE Nombre='" + mixerName + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('mixerName', mixerName);
            req.flash('mixerBrand', mixerBrand);
            req.flash('mixerModel', mixerModel);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Unidad Móvil" existente
            req.flash('error', `Modificación FALLIDA. El nombre "${mixerName}" ya está registrado. Introduzca uno nuevo.`);
            // req.flash('mixerName', mixerName);
            req.flash('mixerBrand', mixerBrand);
            req.flash('mixerModel', mixerModel);
            return res.redirect(uri);
        }

        query = "UPDATE `Mezcladoras` SET Nombre ='" + mixerName + "', Modelo = '" + mixerModel + "', Marca ='" + mixerBrand + "' WHERE MezcladoraID=" + mixerID;

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Mezcladora modificada correctamente. Nuevo Nombre: "${mixerName}", Marca: "${mixerBrand}", Modelo: "${mixerModel}"`);
            // req.flash('mixerName', mixerName);
            // req.flash('mixerBrand', mixerBrand);
            // req.flash('mixerModel', mixerModel);
            return res.redirect(uri);
        });
    });

    console.log(`uri: `, uri);
    console.log(`mixerID: `, mixerID);
    console.log(`mixerName: `, mixerName);
    console.log(`mixerBrand: `, mixerBrand);
    console.log(`mixerModel: `, mixerModel);
    console.log(``);
});

/* Delete "MIXER" - From "GET" Method Form */
router.get('/configuration/mixers/delete', (req, res) => {
    const query = "SELECT * FROM `Mezcladoras` ORDER BY Nombre ASC"; // query database to get all the "Mobile Units"

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/mixers/mixers_delete.ejs', {
            title: 'Delete Mixer',
            user: req.session.user,
            mixerUnits: result,
            appVersion: version
        });
    });
});

/* Delete "MIXER" - From "POST" Method Form */
router.post('/configuration/mixers/delete/', (req, res) => {
    const uri = '/configuration/mixers/delete';
    const mixerName = req.body.mixerName;
    const query = 'DELETE FROM Mezcladoras WHERE MezcladoraID = ' + mixerName;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "Borrar Mezcladora:", err.message);
            req.flash('error', 'Seleccione Mezcladora'); //req.flash('error', err.message);
            req.flash('mixerName', mixerName);
            return res.redirect(uri);
        }
        req.flash('success', `Mezcladora borrada correctamente`);
        return res.redirect(uri);
    });
});



/* (clpp, 06/07/2022 - CONFIGURACIÓN: configuration/mobile_units/... (sidebar.ejs) */

/* Register "MOBILE UNIT" - From "GET" Method Form */
router.get('/configuration/mobile_units/register', (req, res) => {
    res.render('configuration/mobile_units/mobile_units_register.ejs', {
        title: 'Register Mobile Unit',
        user: req.session.user,
        appVersion: version,
    });
});

/* Register "MOBILE UNIT" - From "POST" Method Form */
router.post('/configuration/mobile_units/register', (req, res) => {
    const uri = '/configuration/mobile_units/register/';
    const mobUnitName = req.body.mobUnitName.trim();
    const mobUnitNumberPlate = req.body.mobUnitNumberPlate.trim().toUpperCase();
    const mobUnitVehicle = req.body.mobUnitVehicle.trim();

    if (mobUnitName.length == 0) {
        // Campo "Nombre de la Unidad" no válido
        req.flash('error', `Registro FALLIDO. El "Nombre de la Unidad" no puede estar vacío.`);
        // req.flash('mobUnitName', mobUnitName);
        req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
        req.flash('mobUnitVehicle', mobUnitVehicle);
        return res.redirect(uri);
    }

    let query = "SELECT Nombre FROM `Unidades_Moviles` WHERE Nombre='" + mobUnitName + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('mobUnitName', mobUnitName);
            req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
            req.flash('mobUnitVehicle', mobUnitVehicle);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Nombre de Unidad Móvil" existente
            req.flash('error', `Registro FALLIDO. El nombre "${mobUnitName}" ya está registrado. Introduzca uno nuevo.`);
            // req.flash('mobUnitName', mobUnitName);
            req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
            req.flash('mobUnitVehicle', mobUnitVehicle);
            return res.redirect(uri);
        }

        query = "INSERT INTO `Unidades_Moviles` (Nombre, Matricula, Tipo_vehiculo) VALUES ('" + mobUnitName + "','" + mobUnitNumberPlate + "','" + mobUnitVehicle + "')";

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Unidad móvil registrada correctamente. Nombre: "${mobUnitName}", Matricula: "${mobUnitNumberPlate}", Tipo de Vehículo: "${mobUnitVehicle}"`);
            // req.flash('mobUnitName', mobUnitName);
            // req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
            // req.flash('mobUnitVehicle', mobUnitVehicle);
            return res.redirect(uri);
        });
    });
});

/* Update "MOBILE UNIT" - From "GET" Method Form */
router.get('/configuration/mobile_units/update/:UMID?', (req, res) => {
    let query = "SELECT * FROM `Unidades_Moviles` ORDER BY Nombre ASC"; // query database
    if (undefined !== req.params.UMID) {
        // Editar perfil
        query = "SELECT * FROM `Unidades_Moviles` WHERE UMID = " + req.params.UMID; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/mobile_units/mobile_units_update.ejs', {
            title: 'Update Mobile Unit',
            user: req.session.user,
            mUnits: result,
            appVersion: version,
        });
    });
});

/* Update "MOBILE UNIT" - From "POST" Method Form */
router.post('/configuration/mobile_units/update/:UMID?', (req, res) => {
    const uri = '/configuration/mobile_units/update';
    const mobUnitID = req.body.mobUnitID || req.params.UMID;
    const mobUnitName = req.body.mobUnitName.trim();
    const mobUnitNumberPlate = req.body.mobUnitNumberPlate.trim().toUpperCase();
    const mobUnitVehicle = req.body.mobUnitVehicle.trim();

    if (mobUnitName.length == 0) {
        // Campo "Nombre de la Unidad" no válido
        req.flash('error', `Modificación FALLIDA. El "Nombre de la Unidad" no puede estar vacío.`);
        // req.flash('mobUnitName', mobUnitName);
        req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
        req.flash('mobUnitVehicle', mobUnitVehicle);
        return res.redirect(uri);
    }

    let query = "SELECT Nombre FROM `Unidades_Moviles` WHERE Nombre='" + mobUnitName + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('mobUnitName', mobUnitName);
            req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
            req.flash('mobUnitVehicle', mobUnitVehicle);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Unidad Móvil" existente
            req.flash('error', `Modificación FALLIDA. El nombre "${mobUnitName}" ya está registrado. Introduzca uno nuevo.`);
            // req.flash('mobUnitName', mobUnitName);
            req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
            req.flash('mobUnitVehicle', mobUnitVehicle);
            return res.redirect(uri);
        }

        query = "UPDATE `Unidades_Moviles` SET Nombre ='" + mobUnitName + "', Tipo_vehiculo = '" + mobUnitVehicle + "', Matricula ='" + mobUnitNumberPlate + "' WHERE UMID=" + mobUnitID;

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Unidad móvil modificada correctamente. Nuevo Nombre: "${mobUnitName}", Matricula: "${mobUnitNumberPlate}", Tipo de Vehículo: "${mobUnitVehicle}"`);
            // req.flash('mobUnitName', mobUnitName);
            // req.flash('mobUnitNumberPlate', mobUnitNumberPlate);
            // req.flash('mobUnitVehicle', mobUnitVehicle);
            return res.redirect(uri);
        });
    });

    console.log(`uri: `, uri);
    console.log(`mobUnitID: `, mobUnitID);
    console.log(`mobUnitName: `, mobUnitName);
    console.log(`mobUnitNumberPlate: `, mobUnitNumberPlate);
    console.log(`mobUnitVehicle: `, mobUnitVehicle);
    console.log(``);
});

/* Delete "MOBILE UNIT" - From "GET" Method Form  */
router.get('/configuration/mobile_units/delete', (req, res) => {
    const query = "SELECT * FROM `Unidades_Moviles` ORDER BY Nombre ASC"; // query database to get all the "Mobile Units"

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/mobile_units/mobile_units_delete.ejs', {
            title: 'Delete Mobile Unit',
            user: req.session.user,
            mUnits: result,
            appVersion: version
        });
    });
});

/* Delete "MOBILE UNIT" - From "POST" Method Form  */
router.post('/configuration/mobile_units/delete/', (req, res) => {
    const uri = '/configuration/mobile_units/delete';
    const mobUnitName = req.body.mobUnitName;
    const query = 'DELETE FROM Unidades_Moviles WHERE UMID = ' + mobUnitName;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "Borrar unidad móvil:", err.message);
            req.flash('error', 'Seleccione unidad móvil'); //req.flash('error', err.message);
            req.flash('mobUnitName', mobUnitName);
            return res.redirect(uri);
        }
        req.flash('success', `Unidad móvil borrada correctamente`);
        return res.redirect(uri);
    });
});



/* (clpp, 06/07/2022 - CONFIGURACIÓN: configuration/sports_days/... (sidebar.ejs) */

/* Register "SPORTS DAY" - From "GET" Method Form */
router.get('/configuration/sports_days/register', (req, res) => {
    res.render('configuration/sports_days/sports_days_register.ejs', {
        title: 'Register Sports Day',
        user: req.session.user,
        appVersion: version,
    });
});

/* Register "SPORTS DAY" - From "POST" Method Form */
router.post('/configuration/sports_days/register', (req, res) => {
    const uri = '/configuration/sports_days/register/';
    const sportsDaysDescription = req.body.sportsDaysDescription.trim();
    const dateStartingTime = req.body.dateStartingTime;
    const dateFinishingTime = req.body.dateFinishingTime;

    if (sportsDaysDescription.length == 0) {
        // Campo "Descripción de la Jornada" no válido
        req.flash('error', `Registro FALLIDO. La "Descripción de la Jornada" no puede estar vacía.`);
        // req.flash('sportsDaysDescription', sportsDaysDescription);
        req.flash('dateStartingTime', dateStartingTime);
        req.flash('dateFinishingTime', dateFinishingTime);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Jornadas` WHERE Descripcion='" + sportsDaysDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('sportsDaysDescription', sportsDaysDescription);
            req.flash('dateStartingTime', dateStartingTime);
            req.flash('dateFinishingTime', dateFinishingTime);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Descripción de la Jornada" existente
            req.flash('error', `Registro FALLIDO. La descripción "${sportsDaysDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('sportsDaysDescription', sportsDaysDescription);
            req.flash('dateStartingTime', dateStartingTime);
            req.flash('dateFinishingTime', dateFinishingTime);
            return res.redirect(uri);
        }

        query = "INSERT INTO `Jornadas` (Descripcion, Fecha_inicio, Fecha_fin) VALUES ('" + sportsDaysDescription + "','" + dateStartingTime + "','" + dateFinishingTime + "')";

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Jornada registrada correctamente. Descripción de la jornada: "${sportsDaysDescription}", Fecha (Inicio de Jornada): "${dateStartingTime}", Fecha (Fin de Jornada): "${dateFinishingTime}"`);
            // req.flash('sportsDaysDescription', sportsDaysDescription);
            // req.flash('dateStartingTime', dateStartingTime);
            // req.flash('dateFinishingTime', dateFinishingTime);
            return res.redirect(uri);
        });
    });
});

/* Update "SPORTS DAY" - From "GET" Method Form */
router.get('/configuration/sports_days/update/:JornadaID?', (req, res) => {
    let query = "SELECT * FROM `Jornadas` ORDER BY Descripcion ASC"; // query database
    if (undefined !== req.params.UMID) {
        // Editar perfil
        query = "SELECT * FROM `Jornadas` WHERE JornadaID = " + req.params.JornadaID; // query database
    }

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/sports_days/sports_days_update.ejs', {
            title: 'Update Sports Day',
            user: req.session.user,
            sDays: result,
            appVersion: version,
        });
    });
});

/* Update "SPORTS DAY" - From "POST" Method Form */
router.post('/configuration/sports_days/update/:JornadaID?', (req, res) => {
    const uri = '/configuration/sports_days/update';
    const sportsDayID = req.body.sportsDayID || req.params.JornadaID;
    const sportsDaysDescription = req.body.sportsDaysDescription.trim();
    const dateStartingTime = req.body.dateStartingTime;
    const dateFinishingTime = req.body.dateFinishingTime;

    if (sportsDaysDescription.length == 0) {
        // Campo "Descripción de la Jornada" no válido
        req.flash('error', `Registro FALLIDO. La "Descripción de la jornada" no puede estar vacía.`);
        // req.flash('sportsDaysDescription', sportsDaysDescription);
        req.flash('dateStartingTime', dateStartingTime);
        req.flash('dateFinishingTime', dateFinishingTime);
        return res.redirect(uri);
    }

    let query = "SELECT Descripcion FROM `Jornadas` WHERE Descripcion='" + sportsDaysDescription + "'";
    const db = Db.instance;

    db.connection.query(query, (err, result) => {
        if (err) {
            req.flash('error', err.message);
            req.flash('sportsDaysDescription', sportsDaysDescription);
            req.flash('dateStartingTime', dateStartingTime);
            req.flash('dateFinishingTime', dateFinishingTime);
            return res.redirect(uri);
        }

        if (result.length > 0) {
            // "Descripción de la jornada" existente
            req.flash('error', `Registro FALLIDO. La descripción "${sportsDaysDescription}" ya está registrada. Introduzca una nueva.`);
            // req.flash('sportsDaysDescription', sportsDaysDescription);
            req.flash('dateStartingTime', dateStartingTime);
            req.flash('dateFinishingTime', dateFinishingTime);
            return res.redirect(uri);
        }

        query = "UPDATE `Jornadas` SET Descripcion ='" + sportsDaysDescription + "', Fecha_inicio = '" + dateStartingTime + "', Fecha_fin ='" + dateFinishingTime + "' WHERE JornadaID=" + sportsDayID;

        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success', `Jornada modificada correctamente. Nueva descripción: "${sportsDaysDescription}", Fecha (Inicio de Jornada): "${dateStartingTime}", Fecha (Fin de Jornada): "${dateFinishingTime}"`);
            // req.flash('sportsDaysDescription', sportsDaysDescription);
            // req.flash('dateStartingTime', dateStartingTime);
            // req.flash('dateFinishingTime', dateFinishingTime);
            return res.redirect(uri);
        });
    });
});

/* Delete "SPORTS DAY" - From "GET" Method Form  */
router.get('/configuration/sports_days/delete', (req, res) => {
    const query = "SELECT * FROM `Jornadas` ORDER BY Descripcion ASC"; // query database to get all the "Mobile Units"

    // execute query
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            return res.redirect('/admin');
        }
        res.render('configuration/sports_days/sports_days_delete.ejs', {
            title: 'Delete Sports Day',
            user: req.session.user,
            sDays: result,
            appVersion: version
        });
    });
});

/* Delete "SPORTS DAY" - From "POST" Method Form */
router.post('/configuration/sports_days/delete/', (req, res) => {
    const uri = '/configuration/sports_days/delete';
    const sportsDaysDescription = req.body.sportsDaysDescription;
    const query = 'DELETE FROM Jornadas WHERE JornadaID = ' + sportsDaysDescription;
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        if (err) {
            console.log(Tools.now(), "Borrar jornada:", err.message);
            req.flash('error', 'Seleccione jornada'); //req.flash('error', err.message);
            req.flash('sportsDaysDescription', sportsDaysDescription);
            return res.redirect(uri);
        }
        req.flash('success', `Jornada borrada correctamente`);
        return res.redirect(uri);
    });
});



router.get('/*', (req, res) => {
    return res.redirect("/admin");
});

module.exports = router;