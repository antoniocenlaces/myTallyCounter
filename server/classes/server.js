"use strict";

const express = require("express");
const environment = require("../global/environment");
const socket_io = require("socket.io");
const http = require("http");
const socket = require("../sockets/socket");
const TinyPlayer = require('./tinyDevice');
const Tools = require("./tools");

class Server {
    constructor() {
        this.app = express();
        this.port = environment.SERVER_PORT;
        this.httpServer = new http.Server(this.app);
        this.io = socket_io(this.httpServer);
        this.escucharSockets();
        this.clientsStatus = [];
    }

    static get instance() {
        return this._intance || (this._intance = new this());
    }

    escucharSockets() {
        console.log(Tools.now(),'Escuchando conexiones - sockets');
        this.io.on('connection', cliente => {
            // Conectar cliente
            socket.conectar(cliente, this.io,this.clientsStatus);
            
            // Lista de transporte
            socket.lista(cliente, this.io);

            // Settings
            socket.settings(cliente, this.io);

            // Añadir a Lista de transporte
            socket.addtolista(cliente, this.io,this.clientsStatus);
            
            // Añadir a partido a lista visualización
            socket.addtopartido(cliente, this.io);

            // generador del primer tallys
            // socket.generaPrimerTally(cliente, this.io);
            
            // generador aleatorio de tallies
            socket.generaTallyAleatorio(cliente,this.io);

            // gestión de periodos
            socket.gestionPeriodos(cliente, this.io);

            // Eliminar de Lista de transporte
            socket.removefromlista(cliente, this.io);

            // Desconectar
            socket.desconectar(cliente, this.io,this.clientsStatus);
        });
    }
    
    start(callback) {
        this.httpServer.listen(this.port, callback);
        
        // REBOOT TINY PLAYERS TO SYNC
        //console.log("Player to reboot:",environment.PLAYERS_IP_REBOOT);
        /*let player = environment.PLAYERS_IP_REBOOT.split(",");
        player.forEach(element => {
            let ip = element.trim();
            if (ip) {
                var Player1 = new TinyPlayer(ip);
                Player1.reboot();
            }
        });
        */

    }
}
module.exports = Server;
