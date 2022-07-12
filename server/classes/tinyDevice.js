"use strict";

const axios = require('axios');
const Tools = require("./tools");
const WebSocket = require('ws');

class TinyPlayer {
    constructor(ip) {
        this.ip =ip;
        this.debug = false;
    }

    reboot() {
        //REST API reiniciar DS Tiny
        if (this.ip){
            let self = this;
            let urlApi = `http://${this.ip}/api/reboot`
            console.log(Tools.now(),"DS Tiny: send: "+ urlApi);
            axios.get(urlApi)
            .then(function (response) {
                // handle success
                //console.log(response);
                if (response.data.result == "OK") console.log (Tools.now(),`DS Tiny: ${self.ip} Rebotting ...`)
            })
            .catch(function (error) {
                // handle error
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    if (debug) {
                        console.log(Tools.now(),`DS Tiny: ${self.ip} error data:`,error.response.data);
                        console.log(Tools.now(),`DS Tiny: ${self.ip} error status:`,error.response.status);
                        console.log(Tools.now(),`DS Tiny: ${self.ip} error headers:`,error.response.headers);
                    } else console.log(Tools.now(),`DS Tiny: ${self.ip} Error response`, error.message);
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    //console.log(Tools.now(),"error.request:",error.request);
                    console.log(Tools.now(),`DS Tiny: ${self.ip} Error HTTP Get`, error.message);
                } 
                
            });
            
            /*.finally(function () {
                // always executed
                console.log("Axios finished:","https://192.168.0.192/api/reboot");
            
            });
            */
        }
    }

    playAviso(){
        if (this.ip){
            let self = this;
            let urlApi = `ws://${this.ip}:8889`
            const ws = new WebSocket(urlApi);
            
            ws.on('error', function open() {
                console.log(Tools.now(),`DS Tiny: ${self.ip} Error ws: PlayAviso`);
            });

            ws.on('open', function open() {
                console.log(Tools.now(),`DS Tiny: ${self.ip} Ready ws: PlayAviso`);
                ws.send('{"action": "play"}');
            });
        }
    }
        
}
module.exports = TinyPlayer;
