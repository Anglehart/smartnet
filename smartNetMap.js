var smartnetMap;
var request = new XMLHttpRequest();
//var statusButton;
var userRus = new Boolean(false);
var yandexLoaded = new Boolean(false);
var stations = [];
var clusters = [];
var isReady = new Boolean(false);
var clustersVisible = false; // для отображения кластеров при загрузке поменять на true
var circles = [];
var lastCollection = 0;
var lastActiveRegion = 0;

class vrsCluster {
	constructor(name,stations) {
		this.name = name;
		this.stations = stations;
		this.coords = [];
		this.polygon  = new ymaps.Polygon(
			[this.coords],{

			fillRule: "nonZero",
			 //  The contents of the balloon.
			hintContent: this.name}, {

			//обводка.
			strokeColor: '#70FF03',
			strokeOpacity: 0.5,
			strokeWidth: 1,
			strokeStyle: 'solid',
			//interactivityModel: 'default#transparent',
			fillColor: '#70FF03',
			fillOpacity: 0.2,
			visible: clustersVisible,
			//zIndex:5,
			});

			this.polygon.events.add('click', function (e) {
				console.log(e.originalEvent.target);
				e.originalEvent.target.options.set("strokeColor",'#70FF03');
				e.originalEvent.target.options.set("fillColor",'#70FF03');
				e.originalEvent.target.options.set("strokeWidth",1);
				//e.options.strokeWidth = 6;
			});

			this.polygon.events.add('mouseenter', function (e) {
				//console.log(e.originalEvent.target.properties._data.hintContent);
				//console.log(statusButton.data._data);
				e.originalEvent.target.options.set("strokeColor",'#03CBFF');
				e.originalEvent.target.options.set("fillColor",'#03CBFF');
				e.originalEvent.target.options.set("strokeWidth",1);
				e.originalEvent.target.options.set("strokeOpacity",0.8);
			//	statusButton.data._data.title = e.originalEvent.target.properties._data.hintContent;
				//statusButton.options._options.visible = true;

				//e.options.strokeWidth = 6;
			});

			this.polygon.events.add('mouseleave', function (e) {
				//console.log(e.originalEvent.target);
				e.originalEvent.target.options.set("strokeColor",'#70FF03');
				e.originalEvent.target.options.set("fillColor",'#70FF03');
				e.originalEvent.target.options.set("strokeWidth",1);
				//e.options.strokeWidth = 6;
			});

	}

	addToMap(map) {
		var clusterCoords = [];
		var hullCoords = [];
		this.stations.forEach(function (site, i, sites) {
			clusterCoords.push({
				x: site.LatDeg,
				y: site.LonDeg,
			});
		});
		convexhull.makeHull(clusterCoords).forEach(function (point, i, points) {
			hullCoords.push([point.x, point.y]);
		});
		this.polygon.geometry.setCoordinates([hullCoords]);
		this.polygon.options._options.fill = true;
		// Добавляем многоугольник на карту.
		map.geoObjects.add(this.polygon);
	}
}

loadURL = function(url) {
	var oRequest = new XMLHttpRequest();
    oRequest.open('GET', url, false);
    oRequest.send(null);
    return oRequest.responseText;
	};

 getStations = function(){
	var output = JSON.parse(loadURL("https://smartnet.navgeocom.ru/spiderweb/allsites.html"));
	var additionalData;
	//console.log(output.length);
	for (var i = 0; i < output.length; i++)	{
		additionalData = getAdditionalSitesData(output[i]);
		output[i].nameRus = additionalData[0];
		output[i].mountpoint = additionalData[2];
		output[i].addressRus = additionalData[3];
		output[i].portTCP = additionalData[4];
		output[i].RtcmId = additionalData[5];
		output[i].comment = additionalData[6];
		}
	if (!userRus){
		var i = 0;
		while (i < output.length)
			if (output[i].comment == 'Crimea'){
				output.splice(i, 1);
		}
		else i++;
	}
	return output;
}

getClusters = function(Stations,map) {
	var output = [];
	var sites = [];
	clustersJSON = JSON.parse(loadURL("https://smartnet.navgeocom.ru/spiderweb/src/cluster3.php"));
	clustersJSON.forEach(function(clusterJSON,k,clustersJSON){
		var sites = [];
		for (var i = 0; i < clusterJSON.sites.length; i++){
			for (var j = 0; j < Stations.length; j++) {
				if ((clusterJSON.sites[i].SiteName == Stations[j].SiteCode)&&(Stations[j].StatusCode == 3)){
					sites.push(Stations[j]);
				};
			};
		};
		output.push(new vrsCluster(clusterJSON.Name,sites));
	});
	output.forEach(function (cluster, i, output) {
	cluster.addToMap(map);
	});
	return output;
}

