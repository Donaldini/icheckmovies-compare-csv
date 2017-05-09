"use strict";

// Globale variabelen --------------------------------------------- //
var films = [];
var users = [];				// Lijst met de checks van alle users

var filmNotset = true;		// Checken of de filminfo ingeladen is
var aantalfiles = 0;		// Aantal files dat we zullen inladen
var forcedUsers = {};		// Deelnemers die zéker de film gezien moeten hebben
// ---------------------------------------------------------------- //

// Toggle button voor de ongeziene films
$( "input[name=notseen]" ).change(function() {
	//console.log( "Handler for .change() called." );
	//$('tr:has(td.checked)').toggle();
	renderOutput();
});

$(function() {
	var userRange = $('#user-range');
	var userRangeValue = $('#user-range-value');
	
	var onRangeChange = function(){
		userRangeValue.text(this.value);
		if ($('#seen-filter')[0].checked) {
			renderOutput();
		}
	};
	
	userRange.on("input", onRangeChange);
	userRange.change("input", onRangeChange);
});

function handleFiles(files) {
	// Check for the various File API support.
	if (window.FileReader) {
		// FileReader are supported.
		var bestand;
		aantalfiles = files.length;

		$('#user-range').attr('max', aantalfiles);
		
		for(var i=0; i < files.length; i++){
			bestand = files[i];
	   
			//console.log("["+i+"] Binnenhalen van bestand");
	   
			// Handle errors load
			//console.log("filename "+files[i].name);
			var username = files[i].name.replace('top+250-','');
			username = username.replace('.csv','');
			//console.log("["+i+"] Filehandler " + username);
 
			initReader(bestand,username);
		}
			
	} else {
		alert('FileReader are not supported in this browser.');
	}
}

function initReader(file, username) {
        var reader = new FileReader();
 
        reader.onload = function(e) {
                loadHandler(e,username)
                //console.log("Filehandler doorgeven " + username);
        };
       
        reader.onerror = errorHandler;
        reader.onloadend = finishedHandler;
        reader.readAsText(file,"ISO-8859-1");
}

function loadHandler(event,username) {
	var csv = event.target.result;
	//console.log("loadHandler " + username);
	//console.log("csv " + csv);
	processData(csv, username);             
}

function finishedHandler(event) {
	aantalfiles -= 1;
	
	if(aantalfiles == 0){
		//console.log("All files loaded;");
		renderOutput();
	}
	           
}

function processData(csv,username) {
    var allTextLines = csv.split(/\r\n|\n/);
    var lines = [];
    while (allTextLines.length) {
        //lines.push(allTextLines.shift().split(','));
        lines.push(splitter(allTextLines.shift()));
    }
    
    var user = new Object();
    user.name = username;
    
    var userfilms = [];
    
    for (var i = 0; i < lines.length; i++) {
		
		if(filmNotset){
		
			var film = new Object();		
			film.rank = lines[i][0];
			film.rankdifference = lines[i][1];
			film.title = lines[i][2];
			film.year = lines[i][3];
			film.url = lines[i][4];
			film.checkedcount = lines[i][5];
			film.favouritecount = lines[i][6];
			film.dislikedcount = lines[i][7];
			film.officialtoplistcount = lines[i][8];
			film.usertoplistcount = lines[i][9];
			film.akatitle = lines[i][10];
			film.imdburl = lines[i][11];
		
			films.push(film);		
		}
			
		// Persoonlijke userinfo
		
		var userfilm = new Object();
		//console.log("userchecks maken");
		userfilm.name = username;
		userfilm.title = lines[i][2];
		userfilm.checked = lines[i][12];
		userfilm.favorite = lines[i][13];
		userfilm.disliked = lines[i][14];
		userfilm.watchlist = lines[i][15];
		userfilm.owned = lines[i][16];
		
		userfilms.push(userfilm);
	}
	
	user.films = userfilms;
	users.push(user);
	filmNotset = false;
	
	//drawOutput(lines);
	generateForceFilter();
	
}

function splitter(str) {
    var quoted = false;
    var result = new Array();
    var currString = "";
    
    for (var i = 0, len = str.length; i < len; i++) {
        if (str[i] == "\""){
            quoted = !quoted;
        } else if (str[i] == "," && !quoted) {
            //New split
            result.push(currString);
            currString = "";
        } else {
            currString += str[i]
        }
    }
    if (currString != "");
        result.push(currString);
        
    return result;
}

