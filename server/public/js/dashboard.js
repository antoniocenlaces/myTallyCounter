const setSessionUser = () => {
  const divUserId =document.querySelector("#userId");
  const divUserName=document.querySelector("#userName");
  // const localUserId=localStorage.getItem('userId');
  // const localUserName=localStorage.getItem('userName');
  const userId =  Number(divUserId.textContent);
  const userName =  divUserName.textContent;
  // if (!localUserId) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', userName);
  // }
  const userLocal = {
    'userid': userId,
    'userName': userName
  };
  return userLocal;
};
const getSessionUser = () => {
  const localUserId=localStorage.getItem('userId');
  const localUserName=localStorage.getItem('userName');
  const userLocal = {
    'userId': Number(localUserId,0),
    'userName': localUserName
  };
  return userLocal;
}

let userLocal ={};
window.onload=function() {
  userLocal=setSessionUser();
  console.log(`la página se ha cargado y las variables escritas en sesión: ${JSON.stringify(userLocal)}`);
  // userLocal=getSessionUser();
  // console.log(`la página se ha cargado y las variables leidas en sesión: ${JSON.stringify(userLocal)}`);
}

function Truck(data, s) {
  var self = this;
  self.matricula = data.matricula;
  self.transporte = data.transporte;
  self.transport_full = data.transport_full;
  self.dock = data.dock;
  self.id = data.id;
  self.created = moment(data.created);
  self.deleted = moment(data.created)+s.t3*60*1000; //moment(data.deleted); // no usado
  self.blinked = ko.observable(false);
  self.removeBlink = ko.observable(false);
  var now = moment().valueOf();

  //Blink cuando es creado
  if (self.created.valueOf() + s.t1*1000 > now) {
    self.blinked(true);
    setTimeout(function() {
      self.blinked(false);
    }, self.created.valueOf() + s.t1*1000 - now);
  }
  //Blink cuando se va ha quitar
  let removeBlinkTime = ((((s.t3 *60)-s.t4)*1000)-(now - self.created.valueOf()));
  //console.log("timeout:",removeBlinkTime);
  setTimeout(function() {
    self.removeBlink(true);
  }, Math.max(removeBlinkTime, 0));
}
const inicioPrimera= new Date(2022,05,20,20,17,24,910);
const finPrimera= new Date(2022,05,20,20,48,02,370);
const inicioSegunda= new Date(2022,05,20,21,03,02,370);
const finSegunda= new Date(2022,05,20,21,51,54,370);

const data = {
    partidoId: 1,
    descripcion:'MMM-PPP',
    jornada: 'J1',
    unidadMovil: 'Unidad 1', 
    ip: '209.162.43.21',
    registrando: true,
    conectado:true,
    err: {source:'readFootballMatch',value:'No existe asociación de cámaras para este partido',active:true},
    periodos: [
      {nombre:'Primera Parte',contador:2785, horaInicio: inicioPrimera, horaFin: finPrimera},
      {nombre:'Segunda Parte',contador:674, horaInicio: inicioSegunda, horaFin: finSegunda}
    ],
    camaras: [
      {descripcion: 'ANG INV ALTO',contador:23, on:false, entradaId: 1, esEVS: false, EVSs: []},
      {descripcion: 'PORTERIA IZQ',contador:15, on:false, entradaId: 2, esEVS: false, EVSs: []},
      {descripcion: 'STEADY',contador:18, on:false, entradaId: 3, esEVS: false, EVSs: []},
      {descripcion: 'PESETA IZQ',contador:6, on:false, entradaId: 4, esEVS: false, EVSs: []},
      {descripcion: 'CORTOS',contador:23, on:false, entradaId: 5, esEVS: false, EVSs: []},
      {descripcion: 'MASTER',contador:357, on:true, entradaId: 6, esEVS: false, EVSs: []},
      {descripcion: 'CORTOS 02',contador:12, on:false, entradaId: 7, esEVS: false, EVSs: []},
      {descripcion: 'FONDO ALTO 01',contador:31, on:false, entradaId: 8, esEVS: false, EVSs: []},
      {descripcion: 'EVS1',contador:5, on:false, entradaId: 38, esEVS: true, EVSs: [{evsid: 3, descripcion: 'PESETA IZQ'}, {evsid: 1, descripcion: 'FUERA JUEGO IZQ'}, {evsid: 2, descripcion: 'FUERA JUEGO DER'}]},
      {descripcion: 'EVS2',contador:18, on:false, entradaId: 39, esEVS: true, EVSs: [{evsid: 7, descripcion: 'ANG INV ALTO'}, {evsid: 4, descripcion: 'FONFO ALTO 01'}, {evsid: 5, descripcion: 'FONFO ALTO 02'}, {evsid: 8, descripcion: 'MINI TUNEL'}]},
      {descripcion: 'EVS3',contador:41, on:false, entradaId: 40, esEVS: true, EVSs: [{evsid: 9, descripcion: 'PORTERIA IZQ'}, {evsid: 12, descripcion: 'CORTOS 02'}, {evsid: 10, descripcion: 'PORTERIA DER'}]},
    ]
};

