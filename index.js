"use strict";

var evh = require('express-vhost'),
    express = require('express'),
    colors = require('colors'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    YAML = require('js-yaml'),
    async = require('async'),
    url = require('url'),
    port = 9001;

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var hosts = fs.readFileSync(__dirname + '/VirtualHosts.yaml','utf8');
var RESTVerbs = ['GET','POST','DELETE','PUT','PATCH','OPTION'];

try {
	hosts = YAML.safeLoad(hosts);
} catch(e) {
	console.log("Syntax error in VirtualHosts.yaml".error);
	return;
}

var createRestDirectoryStructure = function (service, routeName) {
	var basePath = __dirname + '/Api';
	async.each(RESTVerbs, function(verb,index) {

		var dStructure = basePath + '/' + service + '/' + routeName + '/' + verb;
		if(fs.existsSync(dStructure))
			return;

		mkdirp(dStructure, function (err) {
	    if (err) console.error(err);
	    else console.log(dStructure.toString().data + ' created!')
		});

	}, function(err){
    // if any of the saves produced an error, err would equal that error
    console.error("An error during creating the file structure".error)
	});
};

var RestFactory = function(rootDir, routes) {
    	var app = express();
    	//To deliver static files
    	app.use('/static', express.static(__dirname + '/public'));
    	app.use(function(req, res, next) {
    	var method = req.method;
    	var answered = false;
    	//Info about method and url
    	console.log(method.info + '\tRequest to -> ' + req.originalUrl.toString().data);
    	//Iterate through html verbs
	    for (var verb in routes) {
		  	if(method == verb) {
			  	routes[verb].every(function (item, index) {
			  				//Url matching
			  				var requestedUrl = url.parse(req.originalUrl).pathname;
			  				if(requestedUrl == item.url) {

			  					res.type('application/json');
			  					var jsonFile = __dirname + '/Api/' + rootDir + '/' + item.routeName +  '/' + method + "/" + item.ressource;
			  					//Check if the requested ressource exists
			  					fs.exists(jsonFile, function (exists) {

			  						if(exists) {

					  						//Read the requested ressource
					  						fs.readFile(jsonFile, { encoding : 'utf8' }, function (err, fileData) {

					  								if(err) console.error(err.toString().error);
					  								//Buffer to String
					  								var data = fileData;
					  								var jsonData = '';

					  								//YAML format?
					  							  if(data.indexOf("---")===0) {
						  							  try {
						  									jsonData = YAML.safeLoad(data);
						  								} catch(e) {
						  									res.send("Syntax error in " + jsonFile);
						  									console.error("Syntax error in ".error + jsonFile.data);
						  									return false; //break the loop to find the right route
						  								}
						  								res.send(jsonData);
					  								}
					  								else {
					  									try {
					  										//Parse to JSON
					  										jsonData = JSON.parse(data);
					  									}
					  									catch (e) {
					  										res.send("Syntax error in " + jsonFile);
					  										console.error("Syntax error in ".error + jsonFile.data);
					  										return false; //break the loop to find the right route
					  									}

					  									res.send(jsonData);
					  								}

					  						});

					  						return false; //break the loop to find the right route

			  					}
			  					else { //If file not exists
			  						res.type('text/html');
			  						res.status(404).sendfile('public/html/404-ressource.html');
										var errMsg = "No JSON file at " + jsonFile + " specified!";
										console.log("\n" + "404 ".error + '\t' + errMsg);
										return false; //break the loop to find the right route
			  					}

			  				});
			  					//Log some informations
			  					console.log('\t'+item.name.toString().help);
			  					console.log("\tAnswered with ressource " + item.ressource.toString().data + "\n");
			  					answered = true;
			  			  }

			  			  return true; //Continue the loop
			  	});
		  	}
			}
			//Display info when no route could be founded
			if(answered == false) {
				res.status(404).sendfile('public/html/404-route.html');
				var errMsg = "404 ".error + '\t' + 'Method: '+ method + ' , Url: ' + req.originalUrl + ' - This route was not defined!\n';
				console.log(errMsg);
			}
    });

    return app;
};

var myArgs = process.argv.slice(2);
var cmd = myArgs[0] ;
var service = myArgs[1];

var server = express();
server.use(evh.vhost());
server.listen(port);

hosts.forEach(function (vHost, index) {
		var routes = vHost.routes;
		var hostname = vHost.host;
		console.info('Start VirtualHost ['+ hostname.toString().info + '] - ' + vHost.description.toString().help);

		var allRoutes = {};
		for (var routeName in routes) {
			var routeName = routeName;
			//Create file structure
			createRestDirectoryStructure(hostname,routeName);

			routes[routeName].forEach(function(r,ri) {
					RESTVerbs.forEach(function(verb,vi) {
						if(routes[routeName][ri][verb]) {
							//give all routes the routName
							routes[routeName][ri][verb].forEach(function(sR) {
									sR['routeName'] = routeName;
							});
							if(!(allRoutes[verb] instanceof Array)){
								allRoutes[verb] = [];
								allRoutes[verb] = allRoutes[verb].concat(routes[routeName][ri][verb]);
							}
							else {
								allRoutes[verb] = allRoutes[verb].concat(routes[routeName][ri][verb]);
							}
						}
					});
			});

		}
		//Register Virtul host
		evh.register(hostname, RestFactory(hostname, allRoutes));
});