function errorHandler(evt) {
	if(evt.target.error.name == "NotReadableError") {
		alert("Cannot read file!");
	}
}

function renderOutput(){
	
	document.getElementById("output").innerHTML = '';
	
	var mayBeSeenBy = $('#user-range').val();
	if (mayBeSeenBy === '') {
		mayBeSeenBy = 0;
	} else {
		mayBeSeenBy = parseInt(mayBeSeenBy);
	}
	var filtermayBeSeenBy = $('#seen-filter')[0].checked;
	
	var output = "<table>";
	output += "<thead>";
	var film;
	
	var user_index_mapping = {};
	
	for (var i = 0; i<films.length-1; i++) {	
		film = films[i];
		
		if(i==0){
			output += "<tr>";
			// Eerste lijn is de header
			output += "<th>" + film.rank + "</th>";
			output += "<th></th>";
			output += "<th></th>";
			output += "<th>" + film.title + "</th>";
			
			// Voor elke user een kolom met checks
			for (var j = 0; j < users.length; j++) {
				output += "<th>" + users[j].name + "</th>";
				user_index_mapping[users[j].name] = j;
			}
			
			output += "</thead>";
			output += "<tbody>";
			output += "</tr>";
		} else {
		
			if (filtermayBeSeenBy) {
				var seenBy = 0;
				for (var j = 0; j < users.length; j++) {
					var userfilm = users[j].films[i];
					if (userfilm.checked != 'no') {
						++seenBy;
					}
				}
				
				if (seenBy > mayBeSeenBy) {
					continue;
				}
			}
			
			//Check forced users
			var skip = false;
			for (var username in forcedUsers) {
				if (forcedUsers[username]) {
					if (users[user_index_mapping[username]].films[i].checked === 'no') {
						skip = true;
						break;
					}
				}
			}
			if (skip) {
				continue;
			}
		
			output += "<tr>";
			// Basisinfo over film
			output += "<td>" + film.rank + "</td>";
			output += "<td><a href='" + film.imdburl + "' style='border: none;' target='_blank'><img src='images/imdb.png' /></a></td>";
			output += "<td><a href='" + film.url + "' style='border: none;' target='_blank'><img src='images/icm.png' /></a></td>";
			output += "<td><a href='" + film.imdburl + "' target='_blank'>" + film.title + " (" + film.year + ")</a></td>";
		
			// Voor elke user een kolom met checks
			for (var j = 0; j < users.length; j++) {
			
				var userfilm;
								
				userfilm = users[j].films[i];
			
				var klasse = "";
				var title = "";
		
				if(userfilm.checked != "no"){
					klasse = "checked";
		
					var datum = userfilm.checked
					title = "Deze film heb je gezien op " + userfilm.checked;
				} else {
					klasse = "unchecked";
					title = "Nog niet gezien, vlug kijken!";
				}
	
				output += "<td class='" + klasse + "' title='" + title + "'>" + userfilm.checked + "</td>";	
			}
				
			output += "</tr>";
		}
	}		
	output += "</tbody>";
	output += "</table>";
	document.getElementById("output").innerHTML = output;
	
	// Tonen van options
	$("#options").css("display","block");
	
	// Instellen van tablefunctions
	//$('#output table').DataTable({
	//	paging:false
	//});
	
	//var table = $('#output table').DataTable();
    //new $.fn.dataTable.FixedHeader(table);
}

function generateForceFilter() {
	var filterElement = $('#force-filter').empty();

	for (var j = 0; j < users.length; j++) {
		var closure = function() {

			var innerComponent = document.createElement('div');
			var username = users[j].name;
			
			var checkbox = document.createElement('input');
			checkbox.setAttribute('type', 'checkbox');
			checkbox.setAttribute('name', username);
			checkbox.setAttribute('id', username);
			innerComponent.appendChild(checkbox);
			
			$(checkbox).change(function(event) {
				var checkbox = event.target;
				forcedUsers[username] = checkbox.checked;
				
				renderOutput();
			});

			var label = document.createElement('label');
			label.setAttribute('for', username);
			label.innerHTML = username;
			innerComponent.appendChild(label);
			
			filterElement.append(innerComponent);
		};
		closure();
	}
}

$(document).ready(function() {
	$(".fancybox").fancybox({
		openEffect	: 'none',
		closeEffect	: 'none'
	});
});