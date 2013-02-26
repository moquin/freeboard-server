/*
 * Copyright 2012,2013 Robert Huitema robert@42.co.nz
 * 
 * This file is part of FreeBoard. (http://www.42.co.nz/freeboard)
 *
 *  FreeBoard is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.

 *  FreeBoard is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.

 *  You should have received a copy of the GNU General Public License
 *  along with FreeBoard.  If not, see <http://www.gnu.org/licenses/>.
 */


//var trackLine = null;
//
//var gotoLayer = new OpenLayers.Layer.Vector('Go To Waypoint', {renderers: ['Canvas', 'SVG', 'VML'],
//	styleMap: new OpenLayers.StyleMap({
//		strokeWidth : 5,
//		strokeOpacity : 0.4,
//		strokeColor : "#FFFF00",
//		//strokeDashstyle : "dash",
//    })
//});
//

var map;
var shipMarker;
var hdgLayer;
var bearingLayer;
var trackLayer;
var wgpxLayer;
var followBoat=false;

var lat=0.0;
var lon=0.0;
var heading=0.0;
var speed=0.0;
var declination=0.0;
var trackCount=0;
var moveCount=0;
var baseLayers;
var overlays;
var layers;

function initCharts() {
	//
	map = L.map('map', {
	}).setView([ 0.0, 0.0 ], 2);

	addLayers(map);

	var zoomControl = new L.Control.Zoom({
		position : 'topright',
	});
	map.addControl(zoomControl);

	var measureControl = new L.Control.Measure({
		position : 'topright',
	});
	map.addControl(measureControl);

	// Initialize the FeatureGroup to store editable layers
	var drawnItems = new L.FeatureGroup();
	map.addLayer(drawnItems);

	//Waypoints
	refreshWaypoints();
	
	//add all the waypoints to the drawnItems
//	wgpxLayer.eachLayer(function (layer) {
//		drawnItems.addLayer(layer);
//	});
	
	// Initialize the draw control and pass it the FeatureGroup of editable
	// layers
	var drawControl = new L.Control.Draw({
		position : 'topright',
		draw : {
			polyline : {
				title : 'Create a route'
			},
			marker : {
				title : 'Add a waypoint'
			},
			polygon : false,
			rectangle : false,
			circle : false,
		},

		edit : {
			featureGroup : drawnItems
		}
	});
	map.addControl(drawControl);

	// ship
	var myIcon = L.icon({
		iconUrl : './js/img/ship_red.png',
		iconSize : [ 10, 24 ],
		iconAnchor : [ 5, 10 ],
	});
	shipMarker = L.marker([ 0.0, 0.0 ], {
		icon : myIcon
	}).addTo(map);

	hdgLayer = L.polyline([ new L.LatLng(0.0, 0.0), new L.LatLng(0.0, 0.0) ], {
		color : 'black',
		weight: 1,
		dashArray: '5,5',
	}).addTo(map);
	
	bearingLayer = L.polyline([ new L.LatLng(0.0, 0.0), new L.LatLng(0.0, 0.0) ], {
		color : 'green',
		weight: 3,
		opacity: 1,
		fillOpacity: 1,
	}).addTo(map);
	
	//GPX track
	var trkUrl = "http://'+window.location.host+':8080/freeboard/tracks/current.gpx"; // URL to your GPX file
	trackLayer = new L.GPX(trkUrl, {async: true}).on('loaded', function(e) {
	  map.fitBounds(e.target.getBounds());
	}).addTo(map);
	layers.addOverlay(trackLayer, "Track");
	
	//add waypoints
	map.on('draw:created', function (e) {
	    var type = e.layerType,
	        layer = e.layer;

	    if (type === 'marker') {
	    	zAu.send(new zk.Event(zk.Widget.$("$this"), 'onWaypoint', new Array(layer.getLatLng().lat,layer.getLatLng().lng,lat,lon)));
	    }
	    drawnItems.addLayer(layer);
	});
	
	map.on('draw:edited', function (e) {
	    var type = e.layerType,
	        layers = e.layers;
	    console.log(layers);
	    //loop through and send to backend
	    var edits = new Array();
	    jQuery.each( layers, function(i, val){
	    	 edits.push(val[0]);
	    	 edits.push(val[1]);
	    	 edits.push(val[2]);
	    	 edits.push(val[3]);
	    } ) ;
	    console.log(edits);
	    zAu.send(new zk.Event(zk.Widget.$("$this"), 'onMoveWaypoint', edits));
	});
}


