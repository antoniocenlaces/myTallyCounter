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
  var removeBlinkTime = ((((s.t3 *60)-s.t4)*1000)-(now - self.created.valueOf()));
  //console.log("timeout:",removeBlinkTime);
  setTimeout(function() {
    self.removeBlink(true);
  }, Math.max(removeBlinkTime, 0));
}

function AppViewModel(configuration) {
  var self = this;
  self.show = ko.observable(false);
  self.serverConnection = ko.observable(false);
  self.configuration = ko.observable(configuration);
  var d = new Date();
  var tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
  self.now = moment().format("HH:mm");
  self.currentPageIndex = ko.observable(0);
  self.pageSize = ko.observable(self.configuration().pageSize || 7);
  self.lista = ko.observableArray([]);
  self.nueva_lista = null;
  self.paginated = ko.computed(function () {
      var startIndex = self.pageSize() * self.currentPageIndex();
      //console.log("self.paginated>pageSize:",self.pageSize() ,"currentPageIndex:", self.currentPageIndex())
      return ko.unwrap(self.lista).slice(startIndex, startIndex + self.pageSize());
  });
  self.maxPageIndex = ko.computed(function () {
      var aux = Math.ceil(ko.unwrap(self.lista).length / self.pageSize()) - 1;
      if (aux == -1) { return 0 };
      return aux;
  });
  self.pageblinked = ko.observable(false);
  
  
 

  self.addTruck = function(data) {
    self.lista.push(new Truck(data, self.configuration()));
  }

  self.insertTruck = function(data) {
    if (self.nueva_lista) {
      self.lista(self.nueva_lista);
      self.nueva_lista = null;
    }

    //console.log ("insertTruck:clear:",self.interval);
    self.lista.unshift(new Truck(data, self.configuration()));
    mdl.pageChanges();
    self.currentPageIndex(0);
    //siga parpadeando
    //console.log("insertTruck","pageTimer:",self.pageTimer);
    self.pageBlink();
  } 

    

  self.getTruck = function(id) {
    return self.lista().find(function(truck) {
      return truck.id === id;
    });
  }

  var getTruckIndex = function(id) {
    return self.nueva_lista.map(function(truck) { return truck.id; }).indexOf(id);
  }

  self.removeTruck = function(id) {
    // Buscar por ID y eliminar
    // Crear copia de objeto y actualizar antes de volver a la página 1
    if (!self.nueva_lista) {
      var aux = self.lista();
      self.nueva_lista = aux.slice(0);
    }
    var idx = getTruckIndex(id);
    self.nueva_lista.splice(idx, 1);
  }

  self.pageBlink = function(){
    if (self.pageTimer) {
      clearTimeout(self.pageTimer);
      //console.log("reset pageTimer");
      self.pageTimer = 0;
    }
    self.pageblinked(true);
    //console.log("pageblinked(true)","pageTimer:",self.pageTimer);
    self.pageTimer =setTimeout(function() {
      self.pageblinked(false);
      self.pageTimer = 0;
      //console.log("pageblinked(false)","pageTimer:",self.pageTimer);
    }, self.configuration().t1*1000);
  }

  self.nextPage = function() {
    var lastpage = self.currentPageIndex();
    //console.log("nextPage():self.interval:", self.interval);
    //console.log("1.laspage:",lastpage,"currentPageIndex",self.currentPageIndex(),"pageTimer:",self.pageTimer);
    if (self.currentPageIndex() < self.maxPageIndex()) {
      self.currentPageIndex(self.currentPageIndex()+1);
    } else {
      // Establecer nueva lista
      if (self.nueva_lista) {
        self.lista(self.nueva_lista);
        self.nueva_lista = null;
      }
      self.currentPageIndex(0);
    }
    //Blink page with changes
    //console.log("2.laspage:",lastpage,"currentPageIndex",self.currentPageIndex(),"pageTimer:",self.pageTimer);
    if (lastpage != self.currentPageIndex()){
      self.pageBlink();
    }
  }

  self.pageChanges = function() {
    //console.log ("pageChanges:self.interval:",self.interval,"cleared");
    clearInterval(self.interval); //bug multiples setInterval activos
    self.interval = setInterval(function() {
      self.nextPage();
    }, self.configuration().t2*1000);
  }

  self.pageChanges();

}

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

socket.on('lista-removed', function(truck) {
  mdl.removeTruck(truck.id);
});
socket.on('lista-added', function(truck) {
  mdl.insertTruck(truck);
});
socket.on('settings-completa', function(settings) {
  if (!mdl) {
    mdl = new AppViewModel(settings);
    // UI Bind
    ko.applyBindings(mdl);
    socket.emit('lista');
  } else {
    // Set new settings
    mdl.configuration(settings);
    socket.emit('lista');
    mdl.pageSize(settings.pageSize);
    mdl.currentPageIndex(0);
    mdl.pageChanges();
  }
});
socket.on('lista-completa', function(lista) {
  mdl.lista([]);
  lista.forEach(function(t) {
    mdl.addTruck(t);
  });
  mdl.show(true);
  mdl.serverConnection(true); 
});
// Obtener lista de transportes (completa)
//socket.emit('settings');



socket.on('connect', function() {
  //console.log('Client connected!');
  socket.on('disconnect', function() {
    //console.log('Client disconnected!');
    mdl.serverConnection(false);
  });
});

var currentIndex = 0;

setInterval(function() {
      if (currentIndex || currentIndex == undefined) {
        $('.flash.border-left-success').removeClass("border-left-success").addClass("bg-warning border-left-warning"); //nuevo dato
        $('.remove.border-left-success').removeClass("border-left-success").addClass("border-left-danger"); //aviso borrado
        $('.flashpage.text-white').removeClass("text-white").addClass("text-warning"); //page numbers
        currentIndex = 0;
      } else {
        $('.flash.border-left-warning').addClass("border-left-success").removeClass("bg-warning border-left-warning");//nuevo dato
        $('.remove.border-left-danger').addClass("border-left-success").removeClass("border-left-danger");//aviso borrado
        $('.flashpage.text-warning').addClass("text-white").removeClass("text-warning"); ////page numbers
        $('.card.border-left-warning:not(.flash)').addClass("border-left-success").removeClass("bg-warning border-left-warning");//nuevo dato
        $('.card.border-left-warning:not(.remove)').addClass("border-left-success").removeClass("border-left-danger");//aviso borrado
        $('.h1.text-warning:not(.flashpage)').addClass("text-white").removeClass("text-warning"); ////page numbers
        currentIndex++;
      }
      
    }, 700);
 
 