inRussia = function(geoobject){
	for (var i = 0; i < geoobject.geoObjects.get(0).getAdministrativeAreas().length; i++)
		if (geoobject.geoObjects.get(0).getAdministrativeAreas()[i] == 'Крым') return true;
	if (geoobject.geoObjects.get(0).getCountry()== 'Россия') return true;
	return false;
}

createMap = function (centerCoord) {
	var map = new ymaps.Map('map', {
		center: centerCoord,
		zoom: 7,
		controls: ['zoomControl', 'searchControl', 'typeSelector','rulerControl'],
	}, {
		searchControlProvider: 'yandex#search'
	});
	stations = getStations();
	clusters = getClusters(stations, map);
	//	map.controls.add(getButtonClustersView())	;
	var overallStatus = getOverallStatus(stations);
	var stationsCount = overallStatus[0] + overallStatus[1];
	vrsButtonTitle = ['Показать кластеры VRS','Зона покрытия'];
	vrsButtonContent = ['Показать станции сети','Показать кластеры VRS'];
//	QButtonTitle = ['Что это?'];
	//QButtonContent = ['? '];
	//var innerText = 'Станций: ' + stationsCount;
	//var balloonText = 'Станций в сети: ' + overallStatus[0];

ButtonLayout = ymaps.templateLayoutFactory.createClass([
        '<div title="{{ data.title }}" class="mapButton ',
        '">',
        '<span class="mapButtonText">{{ data.content }}</span>',
        '</div>'
    ].join('')),
	vrsButton = new ymaps.control.Button({
		data: {
			content:vrsButtonContent[1], // для отображения кластеров при загрузке поменять на 0
			title: vrsButtonTitle[1], // для отображения кластеров при загрузке поменять на 0
		},
		options: {
			layout: ButtonLayout,
			maxWidth: 220,
			selectOnClick: true,
		},
		state: {selected: clustersVisible},
	});

	//QButton = new ymaps.control.Button({
	//	data: {
		//	content:QButtonContent[0],
		//	title: QButtonTitle[0],
	//	},
		//options: {
			//maxWidth: 30,
		//	selectOnClick: false,
	//	},
	//});

	console.log(vrsButton.state);
	vrsButton.events.add('click', function () {
		clustersVisible = !vrsButton._selected;
		if (clustersVisible) vrsButton.data.set({content:vrsButtonContent[0],  title:  vrsButtonTitle[0]});
		else vrsButton.data.set({ content:vrsButtonContent[1],  title:  vrsButtonTitle[1]});
		clusters.forEach(function(cluster,i,clusterArray){
			cluster.polygon.options.set({visible: clustersVisible});
			//console.log(cluster.polygon.options.visible);// = vrsButton._selected;
		});
		circles.forEach(function(circle,i,circlesArray){
			console.log(circle);
			circle.options.set({visible: !clustersVisible});
		});

	});

//	QButton.events.add('click', function () {
//		ymaps.Placemark("fffff");
//	});

     //   map.controls.add(QButton);
	map.controls.add(vrsButton);
	putMarkers(stations, map);
	return map;
};

	 ymaps.ready(function () {
 userRus = false;
	ymaps.geolocation.get({
    provider: 'yandex',
    autoReverseGeocode: true
}).then(function (result) {
	userRus = (inRussia(result));
	userCoord = result.geoObjects.get(0).geometry._coordinates;
	var smartnetMap = createMap(result.geoObjects.get(0).geometry._coordinates);
	ymaps.borders.load('RU',{lang: 'ru'}).then(function (geojson) {
			for (var i = 0; i < geojson.features.length; i++) {
				if (geojson.features[i].properties.name == 'Big_Moscow_X-POS'){
					geojson.features[i].properties.name = 'Кластер VRS Москва'};

				addBorders(smartnetMap,geojson.features[i].geometry.coordinates,geojson.features[i].properties.name);
			};
		});
}, function (e) {
	var smartnetMap = createMap([55.751574, 37.573856]);
	userRus = false;
	ymaps.borders.load('EN',{lang: 'en'}).then(function (geojson) {
			for (var i = 0; i < geojson.features.length; i++) {
				addBorders(smartnetMap,geojson.features[i].geometry.coordinates,geojson.features[i].properties.iso3166);
			};
		});
	});
	});