// function onFeatureSelect(feature) {
// selectedFeature = feature;
// if(zk.Widget.$("$wptToggle").isChecked()){
// var position = feature.geometry.getBounds().getCenterLonLat();
// var lonlat = map.getLonLatFromPixel(position);
// var wptLocation = lonlat.transform(chartProjection, screenProjection );
// zAu.send(new zk.Event(zk.Widget.$("$this"), 'onWaypoint', new
// Array(wptLocation.lat,wptLocation.lon,lat,lon,feature.attributes.name)));
// selectControl.unselect(selectedFeature);
// }
// }



//	
// //add waypoints
// map.events.register("click", map, function(e) {
// if(zk.Widget.$("$wptToggle").isChecked()){
// var position = this.events.getMousePosition(e);
//	          
// var lonlat = map.getLonLatFromPixel(position);
// var wptLocation = lonlat.transform(chartProjection, screenProjection );
//	    
// zAu.send(new zk.Event(zk.Widget.$("$map"), 'onWaypoint', new
// Array(wptLocation.lat,wptLocation.lon,lat,lon)));
// }
// });
//	
// //track map moving and zooming
// var followBoatCount =0;
// map.events.register("moveend", map, function() {
// if(followBoat){
// //increment count, we only save move event every 100 moves if we are
// following the boat
// if(followBoatCount>100){
// followBoatCount=0;
// }else{
// followBoatCount++;
// //outa here
// return;
// }
// }
// var chartLocation = map.getCenter().transform(chartProjection,
// screenProjection );
// zAu.send(new zk.Event(zk.Widget.$("$this"), 'onChartChange', new
// Array(chartLocation.lat,chartLocation.lon,map.getZoom())));
// });
//	
// //track layers
// map.events.register('changelayer', null, function(evt){
// if(evt.property === "visibility") {
// zAu.send(new zk.Event(zk.Widget.$("$this"), 'onLayerChange', new
// Array(evt.layer.name,evt.layer.visibility)));
// }
// });
//	
// var switcherControl = new OpenLayers.Control.LayerSwitcher();
// map.addControl(switcherControl);
// //switcherControl.maximizeControl();
//
// //set layer visibility
// var vis = zk.Widget.$("$layerVisibility").getValue().split(';');
// jQuery.each(vis, function(i, data) {
// var lyr = data.split("=");
// console.log(lyr);
// if(lyr[0].length>0){
// var curLayer=map.getLayersByName(lyr[0]);
// if(curLayer[0]!=null){
// if(lyr[1]==='false'){
// curLayer[0].setVisibility(false);
// }else{
// curLayer[0].setVisibility(true);
// }
// }
// }
// });
// //zoom to last pos and zoom
// map.zoomToExtent(mapBounds.transform(map.displayProjection, map.projection));
// map.moveTo(new
// OpenLayers.LonLat(zk.Widget.$("$firstLon").getValue(),zk.Widget.$("$firstLat").getValue()).transform(screenProjection,
// chartProjection));
// map.zoomTo(zk.Widget.$("$firstZoom").getValue());
// $("#noneToggle").checked = true;
//	
//	
// }
//

//
// // measurement
// function handleMeasurements(event) {
// var order = event.order;
// //convert to nautical miles
// var measure = event.measure * 0.539957;
//	
// var eOutput = zk.Widget.$("$output");
// var out = "";
// if (order == 1) {
// out += measure.toFixed(3) + " Nm";
// } else {
// out += measure.toFixed(3) + " Nm" + "<sup>2</sup>";
// }
// eOutput.setValue(out);
// }
//
// /*
// * toggles nav and measure mode
// */
// function toggleControl(cmd) {
// for (key in measureControls) {
// var control = measureControls[key];
// if (cmd == key ) {
// control.activate();
// } else {
// control.deactivate();
// }
// }
// }
//
//
//
// var eLat = null;
// var eLon = null;
function setPosition(llat, llon, brng, spd) {

	if (llat > 0) {
		eLat.setValue(llat.toFixed(5) + ' N');
	} else {
		eLat.setValue(Math.abs(llat.toFixed(5)) + ' S');
	}

	if (llon > 0) {
		eLon.setValue(llon.toFixed(5) + ' E');
	} else {
		eLon.setValue(llon.toFixed(5) + ' W');
	}
	shipMarker.setLatLng(new L.LatLng(llat, llon));
	shipMarker.setIconAngle(brng);
	
	// ref http://www.movable-type.co.uk/scripts/latlong.html
	var start_point = new L.LatLng(llat, llon);
	// //1852 meters in nautical mile
	//    
	var end_point = destVincenty(llat, llon, brng,	spd * 1852);
	var end_point2 = destVincenty(llat, llon, brng,	185200);
	hdgLayer.setLatLngs([start_point,end_point2]);
	bearingLayer.setLatLngs([start_point,end_point]);
	
}
//
// /*
// * Set the goto destination and draw the line
// */
function setGotoDestination(toLat, toLon, fromLat, fromLon) {
	// gotoLayer.removeAllFeatures();
	// //console.log("set goto"+toLat+","+toLon);
	// if(toLat!=null && toLon!=null){
	// //console.log("set goto");
	// var gotoStartPoint = new
	// OpenLayers.LonLat(fromLon,fromLat);//.transform(screenProjection,
	// chartProjection);
	// var gotoEndPoint = new OpenLayers.LonLat(toLon,toLat);
	//	    
	// gotoLayer.addFeatures([
	// new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([
	// new OpenLayers.Geometry.Point(gotoStartPoint.lon,
	// gotoStartPoint.lat).transform(screenProjection, chartProjection),
	// new
	// OpenLayers.Geometry.Point(gotoEndPoint.lon,gotoEndPoint.lat).transform(screenProjection,
	// chartProjection),
	// ]))
	// ]);
	// }
}
 /*
 * Center the boat in the screen at zoom=10
 */
