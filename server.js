const http = require('http');
const url = require('url');
var config = require('./config');

require('mkdirp').sync('logs') // your log directory

var hostname = config.tkserver.hostname;
var port = config.tkserver.port;
var loglevel = config.tkserver.loglevel;

const log4js = require("log4js");

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    afile: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log' }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    whlistener: { appenders: ['afile'], level: loglevel }
  },
  pm2: true,
  pm2InstanveVar: 'INSTANCE_ID'
});


/**
 * Here is the Triskell webhook listener for ondemand
 * version : 1.02 
 * date    : 3/10/2021
 * author  : Vincent Cailleaud
 */
var server = http.createServer(function(req, res) {
	var page = url.parse(req.url).pathname;
	var dataObjectId = '';
	var dataObjectName = '';
	var user_name = '';
	var lastmodified = '';
	var result = '';
	result = 'HTTP/1.1 200 OK\r\n\r\n';
	
	if (page.includes('triskell') /*&& (req.connection.remoteAddress === '34.240.241.233' || req.connection.remoteAddress === '46.137.78.101'*/) {
		var cmd = page.split("/");
		let q = url.parse(req.url, true).query;
		
		var tenant_id = 0;
		var dateTime = require('node-datetime');
		var dt = dateTime.create();
		var formatted = dt.format('Ymd');
		
		if(typeof q.tenant != 'undefined') {
			tenant_id = q.tenant;
		} else if(typeof q.tenant_identifier != 'undefined') {
			tenant_id = q.tenant_identifier;
		}
		
		if (tenant_id) {
			const logger = log4js.getLogger("whlistener."+tenant_id+'.'+formatted);
			logger.level = loglevel;

			logger.debug(`Received URL: ${req.url}`);
			console.log(`Received URL: ${req.url}`);
			logger.debug(`from: ${req.socket.remoteAddress}`);
			console.log(`from: ${req.socket.remoteAddress}`);
			
			var extJS = require('./scripts/tkRulesLibrary.js');
			var tenantConfig = require('./config/'+tenant_id+'/index_'+tenant_id+'.js');

			let data = []
			// we can access HTTP headers
			req.on('data', chunk => {
				data.push(chunk)
			})

			req.on('end', () => {
				
				if(typeof data != 'undefined' && data.length > 0 ) {				
					const attr = JSON.parse(data);
					user_name = q.user_name;
					logger.debug(`---- Requestor: ${user_name}`);
					dataObjectName = attr.name;
					logger.debug(`---- on dataObjectName: ${dataObjectName}`);
					dataObjectId = attr.dataobjectId;
					logger.debug(`---- (dataObjectId: ${dataObjectId})`);
					lastmodified = attr.lastmodified;
					logger.debug(`---- (at: ${lastmodified})`);
				}
				
				//Tenant test vca
				if (tenant_id === '915') {
					if (cmd[2] === 'HTMLtest') {
						if(typeof q.execution_identifier != 'undefined') {
							extJS.login(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.password, 
								function(err, response) {
									const authash = response[0];
									const jsessionid = response[1];
									console.log('authash : ' + authash);
									console.log('jsessionid : ' + jsessionid);
									
									extJS.GetRequestIdentifierData(tenantConfig.triskell.server, tenantConfig.triskell.login, authash, jsessionid, q.execution_identifier, logger, 
										function() {
											extJS.executeStoredSelector(tenantConfig.triskell.server, tenantConfig.triskell.login, tenantConfig.triskell.token, 12, "", logger, 
											function(err, response2) {
												//
												if (response2.data.res[0]) {
													var data = response2.data.res[0].x;
												}
												
												//Google chart test
												var html1 = `<html>
															<head>
															<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
															<script type="text/javascript">
																google.charts.load('current', {'packages':['corechart']});
																google.charts.setOnLoadCallback(drawChart);
														
																function drawChart() {
														
																var data = google.visualization.arrayToDataTable([
																	['Task', 'Hours per Day'],
																	['Work',     11],
																	['Eat',      2],
																	['Commute',  2],
																	['Watch TV', 2],
																	['Sleep',    7]
																]);
														
																var options = {
																	title: 'My Daily Activities'
																};
														
																var chart = new google.visualization.PieChart(document.getElementById('piechart'));
														
																chart.draw(data, options);
																}
															</script>
															</head>
															<body>
															<div id="piechart" style="width: 900px; height: 500px;"></div>
															</body>
														</html>
														`;


												

												

												//tree boxes test
												var html2 = `<!doctype html>
															<html>
															<head>
																<meta charset="utf-8">
																<title>D3.js collapsible tree with boxes</title>
																<meta name="description" content="">
																<meta name="viewport" content="width=device-width">
																<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vcailleaud/Orange-OKRtree@1.0.0/styles/okrtree.css">
															
																<script src="https://cdn.rawgit.com/eligrey/canvas-toBlob.js/f1a01896135ab378aa5c0118eadd81da55e698d8/canvas-toBlob.js"></script>
																<script src="https://cdn.rawgit.com/eligrey/FileSaver.js/e9d941381475b5df8b7d7691013401e171014e89/FileSaver.min.js"></script>
																<script src="https://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
																<script src="https://d3js.org/d3.v3.min.js" type="text/javascript"></script>
																<script src="https://cdn.jsdelivr.net/gh/vcailleaud/Orange-OKRtree@1.0.0/scripts/okrtree.js"></script>
															</head>
															<body>
																<button id='saveButton'>Export to PNG</button>
																<div class="container">
																	<ct-visualization id="tree-container"></ct-visualization>  
																	<script>
																		var width = 300, height = 300;

																		var data= `+data+`;
            															treeBoxes('', data.tree);
																	</script>
																</div>
															</body>
															</html>`;
												
												
												res.writeHead(200,{'Content-Type': 'text/html'});
												res.write(html2);
												res.end();
												console.log('OK');
												}
											)
										} 
									)
								}
							)
							
						} else {
							console.log(new Date().toISOString()+ ' - ' + 'GetRequestIdentifierData error');
							console.log(req.url);
							result = 'HTTP/1.1 500 KO\r\n\r\n';
							res.writeHead(200, null);
							res.end(result);
						}
					} else {
						console.log(new Date().toISOString()+ ' - ' + 'Bad request! : Wrong service');
						console.log(req.url);
						result = 'HTTP/1.1 500 KO\r\n\r\n';
						res.writeHead(200, null);
						res.end(result);
					}
				} else {
						console.log(new Date().toISOString()+ ' - ' + 'Bad request! : Wrong tenant');
						console.log(req.url);
						result = 'HTTP/1.1 500 KO\r\n\r\n';
						res.writeHead(200, null);
						res.end(result);
					}
			})
			
			//X
		} else {
			console.log(new Date().toISOString()+ ' - ' + 'Bad request! : Missing tenant identifier');
			console.log(req.connection.remoteAddress);
			console.log(req.url);

			res.writeHead(200, null);
			res.write('HTTP/1.1 500 KO\r\n\r\n');
			res.end();
		}
	} else {
		console.log(new Date().toISOString()+ ' - ' + 'Bad request!');
		console.log(req.connection.remoteAddress);
		console.log(req.url);
		
		res.writeHead(200, null);
		res.write('HTTP/1.1 500 KO\r\n\r\n');
		res.end();
	}
});

function format1(n, currency) {
  return currency + n.toFixed(2).replace(/./g, function(c, i, a) {
    return i > 0 && c !== "." && (a.length - i) % 3 === 0 ? " " + c : c;
  });
}

server.timeout = 0; //Set to 0 to disable any kind of automatic timeout behavior on incoming connections.

server.listen(port, hostname, () => {
  console.log(new Date().toISOString()+ ' - ' + `Server running at http://${hostname}:${port}/`);
});

process.on('uncaughtException', function (err) {
  console.log(new Date().toISOString()+ ' - ' + 'Caught exception: ' + err.stack);
});