function addBorders(map,coords,name){
		var myGeoObject = new ymaps.GeoObject({
        // Описываем геометрию геообъекта.
        geometry: {
            // Тип геометрии - "Многоугольник".
            type: "Polygon",
            // Указываем координаты вершин многоугольника.
            coordinates: coords,
        },
		 properties:{
            // Содержимое балуна.
            hintContent: name
        }
    }, {
        // Цвет обводки.
        strokeColor: '#004d4d',
		strokeOpacity: 0.2,
        // Ширина обводки.
        strokeWidth: 2,
		interactivityModel: 'default#transparent',
		strokeStyle: 'solid',
		zIndex:5,
    });
	myGeoObject.options._options.fill = false;
    // Добавляем многоугольник на карту.
    map.geoObjects.add(myGeoObject);
}

 function putMarkers(stations, smartnetMap){
  var marker = new ymaps.Placemark();
  clusterer = new ymaps.Clusterer({
	  preset: 'islands#invertedRedClusterIcons',
	  groupByCoordinates: false,
	//  clusterDisableClickZoom: true,
	  clusterHideIconOnBalloonOpen: true,
	  geoObjectHideIconOnBalloonOpen: false
  })
	circles = [];
	for (var i = 0; i < stations.length; i++) {
		marker = getMarker(stations[i]);
		clusterer.add(marker);
		circles.push(getCircle(stations[i]));
		smartnetMap.geoObjects.add(circles[i]);
	}
	smartnetMap.geoObjects.add(clusterer);
}

function getMarker(station){
	var markerIcon = './images/smartnet icon 24.png';
		var comment = getStationComment(station);
		if (comment == 'Crimea')
			markerIcon = './images/smartnet icon 24 Crimea.png';
		if (station.StatusCode != 3)
			markerIcon = './images/smartnet icon 24 offline.png';
		//markerIcon = './images/smartnet icon 24.png';

	var marker = new ymaps.Placemark(
		[station.LatDeg, station.LonDeg],
		{
            hintContent: getStationTitle(station),
            balloonContent: getStationInfo(station)
        },{
            iconLayout: 'default#image',
            iconImageHref: markerIcon,
            iconImageSize: [24, 24],
            iconImageOffset: [-11, -12],

	})
	//marker.options.zIndex = 100;
	//console.log(marker);
	//marker.balloon.options.maxWidth = 1000;
	return marker;
}

function getCircle(station){
	var coverageRadius = 1;
	if ((station.StatusCode >= 2)&(station.StatusCode <= 3)){
		coverageRadius = 55000;
		fillColor= "#70ff0340";
        strokeColor= "#f1ffe690";
	}
	else {
		coverageRadius = 1;
		//coverageRadius = 50000;
		fillColor= "#70ff0340";
        strokeColor= "#f1ffe690";
	}
    var coverageCircle = new ymaps.Circle([[station.LatDeg, station.LonDeg],coverageRadius],
	{},{
		//coverageRadius = 40000,
		fillColor: fillColor,
		strokeColor: strokeColor,
		strokeWidth: 0.5,
		visible: !clustersVisible,
    });
	coverageCircle.options.set('zIndex', 0);
	return coverageCircle
}


getOverallStatus = function(stationsArray){
	var onlineCount = 0;
	var offlineCount = 0;
	stationsArray.forEach(function(station, i, stationsArray){
		if ((station.StatusCode == 3) || (station.StatusCode == 2))
			onlineCount = onlineCount +1;
		else
			offlineCount = offlineCount +1;
	})
	return([onlineCount,offlineCount])
}

getStationComment = function (station){
	for (var i = 0; i < additionalSitesData.length; i++) {
		var siteCode = additionalSitesData[i][1];
		if (siteCode == station.SiteCode) return additionalSitesData[i][6];
	}
	return ' ';
}

getAdditionalSitesData = function (station){
	for (var i = 0; i < additionalSitesData.length; i++) {
		var siteCode = additionalSitesData[i][1];
		if (siteCode == station.SiteCode) return additionalSitesData[i];
	}
	//console.log('Нет дополнительных данных по '+station.SiteName);
	return [station.SiteName,station.SiteCode,station.Mountpoint,station.Address,0,0,''];
}