function centerBoat(){
	 centerOnBoat=true;
	 map.panTo(new L.LatLng(lat, lon));
	 map.setZoom(10);
 }

 /*
 * toggle on/off follow boat mode
 */
 function followBoatPosition(){
	 followBoat=!followBoat;
 }

 /*
	 * Move the chart so the boat is centered. Called when follow boat = true
	 */
function moveToBoatPosition(llat, llon) {
	// every 10 moves
	if (followBoat && moveCount > 10) {
		moveCount = 0;
		map.panTo(new L.LatLng(lat, lon));
	} else {
		moveCount++;
	}
}
//
// /*
// * Add a point to the boat track, and draw to screen
// */
// function setTrack(llat, llon){
//	
// //add to tracks
// var trackPoint = new OpenLayers.Geometry.Point(llon, llat)
// .transform(screenProjection, chartProjection);
//    
//    
// if(trackLine==null){
// trackLine = new OpenLayers.Geometry.LineString(new Array(trackPoint,
// trackPoint));
// shipTrack.addFeatures([
// new OpenLayers.Feature.Vector(trackLine, {})
// ]);
// }else{
// trackLine.addPoint(trackPoint);
// shipTrack.redraw();
// trackCount++;
// }
// //simplify every 100 points
// if(trackCount>100){
// trackCount=0;
//
// //10 meters is 0.005 Nm, so we will use 20M for now
// trackLine=trackLine.simplify(0.2);
// shipTrack.removeAllFeatures();
// shipTrack.addFeatures([
// new OpenLayers.Feature.Vector(trackLine, {})
// ]);
// 
// }
// }
//
// /*
// * Reload the GPXTrack layer, then clear the Track layer to start again
// * Called every 5 minutes or so.
// */
// function refreshTrack(){
// tgpx.refresh();
// var trackPoints = shipTrack.features[0].geometry.getVertices();
// if(trackPoints.length>60){
// var tpPoint=trackPoints.slice[trackPoints.length-60,59];
// shipTrack.removeAllFeatures();
// trackLine = new OpenLayers.Geometry.LineString(tpPoint);
// shipTrack.addFeatures([
// new OpenLayers.Feature.Vector(trackLine, {})
// ]);
// }
// }
//
 /*
 * Refresh waypoints, called by server after adding/editing a waypoint
 */
 function refreshWaypoints(){
	 //remove if we have one
	 if(wgpxLayer)map.removeLayer(wgpxLayer);
	 var wpUrl = "http://'+window.location.host+':8080/freeboard/../tracks/waypoints.gpx"; // URL to your GPX file
		wgpxLayer = new L.GPX(wpUrl, {async: true}).on('loaded', function(e) {
		  map.fitBounds(e.target.getBounds());
		}).addTo(map);
 }
