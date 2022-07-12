"use strict";

const express = require("express");
const crypto = require('crypto');

const Server = require("../classes/server");
const path = require('path');
const Db = require("../classes/db");
const Tools = require("../classes/tools");
const environment = require("../global/environment");

const { version } = require('../package.json');

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
    //console.log("router.all:POST> db.connection.query");
    db.connection.query(query, (err, result) => {
        //console.log("router.all:POST> response query");
        if (result && result.length) {
            req.session.userId = result[0].id;
            req.session.user = result[0];
            //console.log("router.all:POST> render admin",req.session.userId,req.session.user);
            return res.redirect('/admin');
        } else {
            //console.log("router.all:POST> render login",req.session.userId,req.session.user);
            return res.render('login.ejs', {
                title: 'Login',
                message: 'Nombre de usuario o contraseña erronea.',
                appVersion: version
            });
        }
    });
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
    var user =  req.session.user;
    const db = Db.instance;
    const settings = db.settings;
    settings.then((s) => {
        res.render('admin/index.ejs', {
            title: 'Dashboard',
            user: req.session.user,
            t1: s.t1,
            transports: s.transports.sort(Tools.compareName),
            transports_by_slug: s.transports_by_slug,
            now: new Date(),
            appVersion: version
        });
    }).catch(err => {
        console.warn("ERROR", err);
    });
});


  
// Sirve el dashboard
router.get('/admin', (req, res) => {
    var user =  req.session.user;
    const db = Db.instance;
    const settings = db.settings;
    settings.then((s) => {
        res.render('admin/index.ejs', {
            title: 'Dashboard',
            user: req.session.user,
            t1: s.t1,
            transports: s.transports.sort(Tools.compareName),
            transports_by_slug: s.transports_by_slug,
            now: new Date(),
            appVersion: version
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
            users: result.filter( user => user.username != 'admin' ),
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
            users: (undefined !== req.params.id) ? result : result.filter( user => user.username != 'admin' ),
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
            console.log(Tools.now(),"delete user:",err.message);
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



/* FOOTBALL MATCH (clpp, 15/06/2022) */
router.get('/football_match/register', (req, res) => {
    res.render('football_match/match_register.ejs', {
        title: 'Register match',
        user: req.session.user,
        appVersion: version,
    });
});



/* CONFIGURATION (clpp, 17/06/2022) */ 
router.get('/configuration/cameras', (req, res) => {
    res.render('configuration/cameras.ejs', {
        title: 'Cameras Dashboard',
        user: req.session.user,
        appVersion: version,
    });
});

router.get('/configuration/sports_days', (req, res) => {
    res.render('configuration/sports_days.ejs', {
        title: 'Sports Days Dashboard',
        user: req.session.user,
        appVersion: version,
    });
});

router.post('/configuration/sports_days/create', (req, res) => {
    let uri = '/configuration/sports_days/';
    
    /*
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
    */
    const inputSportsDaysDescription = req.body.inputSportsDaysDescription;
    const inputDateStartingTime = req.body.inputDateStartingTime;
    const inputDateFinishingTime = req.body.inputDateFinishingTime;
    console.log(`Fecha recibida inicio: ${inputDateStartingTime}`);
    console.log(`Fecha recibida fin: ${inputDateFinishingTime}`);
    console.log(`Jornada recibida: ${inputSportsDaysDescription}`);
    if (inputDateStartingTime > inputDateFinishingTime) {
        req.flash('error', 'Las fechas están mal!');
        req.flash('inputSportsDaysDescription', inputSportsDaysDescription);
        req.flash('inputDateStartingTime', inputDateStartingTime);
        req.flash('inputDateFinishingTime', inputDateFinishingTime);
        return res.redirect(uri);
    }
    let query;
    query= "select Descripcion from `Jornadas` where Descripcion='"+inputSportsDaysDescription+"'";
    const db = Db.instance;
    db.connection.query(query, (err, result) => {
        console.log(`Query de Jornadas: ${JSON.stringify(result)}`);
        console.log(`Contenido de err: ${JSON.stringify(err)}`);
        var que_pasa='';
        que_pasa = (err) ? 'Hay error de BD' : 'NO HAY error de BD';
        console.log(que_pasa);
        if (err) {
            req.flash('error', err.message);
            req.flash('inputSportsDaysDescription', inputSportsDaysDescription);
            req.flash('inputDateStartingTime', inputDateStartingTime);
            req.flash('inputDateFinishingTime', inputDateFinishingTime);
            return res.redirect(uri);
        }
        if (result.length > 0) {
            // Jornada sí existe
            console.log(`Estoy en result>0`);
            req.flash('error', 'Jornada existente por favor elige otra descripción');
            req.flash('inputSportsDaysDescription', inputSportsDaysDescription);
            req.flash('inputDateStartingTime', inputDateStartingTime);
            req.flash('inputDateFinishingTime', inputDateFinishingTime);
            return res.redirect(uri);
        }
        query="INSERT INTO `Jornadas` (Descripcion, Fecha_inicio, Fecha_fin) VALUES ('"+inputSportsDaysDescription+"','"+inputDateStartingTime+"','"+inputDateFinishingTime+"')";
        db.connection.query(query, (err, result) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect(uri);
            }
            req.flash('success',  'Jornada creada correctamente');
            req.flash('inputSportsDaysDescription', inputSportsDaysDescription);
            req.flash('inputDateStartingTime', inputDateStartingTime);
            req.flash('inputDateFinishingTime', inputDateFinishingTime);
                return res.redirect(uri);
        });
    });
});

router.get('/*', (req, res) => {
    return res.redirect("/admin");
});
module.exports = router;