getReceiverDescription = function (station){
	if ((station.ReceiverType!= '')&&(station.ReceiverType!= ' '))
	for (var i = 0; i < receiversDescription.length; i++)
		if (receiversDescription[i][0] == station.ReceiverType) return receiversDescription[i];
	//console.log('Нет описания приемника '+station.ReceiverType +'@'+ station.SiteCode);
	return [station.ReceiverType,'',''];
}

getAntennaDescription = function (station){
	if ((station.AntennaType!= '')&&(station.AntennaType!= ' '))
	for (var i = 0; i < antennasDescription.length; i++)
		if (antennasDescription[i][0] == station.AntennaType) return antennasDescription[i];
	//console.log('Нет описания антенны '+station.AntennaType +'@'+ station.SiteCode);
	return [station.AntennaType,'',''];
}

getStationInfo = function (station){
	var contentString = [];
		switch (station.StatusCode){
			case '0': var stationStatus = '<span style="color:white; background:red"><b>Нет связи</b></span>'; break;
			case '2': var stationStatus = 'В сети'; break;
			case '3': var stationStatus = '<span style="color:black; background:lime"><b>В сети</b></span>'; break;
			case '4': var stationStatus = '<span style="color:white; background:red"><b>Нет связи</b></span>'; break;
			case '6': var stationStatus = '<span style="color:white; background:red"><b>Нет связи</b></span>'; break;
			default:  var stationStatus = 'n/a'
		}
		var receiverInfo = '';
		var receiverSerial = '';
		var receiverImg = '';
		var receiverDescription = getReceiverDescription(station);
		if (receiverDescription[1] != '')
			receiverInfo = '<b>Приемник: </b>'+ receiverDescription[1]+receiverSerial;

		if (receiverDescription[2]!= '')
			receiverImg = '<img src="images/'+receiverDescription[2]+'" align="center">';

		var antennaInfo = '';
		var antennaSerial = '';
		var antennaImg = '';
		var antennaDescription = getAntennaDescription(station);
		if (antennaDescription[1] != '')
			antennaInfo = '<b>Антенна: </b>'+ antennaDescription[1]+antennaSerial;

		if (antennaDescription[2]!= '')
			antennaImg = '<img src="images/'+antennaDescription[2]+'" align="center">';

		var additionalSitesData = getAdditionalSitesData(station);

		contentString = '<div id="content">'+
		'<div id="siteNotice">'+
		'</div>'+
		'<h1 id="firstHeading" class="firstHeading">'+'Паспорт станции </h1>'+
		'<div id="bodyContent">'+
		'<p><b>Имя станции:</b> '+station.nameRus+'<br>'+
		'<b>Координаты:</b> '+GetDMS(station.LatDeg_rad)+ ' с.ш. '+GetDMS(station.LonDeg_rad)+
		' в.д. <br>'+ '<b>Высота: </b>'+station.Height_rad+'<br>'+
		'<b>Расположение: </b>'+station.addressRus+'<br>'+
		'<h3>Параметры подключения: </h3>'+
		'<b>Сервер:</b> smartnet.navgeocom.ru (IP: 89.108.117.231)<br>'+
		'<b>Порт для подключения:</b> '+station.portTCP+'<br>'+
		'<b>Имя точки подключения:</b> '+station.mountpoint+'<br>'+
		'<b>RTCM ID:</b> '+station.RtcmId+'<br>'+
		'<table>' +
		'<tr><td>'+receiverInfo+'</td><td>'+receiverImg+'</td> </tr>'+
		'<tr><td>'+antennaInfo+'</td><td>'+antennaImg+'</td> </tr>'+
		'</table>'+
		'</p>'+
		'<p>Состояние станции: '+stationStatus+'</p>'
		'</div> </div>';

	return contentString;
}

getStationTitle = function (station){
	return 'Станция: <B>'+ station.nameRus+'</b><br> Точка подключения: '+ station.mountpoint+'<br> Порт подключения: '+station.portTCP;
}


GetDMS = function(input){
	var inputDeg = (180/Math.PI)*input;
	var decimal = getDecimal(inputDeg);
	var minutes = Math.floor(60*decimal);
	var seconds = getDecimal(inputDeg*60)*60;
	return Math.floor(inputDeg).toString()+'°'+minutes.toString()+"'"+seconds.toFixed(5)+'"';
}

  function getDecimal(num) {
      var str = "" + num;
      var zeroPos = str.indexOf(".");
      if (zeroPos == -1) return 0;
      str = str.slice(zeroPos);
      return +str;
    }
