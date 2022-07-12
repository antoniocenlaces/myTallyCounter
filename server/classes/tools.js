"use strict";

class Tools {

  static slug(str) {
      if (!str) {
          return '';
      }
      str = str.replace(/^\s+|\s+$/g, ''); // trim
      str = str.toLowerCase();
  
      // remove accents, swap ñ for n, etc
      var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
      var to   = "aaaaeeeeiiiioooouuuunc------";
      for (var i=0, l=from.length ; i<l ; i++) {
          str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
      }

      str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
          .replace(/\s+/g, '-') // collapse whitespace and replace by -
          .replace(/-+/g, '-'); // collapse dashes

      return str;
  }

  static getIP (ip){
    if (ip.substr(0, 7) == "::ffff:") { //ipv6 to ipv4
        ip = ip.substr(7);
    }
    return ip

  }
  static now (){
    let d = new Date();
    d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  static compareName(a, b) {
    // Use toUpperCase() to ignore character casing
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
  
    let comparison = 0;
    if (nameA > nameB) {
      comparison = 1;
    } else if (nameA < nameB) {
      comparison = -1;
    }
    return comparison;
  }

  static getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
  
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
          return alias.address;
      }
    }
  
    return '0.0.0.0';
  }

}

module.exports = Tools;