function now (){
  let d = new Date();
  d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
// al leer de Db los datos de Hora_inicio y Hora_fin de cada periodo son convertidos a objeto Date de javascript
function Periodo(data) {
  let self =this;
    const date= moment(new Date());
     console.log(`Los dates recibidos de DB hora inicio: ${data.horaInicio}`);
     console.log(`Los dates recibidos de DB hora fin: ${data.horaFin}`);
    if (data.horaInicio === null || data.horaInicio === undefined) { // si el partido no tiene hora de inicio definida en DB asumo que es un nuevo partido e inicio en '00:00:00'
      data.horaInicio=data.horaFin=-3600000;
    }
    const horaInicio= moment(new Date(data.horaInicio));
    const horaFin= moment(new Date(data.horaFin));
    console.log(`Y el new horaInicio definido: ${horaInicio}`);
    console.log(`Y el new horaInicio como moment: ${horaInicio.format('HH:mm:ss.SSS')}`);
    self.PPID=data.PPID || 0; // para buscar en tabla Periodos_partido
    self.nombre=data.nombre || '';
    self.contador=ko.observable(data.contador || '00:00:00');
    self.horaInicio=ko.observable(horaInicio.format('HH:mm:ss.SSS') || date.format('HH:mm:ss.SSS'));
    self.horaFin=ko.observable(horaFin.format('HH:mm:ss.SSS') || 'sin definir');
    self.active=ko.observable(data.active || false);
    self.unixTimer=data.unixTimer || -3600000;
    self.timer=data.timer || 0; // control del setTimeout para contador del periodo
    self.err=data.err || {'active':false, 'source':'', 'value':''}; // para poder mostrar mensajes de error
    self.partidoId=data.partidoId || 0;
    self.periodoId=data.periodoId || 0;
    self.orden=data.orden || 0;
    console.log(`creando perido en horaInicio hay: ${self.horaInicio()}`);
}
function EVS(evs)  {
  let self =this;
  self.evsid=evs.evsid || 0;
  self.descripcion=evs.descripcion || '';
 }
function Camara(data) {
  let self =this;
    const date= new Date();
    self.entradaId=data.entradaId || 0;
    self.descripcion=data.descripcion || '';
    self.esEVS=data.esEVS || false;
    self.contador=ko.observable(data.contador || -3600000);
    self.unixTimer=data.unixTimer || -3600000;
    self.on=ko.observable(data.on || false);
    self.EVSs=ko.observableArray([]);
    if (data.EVSs)
        data.EVSs.forEach(e => {
          self.EVSs.push(new EVS(e));
        });
    self.activeEvs=ko.observable(data.activeEvs || false);
    // momento se usa para guardar el minuto en que salta un EVS
    self.momento=ko.observable(data.momento || `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`);
}
function  Partido(data) {
  let self =this;
    self.partidoId=ko.observable(data.partidoId || 0);
    self.descripcion=ko.observable(data.descripcion || '');
    self.jornada=ko.observable(data.jornada || 0);
    self.unidadMovil=ko.observable(data.unidadMovil || 0);
    self.ip=ko.observable(data.ip || '');
    self.registrando=ko.observable(data.registrando || false);
    self.conectado=ko.observable(data.conectado || false);
    self.err=data.err || {'active':false, 'source':'', 'value':''};
    self.user=data.user || {'userId':0, 'userName':'not used'};
    // funcion sirve para que el botón del formulario 'generaTally' de index.ejs pueda funcionar
    // self.funcion= function ()  {
    //   let $form = $(event.target).closest('form');
    //   const partidoId= $form[0][0].value;
    //   socket.emit('genera-tally-aleatorio',partidoId);
    // };
    self.periodos=ko.observableArray([]);
    if (data.periodos) 
        data.periodos.sort((a,b) => {return (a.orden-b.orden)}).forEach( e => {
            self.periodos.push(new Periodo(e));
        });
    self.camaras=ko.observableArray([]);
    if (data.camaras)
        data.camaras.forEach(e => {
          self.camaras.push(new Camara(e));
        });
}
class TallyData {
  constructor(data) {
    const date = new Date();
    this.partidoId=data.partidoId || 0;
    this.entradaId=data.entradaId || 0;
    this.newTallyId=data.newTallyId || 0;
    this.entradaIdAnterior=data.entradaIdAnterior || -1;
    this.oldTallyId=data.oldTallyId || 0;
    this.momento=data.momento || `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    this.entradaIdContador=data.entradaIdContador || -3600000;
    this.timer=0;
  }
}
class CamaraEvs {
  constructor(data) {
    this.evsid=ko.observable(data.evsid || 0);
    this.descripcion=ko.observable(data.descripcion || '');
  }
}
// class TallyWithEvs {
//   constructor(data) {
//     this.newTallyId=ko.observable(data.newTallyId || 0);
//     this.camarasEvs=ko.observableArray([]);
//     if (data.camarasEvs)
//         data.camarasEvs.forEach(e => {
//           this.camarasEvs.push(new CamaraEvs(e));
//         });
//     this.active=ko.observable(data.active || false);
//     this.momento=ko.observable(data.momento || `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`);
//   }
// }
// objeto global donde se almacena el último tallyData de cada partido en visualización y un timer asociado a la cámara activa
const tallyDataInProgress = {};
// const partidoDomingo= new Partido(data);
// const lunes ={};
// const partidoLunes= new Partido(lunes);
// const tally= new TallyData({});
// console.log(`resultado domingo: ${JSON.stringify(partidoDomingo)}`);
// console.log(`resultado lunes: ${JSON.stringify(partidoLunes)}`);
// console.log(`tally: ${JSON.stringify(tally)}`);

// Función que muestra por cónsola el contenido de partido con sus observables

function indexLista2(listaPartidos) {
  const indexOfLista2 = {};
  listaPartidos.forEach((partido,index) => {
    indexOfLista2[partido.partidoId()]=index;
  });
  return indexOfLista2;
}
function indexCameras(listaPartidos) {
  const indexOfCameras=[];
  listaPartidos.forEach((partido) => {
    const objectCamera = {};
    partido.camaras().forEach((camara,index) => {
      objectCamera[camara.entradaId]=index;
    });
    indexOfCameras.push(objectCamera);
  });
  return indexOfCameras;
}
function indexPeriodos(listaPartidos) {
  const indexOfPeriodos=[];
  listaPartidos.forEach((partido) => {
    const objectPeriodo = {};
    partido.periodos().forEach((periodo,index) => {
      objectPeriodo[periodo.PPID]=index;
    });
    indexOfPeriodos.push(objectPeriodo);
  });
  return indexOfPeriodos;
};
// función que inicia el contador de la cámara activa en el partido indicado
// mdl es el modelo de visualización almacenado en variable global
// contador es el tiempo unix en milisegundos
function initCounter(contador,posicionPartidoEnLista2,posicionCamaraEnCamaras,partidoId) {
  const inicio=moment(new Date(contador));
  mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].contador(inicio.format('HH:mm:ss'));
  inicio.add(1,'s');
  const newContador = inicio.unix()*1000;
  // console.log(`Soy el timeout de suma tiempo: ${inicio.format('HH:mm:ss')}`);
  const callback="initCounter("+newContador+","+posicionPartidoEnLista2+","+posicionCamaraEnCamaras+","+partidoId+")";
  tallyDataInProgress[partidoId]['entradaIdContador']=newContador;
  tallyDataInProgress[partidoId]['timer']=setTimeout(callback,1000);
};
function initCounterPeriod(contador,posicionPartidoEnLista2,posicionPeriodoEnLista2) {
  const inicio=moment(new Date(contador));
  mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnLista2].contador(inicio.format('HH:mm:ss'));
  inicio.add(1,'s');
  const newContador = inicio.unix()*1000;
  const callback="initCounterPeriod("+newContador+","+posicionPartidoEnLista2+","+posicionPeriodoEnLista2+")";
  mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnLista2].timer=setTimeout(callback,1000);
  mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnLista2].unixTimer=newContador;
};
function convertToObject(observable) {
  const newObject = {};
  Object.keys(observable).forEach(key => {
    if (typeof observable[key]=== 'function') {
      newObject[key]=observable[key]();
    } else {
      newObject[key]=observable[key];
    }
  });
  return newObject;
}
function checkPeriodsStatus(partidoId) { // comprueba los periodos que tienen horaFin diferente de 0:00:00
  const periodsStatus = {};
  mdl.lista2()[indexOfLista2[partidoId]].periodos().forEach(periodo => {
    console.log(`Periodo PPID: ${periodo.PPID} nombre: ${periodo.nombre} orden: ${periodo.orden} horaInicio: ${periodo.horaInicio()} horaFin: ${periodo.horaFin()}`);
    periodsStatus[`${periodo.PPID}`]= periodo.horaInicio() != '00:00:00.000' ? {'started':true} : {'started':false};
    periodsStatus[`${periodo.PPID}`]['finished'] = periodo.horaFin() != '00:00:00.000' ? true : false;
    periodsStatus[`${periodo.PPID}`]['orden'] = periodo.orden;
  });
   console.log(`En checkPeriodsStatus ${JSON.stringify(periodsStatus)}`);
  return periodsStatus;
};
function AppViewModel(configuration) {
    let self =this;
    self.show = ko.observable(false);
    self.configuration = ko.observable(configuration);
    var d = new Date();
    var tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
    self.now = moment().format("HH:mm");
    self.currentPageIndex = ko.observable(0);
    self.pageSize = ko.observable(self.configuration().pageSize || 7);
    self.lista = ko.observableArray([]);
    self.lista2 = ko.observableArray([]);
    // self.listOfTalliesWithEvs = ko.observableArray([]);

    self.paginated = ko.computed( () => {
      var startIndex = self.pageSize() * self.currentPageIndex();
      //console.log("self.paginated>pageSize:",self.pageSize() ,"currentPageIndex:", self.currentPageIndex())
      return ko.unwrap(self.lista).slice(startIndex, startIndex + self.pageSize());
    });
    self.maxPageIndex = ko.computed(() => {
      var aux = Math.ceil(ko.unwrap(self.lista).length / self.pageSize()) - 1;
      if (aux == -1) { return 0 };
      return aux;
    });
    self.generaTallyAleatorio = (partido) => {
      socket.emit('genera-tally-aleatorio',partido.partidoId()); 
    };
    self.finPeriodoActivo = (partido) => {
      const momentoFin= moment(new Date());
      console.log(`Han pulsado fin y el momento es: ${momentoFin}`);
      console.log(`Han pulsado fin y el momento es: ${momentoFin.format('HH:mm:ss.SSS')}`);
      // hay que buscar que periodo está activo
      partido.err.active=false;
      const posicionPartidoEnLista2 = indexOfLista2[partido.partidoId()];
      const indicePeriodoActivoEnLista2 = partido.periodos().map(element => {
        return element.active();
      }).indexOf(true);
      if (indicePeriodoActivoEnLista2>=0) { // hay un periodo activo y voy a pararlo
        const noObservablePeriodo= convertToObject(partido.periodos()[indicePeriodoActivoEnLista2]);
        noObservablePeriodo.horaFin=momentoFin;
        socket.emit('pulsado-fin', (noObservablePeriodo));
      } else { // no hay periodo activo
        const periodsStatus = checkPeriodsStatus(partido.partidoId());
        const notStarted = [];
        self.lista2()[posicionPartidoEnLista2].periodos().forEach( (periodo) => {
          const periodStatus = (!periodsStatus[periodo.PPID]['started'] && !periodsStatus[periodo.PPID]['finished']) ? true : false;
          notStarted.push(periodStatus);
        });
        let firstPeriodNotStarted = 0;
            let counter = 1;
            notStarted.forEach(value => {
              if (value && !firstPeriodNotStarted)
                firstPeriodNotStarted=counter;
              counter++;
            });
            firstPeriodNotStarted--;
        if (firstPeriodNotStarted>=0) {
            partido.err= {
            'active': true,
            'source':'finPeriodoActivo',
            'value':`No hay ningún periodo activo para iniciar a contar tiempos pulsa primero en : ${partido.periodos()[firstPeriodNotStarted]['nombre']}`
            };
        } else {
          partido.err= {
            'active': true,
            'source':'finPeriodoActivo',
            'value':`No hay ningún periodo activo este partido ha finalizado`
            };
        }
      self.alertErr(partido.err);
      }
    };
    self.periodClicked = (periodo) => {
      const momentoInicio= moment(new Date());
      periodo.err.active=false;
      // he de analizar si esta pulsación es correcta
      // para este análisis necesito conocer el partidoId, que está en el periodo que he recibido del index.ejs ya que lo grabé en el insertMatchLine
      const posicionPartidoEnLista2 = indexOfLista2[periodo.partidoId];
      const indicePeriodoActivoEnLista2 = self.lista2()[posicionPartidoEnLista2].periodos().map(element => {
        return element.active();
      }).indexOf(true);
      // const ordersInPeriodos = self.lista2()[posicionPartidoEnLista2].periodos().map(element => {return element.orden;}).sort();
      // const nombrePeriodos = self.lista2()[posicionPartidoEnLista2].periodos().map(element => {
      //   const newObj = { 'orden': element['orden'], 'nombre': element['nombre']};
      //   return newObj;
      // }).sort((a,b) => {return (a.orden-b.orden)});
      console.log(`En periodClicked posicionPartidoEnLista2: ${posicionPartidoEnLista2}`);
      console.log(`En periodClicked indicePeriodoActivoEnLista2: ${indicePeriodoActivoEnLista2}`);
      // console.log(`En periodClicked ordersInPeriodos: ${ordersInPeriodos}`);
      // console.log(`En periodClicked nombrePeriodos: ${JSON.stringify(nombrePeriodos)}`);
      if (indicePeriodoActivoEnLista2>=0)
     { console.log(`Nombre del periodo activo ${self.lista2()[posicionPartidoEnLista2].periodos()[indicePeriodoActivoEnLista2].nombre}`);}
     if (indicePeriodoActivoEnLista2<0) { // no hay ningún periodo activo
      // primero comprobamos el estado de inicio/finalización de todos los periods de este partido
      const periodsStatus = checkPeriodsStatus(periodo.partidoId);
      const notStarted = [];
      self.lista2()[posicionPartidoEnLista2].periodos().forEach( (periodo) => {
        const periodStatus = (!periodsStatus[periodo.PPID]['started'] && !periodsStatus[periodo.PPID]['finished']) ? true : false;
        notStarted.push(periodStatus);
      });
      const posicionPeriodoPulsadoEnPeriodos = self.lista2()[posicionPartidoEnLista2].periodos().map(element => {
        return element.PPID;
      }).indexOf(periodo.PPID); // nos dice la posición en el array lista2().periodos() del periodo que ha sido pulsado
        let firstPeriodNotStarted = 0;
        let counter = 1;
        notStarted.forEach(value => {
          if (value && !firstPeriodNotStarted)
            firstPeriodNotStarted=counter;
          counter++;
        });
        firstPeriodNotStarted--;
        if (notStarted[posicionPeriodoPulsadoEnPeriodos]) { // el periodo donde han pulsado no está iniciado
              // ahora hay que comprobar si el periodo pulsado es el primero no iniciado de los que hay
            
            if (posicionPeriodoPulsadoEnPeriodos<=firstPeriodNotStarted) { // el periodo pulsado tiene un número de orden menor o igual que el primer periodo no iniciado
              // al pasar periodo al socket podemos perder valor de observables
              const noObservablePeriodo = convertToObject(periodo);
              noObservablePeriodo.horaInicio=momentoInicio;
              console.log(`En el no observable va horainicio: ${ noObservablePeriodo.horaInicio}`);
              console.log(`Comprobaciones en periodo pulsado posicionPeriodoPulsadoEnPeriodos: ${posicionPeriodoPulsadoEnPeriodos}`);
              console.log(`Comprobaciones en periodo pulsado firstPeriodNotStarted: ${firstPeriodNotStarted}`);
              
              socket.emit('pulsado-periodo',(noObservablePeriodo)); // para que lo guarde en BD
              // aqui debería iniciar contador de periodo, activar periodo y poner horaInicio para evitar el evento 'periodo-iniciado'
              // pero esto hace perder la lógica de varios clientes operando en paralelo
              // mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoPulsadoEnPeriodos].horaInicio(momentoInicio.format('HH:mm:ss'));
              // mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoPulsadoEnPeriodos].active(true);
              // initCounterPeriod(mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoPulsadoEnPeriodos].unixTimer,posicionPartidoEnLista2,posicionPeriodoPulsadoEnPeriodos);
            } else {
              periodo.err= {
                'active': true,
                'source':'periodoClicked',
                'value':`Los periodos han de iniciarse en orden. El siguiente periodo de inicio de este partido: ${self.lista2()[posicionPartidoEnLista2].periodos()[firstPeriodNotStarted]['nombre']}`
            };
            self.alertErr(periodo.err);
            }
        } else { // están pulsando en un periodo finalizado
          if (firstPeriodNotStarted>=0) {
              periodo.err= {
                'active': true,
                'source':'periodoClicked',
                'value':(`El periodo donde has pulsado: ${self.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoPulsadoEnPeriodos].nombre}, está finalizado.`+String.fromCharCode(13)+`El siguiente periodo a activar es: ${self.lista2()[posicionPartidoEnLista2].periodos()[firstPeriodNotStarted]['nombre']}`)
              };
          } else {
              periodo.err= {
                'active': true,
                'source':'periodoClicked',
                'value':`Este partido está finalizado, no se puede volver a activar ningún periodo`
              };
          }
          self.alertErr(periodo.err);
        }
     } else { // hay un perido activo por tanto al pulsar en el mismo periodo o en otro no debe hacer nada
      periodo.err= {
        'active': true,
        'source':'periodoClicked',
        'value':`Ya existe un periodo iniciado para este partido: ${self.lista2()[posicionPartidoEnLista2].periodos()[indicePeriodoActivoEnLista2].nombre}. Pulsa FIN para parar este periodo.`
      };
      self.alertErr(periodo.err);
     }
    }
    
    self.getActualMinute = (partidoId) => {
      let actualMinute='';
      self.lista2()[indexOfLista2[partidoId]].periodos().forEach(periodo => {
        if (periodo.active()) {
          const minute = periodo.contador();
          actualMinute= `${periodo.nombre}, minuto: ${minute}`;
        }
      });
      return actualMinute;
    };

    self.alertErr = (err) => {
      alert(`Error en : `+err.source+String.fromCharCode(13)+`Error: `+err.value);
    }

    self.addTruck = (data) => {
      self.lista.push(new Truck(data, self.configuration()));
    }

    self.insertTruck = (data) => {
      self.currentPageIndex(0);
      self.lista.unshift(new Truck(data, self.configuration()));
    }
    self.insertMatchLine = (footballMatch) => {
      console.log(`Me piden insertMatchLine de ${footballMatch.partidoId} e indexOfLista2 ${indexOfLista2[footballMatch.partidoId]}`);
      if (indexOfLista2[footballMatch.partidoId] === null || indexOfLista2[footballMatch.partidoId] === undefined)
        {
          const partido = new Partido(footballMatch);
          // Inserto un nuevo partido al inicio de lista2
          self.lista2.unshift(partido);
          // Indexo la nueva lista2 para que sea ágil localizar las entradas de cada partido
          // lo hago en variables globales y cada vez que se intriduce nuevo partido se actualizan
          indexOfLista2=indexLista2(self.lista2());
          indexOfCamaras=indexCameras(self.lista2());
          indexOfPeriodos=indexPeriodos(self.lista2());
          console.log(`insertMatchLine indexsado periodos: ${JSON.stringify(indexOfPeriodos)}`);
      }
    }
    // función para buscar la cámara con 'on'=true dentro de lista2().camaras
    // self.entradaActiva = (partidoId) => {
    //   self.lista2().forEach(partido => {
    //     if (partido.partidoId() == partidoId) {
    //       console.log(`Esoty en entradaActiva en el array cámara: ${JSON.stringify(partido.camaras)}`);
    //       const indiceCamaraActiva = partido.camaras().map((camara) => {return camara.on}).indexOf(true);
    //       console.log(`Esoty en entradaActiva en el array cámara es la posición: `,indiceCamaraActiva);
    //       return indiceCamaraActiva;
    //     }
        
    //   });
    // }
    // self.submitEvsDefinition = () => {
    //   let $form = $(event.target).closest('form');
    //   const evsid= $form[0][0].value;
    //   console.log(`En la asociación de cámara a EVS el evsid: `,evsid);
    // };
    self.getTruck = (id) => {
      return self.lista().find(function(truck) {
        return truck.id === id;
      });
    }

    var getTruckIndex = (id) => {
      return self.lista().map(function(truck) { return truck.id; }).indexOf(id);
    }

    self.removeTruck = (id) => {
      // Buscar por ID y eliminar
      var idx = getTruckIndex(id);
      self.lista.splice(idx, 1);
    }

    self.submitTruckData = () => {
      //make ajax call
      var $form = $(event.target).closest('form');
      // Se supone que ya es válido
      var data = {
        matricula: $form[0][0].value.toUpperCase(),
        transporte: $form[0][1].value.toUpperCase(),
        dock: $form[0][5].value.toUpperCase()  //added edit carrier button
      }
      console.log(`Inicia representación de respuesta Ajax:`)
      socket.emit("add-to-lista", data);
      // Limpiar formulario
      $('form#inputTruck')[0].reset();
      //$('.selectpicker').selectpicker('deselectAll');
      //$('.selectpicker').selectpicker('render');
      $('.selectpicker').selectpicker('refresh');
      $('#id-truck').focus(); //$('form#inputTruck')[0][0].focus();

    };

    self.submitMatchData = () => {
      //make ajax call
      var $form = $(event.target).closest('form');
      // Se supone que ya es válido
      // console.log(`acabo de llegar a submitMatchData en dashboard en el formulario ha escrito: ${$form[0][0].value}`);
      const footballMatch = {}; // voy a crear un objeto partido pero sin observables
      footballMatch.partidoId=$form[0][0].value;
      footballMatch.user=userLocal;
      socket.emit("add-new-partido", footballMatch);
      
      // Limpiar formulario
      $('form#inputPartido')[0].reset();
      //$('.selectpicker').selectpicker('deselectAll');
      //$('.selectpicker').selectpicker('render');
      
      $('#partidoDesc').focus(); //$('form#inputTruck')[0][0].focus();

    };
    
    self.deleteTruck = (truck) => {
      socket.emit("remove-from-lista", truck);
    };
  };


ko.bindingHandlers.date = {
  update: function (element, valueAccessor) {
      // retrieve the value from the span
      var timer = setInterval(function() { 
          $(element).text(moment().format("HH:mm"));
      }, 1000);
  }
};

var socket = io();
var mdl = null;
let indexOfLista2={};
let indexOfCamaras =[];
let indexOfPeriodos=[];
socket.on('lista-removed', function(truck) {
  mdl.removeTruck(truck.id);
});
socket.on('lista-added', function(truck) {
  mdl.insertTruck(truck);
});
socket.on('partido-added', function(footballMatch) {
  if (footballMatch.err.active) {
    mdl.alertErr(footballMatch.err);
  } else if (footballMatch.user.userId==userLocal.userId) {
      mdl.insertMatchLine(footballMatch);      
  }
});
socket.on('new-tally',function(tallyData) {
  // este cliente reacciona a este nuevo tally solo si tallyData.partidoId está en su lista2()
  if (indexOfLista2[tallyData.partidoId] !== null && indexOfLista2[tallyData.partidoId] !== undefined) {
    // al recibir un nuevo tally, primero hay que comprobar si ya estaba una cámara activa
    if (tallyData.entradaIdAnterior!=-1) { // hay que retirar una
      // console.log(`En dashboard la entrada ${tallyData.entradaIdAnterior} aún está activa y la retiro`);
      const posicionPartidoEnLista2 =indexOfLista2[tallyData.partidoId];
      const posicionCamaraEnCamaras = indexOfCamaras[posicionPartidoEnLista2][tallyData.entradaIdAnterior];
      mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].on(false);
      clearTimeout(tallyDataInProgress[tallyData.partidoId]['timer']);
      mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].unixTimer=tallyDataInProgress[tallyData.partidoId]['entradaIdContador'];
      // si el tally anterior era un EVS también hay que desactivar la selección de EVSs
      if (mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].esEVS) {
        mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].activeEvs(false);
      }
    } else { // es el primer tally que se recibe de este partido. inicio contador del periodo primero
      // arranco contador del primer periodo que encuentre
      // ¡OJO! este código debe cambiar y ser los botones de periodo y fin que controlen estos contadores
      // mdl.lista2()[indexOfLista2[tallyData.partidoId]].periodos()[0].active(true);
      // initCounterPeriod(mdl.lista2()[indexOfLista2[tallyData.partidoId]].periodos()[0].unixTimer,indexOfLista2[tallyData.partidoId],0);
      // comentado el arranque de contadores de periodo al lanzar un primer tally
    }
    const posicionPartidoEnLista2 =indexOfLista2[tallyData.partidoId];
    const posicionCamaraEnCamaras = indexOfCamaras[posicionPartidoEnLista2][tallyData.entradaId];
    mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].on(true);
    const miContador = mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].unixTimer;
    // inicio el contador para esa entrada
    const inicio = moment(new Date(miContador));
    mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].contador(inicio.format('HH:mm:ss'));
    tallyData.entradaIdContador=miContador;
    tallyDataInProgress[tallyData.partidoId]=tallyData;
    initCounter(miContador,posicionPartidoEnLista2,posicionCamaraEnCamaras,tallyData.partidoId);
    
    // hay que comprobar si la entrada tallyData.entradaId corresponde a un EVS.
    if (mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].esEVS) {
      const actualMinute = mdl.getActualMinute(tallyData.partidoId);
      mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].momento(actualMinute);
      mdl.lista2()[posicionPartidoEnLista2].camaras()[posicionCamaraEnCamaras].activeEvs(true);
    }
  }
});
socket.on('periodo-iniciado',function(periodo) {
    // iniciado un periodo reconocible por periodo.PPID para el partido periodo.partidoId
    const horaInicio= moment(new Date(periodo.horaInicio));
    const posicionPartidoEnLista2 =indexOfLista2[periodo.partidoId];
    const posicionPeriodoEnPeriodos = indexOfPeriodos[posicionPartidoEnLista2][periodo.PPID];
    mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnPeriodos].horaInicio(horaInicio.format('HH:mm:ss.SSS'));
    mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnPeriodos].active(true);
    initCounterPeriod(mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnPeriodos].unixTimer,posicionPartidoEnLista2,posicionPeriodoEnPeriodos);
});
socket.on('periodo-finalizado',function(periodo) {
  // finalizado un periodo reconocible por periodo.PPID para el partido periodo.partidoId
  const horaFin= moment(new Date(periodo.horaFin));
  const posicionPartidoEnLista2 =indexOfLista2[periodo.partidoId];
  const posicionPeriodoEnPeriodos = indexOfPeriodos[posicionPartidoEnLista2][periodo.PPID];
  clearTimeout(mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnPeriodos].timer);
  mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnPeriodos].horaFin(horaFin.format('HH:mm:ss.SSS'));
  mdl.lista2()[posicionPartidoEnLista2].periodos()[posicionPeriodoEnPeriodos].active(false);
});
socket.on('settings-completa', function(settings) {
  if (!mdl) {
    mdl = new AppViewModel(settings); // asocia el view model al objeto mdl
    // UI Bind
    ko.applyBindings(mdl); // aplica los bindings del knockout a la vista
    socket.emit('lista');
  } else {
    // Set new settings
    mdl.configuration(settings);
    socket.emit('lista');
    mdl.pageSize(settings.pageSize);
    mdl.currentPageIndex(0);
    //clearInterval(self.interval);
    //mdl.pageChanges();
  }
});
socket.on('lista-completa', function(lista) { // lista es la query de camiones con deleted=NULL. Cada uno de los objetos de la lista es un Truck que además puede tener la propiedad transport_full si hay imagen con logo.
  mdl.lista([]);
  lista.forEach(function(t) {
    console.log(`lista-completa llamando a addTruck: ${JSON.stringify(t)}`);
    mdl.addTruck(t);
  });
  mdl.show(true);
});
// Obtener lista de transportes (completa)
//socket.emit('settings');

var currentIndex = 0;
setInterval(function() {
  if (currentIndex || currentIndex == undefined) {
    $('.flash.border-left-success').removeClass("border-left-success").addClass("bg-warning border-left-warning");
    $('.remove.border-left-success').removeClass("border-left-success").addClass("border-left-danger");
    currentIndex = 0;
  } else {
    $('.flash.border-left-warning').addClass("border-left-success").removeClass("bg-warning border-left-warning");
    $('.remove.border-left-danger').addClass("border-left-success").removeClass("border-left-danger");
    $('.card.border-left-warning:not(.flash)').addClass("border-left-success").removeClass("bg-warning border-left-warning");
    $('.card.border-left-warning:not(.remove)').addClass("border-left-success").removeClass("border-left-danger");
    currentIndex++;
  }
  
}, 700);
