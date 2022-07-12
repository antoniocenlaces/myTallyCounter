//JavaScript con las funciones que muestran los títulos de diversas formas y la hora en barra de navegación
		//definición de variables globales para los títulos
		var frontTitle="¿Planchar tu ropa te supone un gran esfuerzo?";
		var contTitle=0;
		var left="";
		var actualSpace=0;
		var nextSpace=0;
		var myTimer;
		var myTimer2;
		//definición de variables globales para el título de respuesta
		var frontAnswer="Nosotros lo hacemos por tí. Olvídate de los montones de ropa pendiente de planchar. Con nuestros servicios llevarás tu ropa siempre perfecta y solo por 0.75€<sup>(*)</sup> por pieza.";
		var contAnswer=0;
		var carouselHor=0;
		var numItemText=0;
		const caroVisua={block: "nearest", behavior: "smooth"};
		var tit2Inter=false; //usada para saber si la función moveCaroHor() está en funcionamiento
		//Muestra el título en frontTitle cambiando de color las letras una a una. Color definido en <span> al final del head del HTML
		function muestra2() {
		var title=document.getElementById("frontTitle");
			if (contTitle<frontTitle.length) {
				if (frontTitle.substr(contTitle,1)!=" ") {
				title.innerHTML=frontTitle.substr(0,contTitle)+"<span>"+frontTitle.substr(contTitle,1)+"</span>"+frontTitle.substr(contTitle+1,frontTitle.length);
				contTitle++;
				myTimer=setTimeout("muestra2()",230);}
				else {contTitle++;myTimer=setTimeout("muestra2()",1);}
			} else {contTitle=0;myTimer=setTimeout("muestra2()",1000);}
		}
	//espa(text) devuelve un array con el número de espacios en la posición 0 y después la posición en text de cada uno de los espacios
		function espa(text) {
			var cont=0;
			var result=[];
			result[0]=0;
			for (var i = 0; i < text.length; i++) {
				if (text.slice(i,i+1)==" ") {result[0]=result[0]+1;result.push(i);}
			}
			result.push(text.length);
			return result;
	}
	//muestra3() Va mostrando frontTitle palabra a palabra en un <span> con color definido en style del head, cuando acaba este script 
		function muestra3() {
			var title=document.getElementById("frontTitle");
			var espacios=espa(frontTitle);
			if (contTitle<=espacios[0]) {
						title.innerHTML="<span>"+frontTitle.substr(0,espacios[contTitle+1])+"</span>"+frontTitle.slice(espacios[contTitle+1],frontTitle.length+1);
						contTitle++;
						if (contTitle<=espacios[0]) {myTimer=setTimeout("muestra3()",300);} else {contTitle=0;myTimer=setTimeout("muestra3()",6000);}
				}
				
		}
		//color() genera un color aleatorio en hexadecimal
		function color() {
			var n=0;
			do {
				n=Math.random();
				n=n.toString();
				n=n.substr(n.length-8,8);
				n=parseInt(n);
			}
			while (n>=16777215);
			n=n.toString(16);
			return ("#"+n);
		}
		//muestra() genera un color aleatorio para cada una de las letras de frontText
		function muestra() {
			var parrafo=document.getElementById("frontTitle");
			if(contTitle<frontTitle.length) {
				child=document.createElement("span");
				child.style.color=color();
				child.innerHTML=frontTitle.substr(contTitle,1);
				left+=child.outerHTML;
				parrafo.innerHTML=left+frontTitle.substr(contTitle+1,frontTitle.length-contTitle);
				// parrafo.insertAdjacentElement('beforeend',child);
				// parrafo.innerHTML+=frontTitle.substr(contTitle+1,frontTitle.length-contTitle);
				contTitle++;
				myTimer=setTimeout("muestra()",100);
			} else {contTitle=0;left="";parrafo.innerHTML="";myTimer=setTimeout("muestra()",1);}
		}
		//stopFunction() para la función setTimeout del frontTitle que esté en funcionamiento
		function stopFunction() {
			clearTimeout(myTimer);
		}
			//stopFunction2() para la función setTimeout que hace scroll horizontal en imagen2
		function stopFunction2() {
			console.log("han llamado a stopFunction2");
			clearTimeout(myTimer2);
		}
		function bt1() {
			stopFunction();
			contTitle=0;
			left="";
			muestra();
		}
		function bt2() {
			stopFunction();
			contTitle=0;
			muestra2();
		}
		function bt3() {
			stopFunction();
			contTitle=0;
			muestra3();
		}
		function reloj(){
		var fecha = new Date();
		var meses=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
		var dia=["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sábado"];
		var hora="";
		var minuto="";
		var segundo="";
		hora=String(fecha.getHours());
		minuto=String(fecha.getMinutes());
		segundo=String(fecha.getSeconds());
		if (fecha.getHours()<10) {hora="0"+hora;}
		if (fecha.getMinutes()<10) {minuto="0"+minuto;}
		if (fecha.getSeconds()<10) {segundo="0"+segundo;}
		document.getElementById("hora").value="Son las "+hora+":"+minuto+":"+segundo+" del "+dia[fecha.getDay()]+" "+fecha.getDate()+ " de "+meses[fecha.getMonth()]+ " de "+fecha.getFullYear();
		//esta línea de arriba obliga a actualizar la ventana.
		setTimeout("reloj()",1000);
		}
		//muestra el título en frontAnswer letra a letra.
		function titulo() {
		// if (carouselHor==0) {
		// 		tit2Inter=true;
		// 		carouselHor=1;
		// 		var f=document.getElementById("tit_2");
		// 		var pos=f.getBoundingClientRect();
		// 		// console.log("Left "+pos.left);
		// 		// console.log("top "+pos.top);
		// 		// console.log("right "+pos.right);
		// 		// console.log("bottom "+pos.bottom);
		// 		if (pos.top>90 && pos.top<300) {
		// 			moveCaroHor();
		// 		}
		// 	}
		var title=document.getElementById("frontAnswer");
			if (contAnswer<=frontAnswer.length) {
					if (frontAnswer.substr(contAnswer,1)=="<") {contAnswer+=13;}
				title.innerHTML=frontAnswer.substr(0,contAnswer);
				contAnswer++;
				setTimeout("titulo()",60);
			} else {contAnswer=0;setTimeout("titulo()",6000);}
		}
		//horizontal carousel for all .container-texto in the document
		function sleep(ms) {
  		return new Promise(resolve => setTimeout(resolve, ms));
		}

		async function demo() {
  		console.log('Taking a break...');
  		await sleep(2000);
  		console.log('Two seconds later, showing sleep in a loop...');
  	}
  	function abre(destino) { window.open(destino,"_self");}
  	function moveCaroHor() {
  		tit2Inter=true;
  		//if (tit2Inter) {
  		var elemText=document.querySelectorAll(".container-texto");
		  		if (numItemText<elemText.length) {
				  			elemText[numItemText].scrollIntoView(caroVisua);
				  			console.log("Estoy en moveCaroHor() elemento "+numItemText);
				  			numItemText++;
				  			myTimer2=setTimeout(moveCaroHor,4000);
		  				} else {
			  				numItemText=0;
			  				console.log("He llegado al final moveCaroHor() elemento "+numItemText);
			  				myTimer2=setTimeout(moveCaroHor,4000);
		  				}
  		//}	else {
  		//	stopFunction2();
  		//}
  	}