//
function ChartPlotter() {
	this.onmessage = function(mArray) {

		var setPos = false;
		jQuery.each(mArray, function(i, data) {

			// avoid commands
			if (data && data.indexOf('#') >= 0)
				return true;

			if (data && data.indexOf('LAT') >= 0) {
				var c = parseFloat(data.substring(4));
				if ($.isNumeric(c)) {
					lat = c;
					setPos = true;
				}
				c = null;
			}
			if (data && data.indexOf('LON') >= 0) {
				var c = parseFloat(data.substring(4));
				if ($.isNumeric(c)) {
					lon = c;
					setPos = true;
				}
				c = null;
			}
			if (data && data.indexOf('MGH') >= 0) {
				var c = parseFloat(data.substring(4));
				if ($.isNumeric(c)) {
					heading = c;
					setPos = true;
				}
				c = null;
			}
			if (data && data.indexOf('SOG') >= 0) {
				var c = parseFloat(data.substring(4));
				if ($.isNumeric(c)) {
					speed = c;
					setPos = true;
				}
				c = null;
			}
			if (data && data.indexOf('MGD') >= 0) {
				var c = parseFloat(data.substring(4));
				if ($.isNumeric(c)) {
					declination = c;
				}
				c = null;
			}
			if (data && data.indexOf('WPC') >= 0) {
				// we refresh the waypoint layer
				refreshWaypoints();
			}
			if (data && data.indexOf('WPG') >= 0) {
				var coords = data.substring(4);
				// console.log(coords);
				var coordsArray = coords.split('|');
				// console.log(coordsArray);
				// we refresh the goto layer
				if (coordsArray.length == 4) {
					// console.log("Setting goto =
					// "+coordsArray[0]+","+coordsArray[1]);
					setGotoDestination(parseFloat(coordsArray[0]),
							parseFloat(coordsArray[1]),
							parseFloat(coordsArray[2]),
							parseFloat(coordsArray[3]));
				} else {
					setGotoDestination(null, null, null, null);
				}
			}
			data = null;
		});
		if (setPos) {
			// avoid the 0,0 point
			if (lat < 0.001 && lat > -0.001 && lon < 0.001 && lon > -0.001)
				return;

			setPosition(lat, lon, heading + declination, speed);
			// setTrack(lat,lon);
			moveToBoatPosition(lat,lon);
		}
	};

}
function posInit() {
	addSocketListener(new ChartPlotter());
	eLat = zk.Widget.$("$posLat");
	eLon = zk.Widget.$("$posLon");
	// //reload track every 5 min so the local track doesnt get too long
	// setInterval("refreshTrack()",300000);
}

/*
 * ! JavaScript function to calculate the destination point given start point
 * latitude / longitude (numeric degrees), bearing (numeric degrees) and
 * distance (in m).
 * 
 * Original scripts by Chris Veness Taken from
 * http://movable-type.co.uk/scripts/latlong-vincenty-direct.html and optimized /
 * cleaned up by Mathias Bynens <http://mathiasbynens.be/> Based on the Vincenty
 * direct formula by T. Vincenty, “Direct and Inverse Solutions of Geodesics on
 * the Ellipsoid with application of nested equations”, Survey Review, vol XXII
 * no 176, 1975 <http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf>
 */
function toRad(n) {
	return n * Math.PI / 180;
};
function toDeg(n) {
	return n * 180 / Math.PI;
};
function destVincenty(lat1, lon1, brng, dist) {
	var a = 6378137, b = 6356752.3142, f = 1 / 298.257223563, // WGS-84
																// ellipsiod
	s = dist, alpha1 = toRad(brng), sinAlpha1 = Math.sin(alpha1), cosAlpha1 = Math
			.cos(alpha1), tanU1 = (1 - f) * Math.tan(toRad(lat1)), cosU1 = 1 / Math
			.sqrt((1 + tanU1 * tanU1)), sinU1 = tanU1 * cosU1, sigma1 = Math
			.atan2(tanU1, cosAlpha1), sinAlpha = cosU1 * sinAlpha1, cosSqAlpha = 1
			- sinAlpha * sinAlpha, uSq = cosSqAlpha * (a * a - b * b) / (b * b), A = 1
			+ uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))), B = uSq
			/ 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))), sigma = s
			/ (b * A), sigmaP = 2 * Math.PI;
	while (Math.abs(sigma - sigmaP) > 1e-12) {
		var cos2SigmaM = Math.cos(2 * sigma1 + sigma), sinSigma = Math
				.sin(sigma), cosSigma = Math.cos(sigma), deltaSigma = B
				* sinSigma
				* (cos2SigmaM + B
						/ 4
						* (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B
								/ 6 * cos2SigmaM
								* (-3 + 4 * sinSigma * sinSigma)
								* (-3 + 4 * cos2SigmaM * cos2SigmaM)));
		sigmaP = sigma;
		sigma = s / (b * A) + deltaSigma;
	};
	
	var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1, lat2 = Math
			.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f)
					* Math.sqrt(sinAlpha * sinAlpha + tmp * tmp)), lambda = Math
			.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma
					* cosAlpha1), C = f / 16 * cosSqAlpha
			* (4 + f * (4 - 3 * cosSqAlpha)), La = lambda
			- (1 - C)
			* f
			* sinAlpha
			* (sigma + C
					* sinSigma
					* (cos2SigmaM + C * cosSigma
							* (-1 + 2 * cos2SigmaM * cos2SigmaM))), revAz = Math
			.atan2(sinAlpha, -tmp); // final bearing
	var llat = toDeg(lat2);
	var llon = lon1 + toDeg(La);
	return new L.LatLng(llat, llon);
};
