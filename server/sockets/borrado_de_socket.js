exports.generaPrimerTally = (cliente, io) => { // función del socket que genera un tally aleatorio se lo manda al cliente via socket y se lo manda a db.js
    console.log(`Estoy en inicio de GENERA TALLIES de socket fuera del on`);
    const entradas = [];
    for (let i = 1; i <= 24; i++) {
       entradas.push(i);
    }
    for (let i = 37; i <= 42; i++) {
        entradas.push(i);
    }
    entradas.push(45);
    const numEntradas= entradas.length;
    const entradaIdAnterior =-1;
  
    cliente.on('genera-primer-tally', (partidoId) =>{ // se usa solo para un primer tally aleatorio. el objeto tallyData es generado por primera vez
            // tallyData será usado para mantener la información del tally activo en el momento y cuando entra un nuevo informar del anterior
            console.log(`Estoy GENERA TALLIES socket DENTRO del on genera primer tally para partidoId: ${partidoId}`);
            // const indiceEntradas = Math.floor(Math.random()*numEntradas);
            const indiceEntradas =numEntradas-1;
            const date = new Date();
            const momento = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
            const data = {
                partidoId,
                'entradaId': entradas[indiceEntradas],
                'newTallyId': 0,
                entradaIdAnterior,
                'oldTallyId': 0,
                momento
            };
            const tallyData = new TallyData(data);
            console.log(`en generaPrimerTally de socket tallyData con class: ${JSON.stringify(tallyData)}`);
            const db = Db.instance
            return db.newTally(tallyData).then((result) => {
                console.log(`en socket generaPrimerTally resultado recibido de DB: ${JSON.stringify(result)}`);
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

function observableToString(partido) {
    console.log(`VOY A VER EL CONTENIDO DE PARTIDO con constructor`);
    Object.keys(partido).forEach(key => {
      switch (key) {
        case 'periodos':
          partido.periodos().forEach(periodo => {
            Object.keys(periodo).forEach(periodoKey => {
              switch (periodoKey) {
                case 'contador':
                case 'horaInicio':
                case 'horaFin':
                    console.log(`Valor del ${periodoKey} de este periodo: ${periodo[periodoKey]()}`);
                  break;
                  default:
                    console.log(`Valor de periodoKey=${periodoKey} es ${periodo[periodoKey]}`);
                  break;
              }
            });
          });
          break;
        case 'camaras':
          partido.camaras().forEach(camara => {
            Object.keys(camara).forEach(camaraKey => {
              switch (camaraKey) { 
                case 'EVSs':
                  camara.EVSs().forEach(evs => {
                    console.log(`EVS : ${JSON.stringify(evs)}`);
                  });
                  break;
                case 'on':
                case 'contador':
                case 'activeEvs':
                case 'momento':
                  console.log(`Valor del ${camaraKey} de esta cámara: ${camara[camaraKey]()}`);
                  break;
                default:
                  console.log(`Valor de camaraKey=${camaraKey} es ${camara[camaraKey]}`);
                  break;
              }
            });
          });
          break;
        default:
          if (typeof(partido[key]())=='object'){
            console.log(`Valor del objeto ${key} del partido: ${JSON.stringify(partido[key]())}`);
          } else {
            console.log(`Valor de propiedad ${key} del partido: ${partido[key]()}`);
          }
          break;
      }
    });
  };
  
  // función que convierte un objeto footballMatch creado por socket.js con datos de DB en un objeto de tipo Partido con sus observables
  function objectToObservable(footballMatch) {
    const partido1 = new Partido({});
    Object.keys(footballMatch).forEach(key => {
      // console.log(`Estoy en la clave ${key} de footballMatch`);
      switch (key) {
        case 'periodos':
          // console.log(`Entro en key de footballMatch=periodos y voy a iterar para cada periodo`);
          footballMatch[key].forEach(periodo => {
            // console.log(`en iteración para cada periodo: ${JSON.stringify(periodo)}`);
            partido1[key].push(periodo);
          });
          break;
        case 'camaras':
          // console.log(`Entro en key de footballMatch=camaras y voy a iterar para cada camara`);
          footballMatch[key].forEach(camara => {
            // console.log(`en iteración para cada camara: ${JSON.stringify(camara)}`);
            const camaraNew =new Camara({});
           // console.log(`He creado un nuevo objeto camaraNew: ${JSON.stringify(camaraNew)}`);
            Object.keys(camara).forEach(camaraKey => {
              // console.log(`dentro de una camara voy a pasar por todas sus camaraKey: ${camaraKey}`);
              switch (camaraKey) { // hay que cargar el array camaras de partido1 propiedad a propiedad para que respete los observables
                case 'EVSs':
                  // console.log(`He llegado al camaraKey=EVSs`);
                  // console.log(`en esta camara el array EVSs: ${JSON.stringify(camara[camaraKey])}`);
                  camara[camaraKey].forEach(evs => {
                   // console.log(`Itero para cada evs de camara.EVSs: ${JSON.stringify(evs)}`);
                    camaraNew[camaraKey].push(evs);
                  });
                  break;
                  case 'on':
                  case 'contador':
                    camaraNew[camaraKey](camara[camaraKey]);
                    break;
                default:
                  // console.log(`Este es un camaraKey que va por defecto y le cargo camara[camaraKey] ${camara[camaraKey]}`);
                  camaraNew[camaraKey]=camara[camaraKey];
                  break;
              }
            });
            partido1[key].push(camaraNew);
          });
          break;
        default:
          partido1[key](footballMatch[key]);
          break;
      }
    });
    return partido1;
  };