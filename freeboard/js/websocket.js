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
var _ws;
var wsList = [];
var popped = false;

function addSocketListener(l){
	//is it already there, if so remove it
	$.each(wsList, function(i){
	    if(wsList[i].constructor === l.constructor) wsList.splice(i,1);
	});
	//add new
	wsList.push(l);
	
}

function initSocket(){
	//make a web socket
	if(this._ws == null) {
	
			var location = "ws://"+window.location.hostname+":9090/navData";
			//alert(location);
			
			this._ws = new WebSocket(location);
			this._ws.onopen = function() {
			};
			this._ws.onmessage = function(m) {
				//for debug
				//console.log(m.data);
				//iterate the array and process each, avoid NMEA for now
				if(m.data.trim().startsWith('$'))return;
				
				//TODO: Note memory leak in native websockets code  - https://code.google.com/p/chromium/issues/detail?id=146304
				
				var mArray=m.data.trim().split(",");
				jQuery.each(wsList, function(i, obj) {
				      obj.onmessage(mArray);
				  });
				//mArray=null;
				m=null;
			};
			this._ws.onclose = function() {
				this._ws = null;
			};
			this._ws.onerror = function(error) {
				popped = true;
				alert('Cannot connect to Freeboard server');
				popped=false;
			}
 
	}
}

function reloadSocket(){
	if(this._ws != null)this._ws.close();
	this._ws = null;
	if(!popped){initSocket();
		console.log("Reloaded..");
	}
}

setInterval(function(){reloadSocket()},30000);

