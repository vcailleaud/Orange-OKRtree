const https = require('https');
const xml2js = require('xml2js');

/**
 * Here are Triskell functions
 * version : 1.10 
 * date    : 4/16/2020
 * author  : Vincent Cailleaud
 */
var methods = {
	
	/**
	 * Login to Triskell
	 */
	login: function (server, login, password, callback) {
		const body = JSON.stringify({
			  "user":login,
			  "password":password
		})

		const options = {
		  hostname:  server,
		  port: 443,
		  path: '/triskell/service/rest/loginJson',
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
			'Content-Length': body.length
		  }
		}
		
		const request = https.request(options, (res) => {
			var cookie = res.headers['set-cookie'] + '';			
			var authash = '';
			var jsessionid = '';
			
			var arr = cookie.split(";").map(s => s.trim()).filter(Boolean);
			arr.forEach(function(value){
				if (value.includes('authash')) {
					authash = value.split('=')[1];
				} else if (value.includes('JSESSIONID')) {
					jsessionid = value.split('=')[1];
				}
			});
			callback(null, [authash, jsessionid]);
				
			
		})

		request.on('error', (error) => {
			console.error(error)
		})

		request.write(body)
		request.end()
	},

	/**
	 * Logout Triskell
	 */
	logout: function (server) {
	  
		https.get('https://'+server+'/triskell/service/rest/logout', (resp) => {
			console.log(`logout statusCode: ${resp.statusCode}`)
		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	},

	/**
	 * Run stored selector
	 */
	executeStoredSelector: function (server, login, token, storedSelectorId, parameters, logger, callback) {
		//'use strict';
		
		var body = JSON.stringify({
			'id' : 0, 
			'params' : {
				"STORED_SELECTOR_ID": storedSelectorId.toString(), 
				"valuesByParams": parameters.toString()
		  } , 
		  'objects' : null 
		});
			
		let buff = new Buffer.from(body);
		let base64data = buff.toString('base64');
		var uri = '/triskell/service/rest/proxy/operation/execute/ReportService/GetData/'+base64data;
		var response = "";

		var options = {
		  hostname:  server,
		  port: 443,
		  path: uri,
		  method: 'GET',
		  headers: {
			'X-Account-Name': login,
			'X-API-Key': token,
			'Content-Length': response.length
		  }
		}

		var nretry = -1;
		var maxretry = 5;
		
		retry = function() {
			nretry++;
					
			logger.debug('executeStoredSelector.server : ' + server);
			logger.debug('executeStoredSelector.uri : ' + uri);
			logger.debug('executeStoredSelector.body : ' + body.toString());
			
			var req = https.request(options, function(res) {
				res.setEncoding('utf8');
				
				var data;
				res.on('data', function(chunks) {
					if (!data) {
						data = chunks;
					} else {
						data += chunks;
					}
				}).on("end", function() {
					const response = JSON.parse(data);
					logger.debug('executeStoredSelector.response : ' + data);
					if (response.success) {
						logger.debug("executeStoredSelector " + " Try(" + nretry + "): " + "success");
						callback(null, response);
					} else {
						logger.debug("executeStoredSelector Id:" + storedSelectorId.toString() + ", Try(" + nretry + "): " + response.message);
						console.log(new Date().toISOString()+" - executeStoredSelector Id:" + storedSelectorId.toString() + ", Try(" + nretry + "): " + response.message);
						if(nretry >= maxretry){
							callback(response, null);
						} else {
							setTimeout(retry, 2000, nretry);
						}
					}
				});
			});
			
			// write data to request body
			req.write(body);
			req.end();

			req.on('error', function(e) {
				logger.debug('problem with the request: ' + e.message);
				console.log(new Date().toISOString()+' - problem with the request: ' + e.message);
			});
		}
		retry(0);
	},
	
	/**
	 * Set Dataobject attributes )
	 */
	updateDataobject: function (server, login, token, dataObjectId, body, logger, callback) {
		//'use strict';
		let buff = new Buffer.from(body);
		let base64data = buff.toString('base64');
		var uri = '/triskell/service/rest/proxy/operation/execute/CustomAttrPanelAS/CustomAttrPanelPutValues/';
		var response = '';

		var options = {
		  hostname:  server,
		  port: 443,
		  path: uri+base64data,
		  method: 'GET',
		  headers: {
			'X-Account-Name': login,
			'X-API-Key': token,
			'Content-Length': response.length
		  }
		}
		
		var nretry = -1;
		var maxretry = 5;
		
		retry = function() {
			nretry++;
			
			logger.debug('updateDataobject.server : ' + server);
			logger.debug('updateDataobject.uri : ' + uri);
			logger.debug('updateDataobject.body : ' + body.toString());
		
			var req = https.request(options, function(res) {

			  res.setEncoding('utf8');
			  res.on('data', function (chunk) {
				response = JSON.parse(chunk);
				logger.debug('updateDataobject.response : ' + chunk);
				logger.debug('updating dataobject: ' + dataObjectId.toString() + ', success: ' + response.success + ', message: ' + response.message);
				if (response.success) {
					logger.debug("updateDataobject " + " Try(" + nretry + "): " + "success");
					callback(null, response.success);
				} else {
					console.log(new Date().toISOString()+" - updateDataobject Id:" + dataObjectId.toString() + ", Try(" + nretry + "): " + response.message);
					logger.debug("updateDataobject Id:" + dataObjectId.toString() + ", Try(" + nretry + "): " + response.message);
					if(nretry >= maxretry){
						callback(response, null);
					} else {
						setTimeout(retry, 2000, nretry);
					}
				}
			  });
			});

			req.on('error', function(e) {
			  console.log(new Date().toISOString()+' - problem with the request: ' + e.message);
			  logger.error('problem with the request: ' + e.message);
			});
			
			// write data to request body
			req.write(body);
			req.end();
		}
		retry(0);
	},
	
	/*
	 * AddTimephasedItem
	 */
	AddTimephasedItem: function (server, login, token, body, logger, callback) {
		//'use strict';
		/*
		{
		  'id' : 0  , 
		  'params' : {
			"dataObjectId":"12697", 
			"attrId":"586",
			"versionId": "138",
			"ATTRID_584" : "2357"
		  } , 
		  'objects' : null 
		}

		*/
		if(body) {
			let buff = new Buffer.from(body);
			let base64data = buff.toString('base64');
			
			var uri = '/triskell/service/rest/proxy/operation/execute/TimephasedAttributeAS/AddTimephasedItem/'+base64data;

			var response = "";

			var options = {
			  hostname:  server,
			  port: 443,
			  path: uri,
			  method: 'GET',
			  headers: {
				'X-Account-Name': login,
				'X-API-Key': token,
				'Content-Length': response.length
			  }
			}
			
			var nretry = -1;
			var maxretry = 5;
			
			retry = function() {
				nretry++;
				
				logger.debug('AddTimephasedItem.server : ' + server);
				logger.debug('AddTimephasedItem.uri : ' + uri);
				logger.debug('AddTimephasedItem.body : ' + body.toString());
			
				var req = https.request(options, function(res) {
					res.setEncoding('utf8');
					
					var data;
					res.on('data', function(chunks) {
						if (!data) {
							data = chunks;
						} else {
							data += chunks;
						}
					}).on("end", function() {
						const response = JSON.parse(data);
						logger.debug('AddTimephasedItem.response : ' + data);
						if (response.success) {
							logger.debug("AddTimephasedItem " + " Try(" + nretry + "): " + "success");
							callback(null, response.data[0].timephasedItemId);
						} else {
							console.log(new Date().toISOString()+" - AddTimephasedItem " + " Try(" + nretry + "): " + response.message);
							logger.debug("AddTimephasedItem " + " Try(" + nretry + "): " + response.message);
							if(nretry >= maxretry){
								callback(response, null);
							} else {
								setTimeout(retry, 2000, nretry);
							}
						}
					});
				});
				
				// write data to request body
				req.write(body);
				req.end();

				req.on('error', function(e) {
					console.log(new Date().toISOString()+' problem with the request: ' + e.message);
					logger.error('problem with the request: ' + e.message);
				});
			}
			retry(0);
		}
	},
	
	/*
	 * SaveTimephasedData
	 */
	SaveTimephasedData: function (server, login, token, body, logger, callback) {
		//'use strict';
		/*
		{
		  'id' : 0  , 
		  'params' : {
			"dataObjectId":"12697",
			"attrId":"586",
			"versionId": "138",
			"ID" : "1128016",
			"PERIODID": "14100",
			"UNITS": "15.00",
			"unitsId" : "1"
		  } , 
		  'objects' : null 
		}

		*/
		if(body) {
			let buff = new Buffer.from(body);
			let base64data = buff.toString('base64');
			
			var uri = '/triskell/service/rest/proxy/operation/execute/TimephasedAttributeAS/SaveTimephasedData/'+base64data;

			var response = "";

			var options = {
			  hostname:  server,
			  port: 443,
			  path: uri,
			  method: 'GET',
			  headers: {
				'X-Account-Name': login,
				'X-API-Key': token,
				'Content-Length': response.length
			  }
			}
			
			var nretry = -1;
			var maxretry = 5;
			
			retry = function() {
				nretry++;
				
				logger.debug('SaveTimephasedData.server : ' + server);
				logger.debug('SaveTimephasedData.uri : ' + uri);
				logger.debug('SaveTimephasedData.body : ' + body.toString());
			
				var req = https.request(options, function(res) {
					res.setEncoding('utf8');
					
					var data;
					res.on('data', function(chunks) {
						if (!data) {
							data = chunks;
						} else {
							data += chunks;
						}
					}).on("end", function() {
						const response = JSON.parse(data);
						logger.debug('SaveTimephasedData.response : ' + data);
						if (response.success) {
							logger.debug("SaveTimephasedData " + " Try(" + nretry + "): " + "success");
							callback(null, response);
						} else {
							console.log(new Date().toISOString()+" - SaveTimephasedData " + " Try(" + nretry + "): " + response.message);
							logger.debug("SaveTimephasedData " + " Try(" + nretry + "): " + response.message);
							if(nretry >= maxretry){
								callback(response, null);
							} else {
								setTimeout(retry, 2000, nretry);
							}
						}
					});
				});
				
				// write data to request body
				req.write(body);
				req.end();

				req.on('error', function(e) {
					console.log(new Date().toISOString()+' problem with the request: ' + e.message);
					logger.error('problem with the request: ' + e.message);
				});
			}
			retry(0);
		}
	},
	
	/*
	 * SaveAttachment
	 */
	SaveAttachment: function (server, authash, jsessionid, body, logger, callback) {
		//'use strict';
		
		//console.log(body);
		if(body) {
			var uri = '/triskell/service/rest/proxy/operation/execute/AttachmentsAS/SaveAttachment';

			var options = {
			  hostname:  server,
			  port: 443,
			  path: uri,
			  method: 'POST',
			  headers: {
				'Cookie': "authash="+ authash + "; JSESSIONID=" + jsessionid,
				'Content-Length': Buffer.byteLength(body),
				'Content-Type':'application/json'
			  }
			}
			
			var nretry = -1;
			var maxretry = 5;
			//console.log(options);
			retry = function() {
				nretry++;
				
				logger.debug('SaveAttachment.server : ' + server);
				logger.debug('SaveAttachment.uri : ' + uri);
				logger.debug('SaveAttachment.body : ' + body.toString());
			
				var req = https.request(options, function(res) {
					res.setEncoding('utf8');
					
					var data;
					res.on('data', function(chunks) {
						if (!data) {
							data = chunks;
						} else {
							data += chunks;
						}
					}).on("end", function() {
						//console.log(data);
						const response = JSON.parse(data);
						logger.debug('SaveAttachment.response : ' + data);
						if (response.success) {
							logger.debug("SaveAttachment " + " Try(" + nretry + "): " + "success");
							callback(null, response);
						} else {
							console.log(new Date().toISOString()+" - SaveAttachment " + " Try(" + nretry + "): " + response.message);
							logger.debug("SaveAttachment " + " Try(" + nretry + "): " + response.message);
							if(nretry >= maxretry){
								callback(response, null);
							} else {
								setTimeout(retry, 2000, nretry);
							}
						}
					});
				});
				
				// write data to request body
				req.write(body);
				req.end();

				req.on('error', function(e) {
					console.log(new Date().toISOString()+' problem with the request: ' + e.message);
					logger.error('problem with the request: ' + e.message);
				});
			}
			retry(0);
		}
	},
	
	/*
	 * GetRequestIdentifierData
	 */
	GetRequestIdentifierData: function (server, login, authash, jsessionid, request_identifier, logger, callback) {
		//'use strict';
		/*
		{
			'id' : 0  , 
			'params' : {
				"request_identifier":"541B219E9629D831F8F5D7F203940C8C"
			} , 
			'objects' : null 
		}


		*/
		var body = JSON.stringify({
			'id' : 0, 
			'params' : {
				"request_identifier": request_identifier.toString()
		  } , 
		  'objects' : null 
		});
		
		if(body) {
			
			var uri = '/triskell/service/rest/proxy/operation/execute/ExternalEmbeddedPanelService/GetRequestIdentifierData';

			var response = "";

			var options = {
			  hostname:  server,
			  port: 443,
			  path: uri,
			  method: 'POST',
			  headers: {
				'Cookie': "authash="+ authash + "; JSESSIONID=" + jsessionid,
				'Content-Length': Buffer.byteLength(body),
				'Content-Type':'application/json'
			  }
			}
			
			var nretry = -1;
			var maxretry = 5;
			
			retry = function() {
				nretry++;
				
				logger.debug('GetRequestIdentifierData.server : ' + server);
				logger.debug('GetRequestIdentifierData.uri : ' + uri);
				logger.debug('GetRequestIdentifierData.body : ' + body.toString());
			
				var req = https.request(options, function(res) {
					res.setEncoding('utf8');
					
					var data;
					res.on('data', function(chunks) {
						if (!data) {
							data = chunks;
						} else {
							data += chunks;
						}
					}).on("end", function() {
						const response = JSON.parse(data);
						logger.debug('GetRequestIdentifierData.response : ' + data);
						if (response.success) {
							console.log(new Date().toISOString()+" - GetRequestIdentifierData " + " Success : " + response.message);
							logger.debug("GetRequestIdentifierData " + " Try(" + nretry + "): " + "success");
							callback(null, response);
						} else {
							console.log(new Date().toISOString()+" - GetRequestIdentifierData " + " Try(" + nretry + "): " + response.message);
							logger.debug("GetRequestIdentifierData " + " Try(" + nretry + "): " + response.message);
							if(nretry >= maxretry){
								callback(response, null);
							} else {
								setTimeout(retry, 2000, nretry);
							}
						}
					});
				});
				
				// write data to request body
				req.write(body);
				req.end();

				req.on('error', function(e) {
					console.log(new Date().toISOString()+' problem with the request: ' + e.message);
					logger.error('problem with the request: ' + e.message);
				});
			}
			retry(0);
		}
	},
	
	/*
	 * createDataobject
	 */
	createDataobject: function (server, authash, jsessionid, objectName, dataobjectName, description, stage, pool, parentid, currency, attributes, childs, logger, callback) {
		//'use strict';
		/*
		{
		 <object>BSR</object>
		<name>C</name>
		<description>D</description>
		<stage>Active</stage>
		<pool>OWN</pool>
		<parentid>9247</parentid>
		<currency>5</currency>
		}

		*/
		//	const parser = new xml2js.Parser({ attrkey: "ATTR" });
		
		if(objectName && dataobjectName && stage && pool && parentid && currency) {
			var uri = '/triskell/service/rest/dataobject/create';
			var body = '<?xml version="1.0" encoding="UTF-8"?>'+
							'<dataobjects>'+
								'<dataobject>'+
									'<object>'+objectName+'</object>'+
									'<name>'+dataobjectName+'</name>'+
									'<description>'+description+'</description>'+
									'<stage>'+stage+'</stage>'+
									'<pool>'+pool+'</pool>'+
									'<parentid>'+parentid+'</parentid>'+
									'<currency>'+currency+'</currency>';
									
			if(attributes) {body += '<attributes>'+attributes+'</attributes>'};
			
			if(childs) {body += '<childs>'+childs+'</childs>'};
			
			body = 	body+	'</dataobject>'+
						'</dataobjects>';
			
			var response = ""

			var options = {
			  hostname:  server,
			  port: 443,
			  path: uri,
			  method: 'POST',
			  headers: {
				'Cookie': "authash="+ authash + "; JSESSIONID=" + jsessionid,
				'Content-Length': Buffer.byteLength(body),
				'Type-Length': 'text/xml'
			  }
			}
			
			logger.debug('createDataobject.server : ' + server);
			logger.debug('createDataobject.uri : ' + uri);
			logger.debug('createDataobject.body : ' + body.toString());
			
			var req = https.request(options, function(res) {
			   res.setEncoding('utf8');
			   var buffer = "";
			   res.on( "data", function( data ) { buffer = buffer + data; } );
			   res.on( "end", function( data ) { 
					if(buffer.includes('Server error')) {
						callback('Server error', null);
					} else {
						try {
							logger.debug('createDataobject.result : ' + buffer);
							//console.log(buffer.dataobjects.dataobject[0]);
							xml2js.parseString(buffer, function (err, result) {
								//console.dir(result);
								callback(null, result);
							});
						} catch (error) {
							console.error(error);
							logger.debug('createDataobject.error : ' + error);
							callback(null, error);
						}
					}
				});
			});

			req.on('error', function(e) {
			  console.log(new Date().toISOString()+' - problem with the request: ' + e.message);
			  logger.error('problem with the request: ' + e.message);
			});
			
			// write data to request body
			req.write(body);
			req.end();
		}
	},

	/*------------------------------------------------------*/
	/**
	 * Set a dataobject value
	 */
	setDataObjectAttrValue: function (server, login, token, dataObjectId, attr_id, value, username) {
		//'use strict';
		var attr_param = "attr_"+attr_id.toString();
		var attr_value = "";
		if (typeof value === "boolean") {
			attr_value = value; 
		}
		else if (typeof value === "number") {
			attr_value = value;
		}
		else if (typeof value === "string") {
			attr_value = value.toString();
		}
		else {
			return "value undefined";
		}

		if(dataObjectId && attr_id && attr_value) {
			var body = JSON.stringify({
				'id' : 0, 
				'params' : {
					"DATAOBJECT_ID": dataObjectId.toString(), 
					[attr_param]: attr_value
			  } , 
			  'objects' : null 
			})
			
			let buff = new Buffer.from(body);
			let base64data = buff.toString('base64');
			
			//console.log('BODY : ' + body.toString());

			var response = ""

			var options = {
			  hostname:  server,
			  port: 443,
			  path: '/triskell/service/rest/proxy/operation/execute/CustomAttrPanelAS/CustomAttrPanelPutValues/'+base64data,
			  method: 'GET',
			  headers: {
				'X-Account-Name': login,
				'X-API-Key': token,
				'Content-Length': response.length
			  }
			}
			
			var req = https.request(options, function(res) {
			  res.setEncoding('utf8');
			  res.on('data', function (chunk) {
				console.log('RESPONSE: ' + chunk);
				response = JSON.parse(chunk);
				console.log(new Date().toISOString()+' - updating dataobject: ' + dataObjectId.toString() + ', success: ' + response.success + ', message: ' + response.message);
			  }); 
			});

			req.on('error', function(e) {
			  console.log(new Date().toISOString()+' - problem with the request: ' + e.message);
			});
			
			// write data to request body
			req.write(body);
			req.end();
		}
	},
	
	/**
	 * Generate code
	 */
	genProjectCode: function (server, login, token, dataObjectId, user_name, callback) {
		//'use strict';
		
		var body = JSON.stringify({
			'id' : 0, 
			'params' : {
				"DATAOBJECT_ID": dataObjectId.toString(), 
				"attr_490": "Code generated the "+new Date().toISOString().slice(0, 10)+" and requested by "+user_name,
				"attr_480": dataObjectId.toString(),
				"attr_491": false
		  } , 
		  'objects' : null 
		});
		
		//console.log('BODY : ' + body.toString());
		
		let buff = new Buffer.from(body);
		let base64data = buff.toString('base64');

		var response = ""

		var options = {
		  hostname:  server,
		  port: 443,
		  path: '/triskell/service/rest/proxy/operation/execute/CustomAttrPanelAS/CustomAttrPanelPutValues/'+base64data,
		  method: 'GET',
		  headers: {
			'X-Account-Name': login,
			'X-API-Key': token,
			'Content-Length': response.length
		  }
		}
		
		let tries = 0;
		
		var req = https.request(options, function(res) {
			var response = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				response = JSON.parse(chunk);	
				
				console.log(new Date().toISOString()+' - updating dataobject: ' + dataObjectId.toString() + ', success: ' + response.success + ', message: ' + response.message +' Try(' + tries + ')');
			});
			res.on("end", function() {
				//response = JSON.parse(chunk);  //<== Protect this if you may not get JSON back
				if (response.success) {
					callback(null, response);
				} else {
					console.log(false);
					callback(response, null);
				}
			});
		});
		
		// write data to request body
		req.write(body);
		req.end();

		req.on('error', function(e) {
			console.log(new Date().toISOString()+' - problem with the request: ' + e.message);
		});
	},

	/**
	 * SaveDataobjectRelationship
	 */
	saveDataobjectRelationship: function (server, login, token, sourceDataObjectId, targetDataObjectId, relationId, username, logger) {
		//'use strict';
		/*
		{
		  'id' : 0  , 
		  'params' : {
				"rel1":"1315|1061",
				"numAssignements":"1",
				"objectRelationId":"6"},
		   'objects' : null 
		}

		*/
		if(sourceDataObjectId && targetDataObjectId && relationId) {
			var body = JSON.stringify({
				'id' : 0, 
				'params' : {
					"rel1": sourceDataObjectId.toString()+"|"+targetDataObjectId.toString(), 
					"numAssignements": "1",
					"objectRelationId": relationId
			  } , 
			  'objects' : null 
			});
			
			let buff = new Buffer.from(body);
			let base64data = buff.toString('base64');
			


			var response = ""

			var options = {
			  hostname:  server,
			  port: 443,
			  path: '/triskell/service/rest/proxy/operation/execute/TkRelatedObjectAssignerAS/SaveDataobjectRelationship/'+base64data,
			  method: 'GET',
			  headers: {
				'X-Account-Name': login,
				'X-API-Key': token,
				'Content-Length': response.length
			  }
			}
			
			logger.debug('saveDataobjectRelationship.server : ' + server);
			logger.debug('saveDataobjectRelationship.uri : ' + uri);
			logger.debug('saveDataobjectRelationship.body : ' + body.toString());
			
			var req = https.request(options, function(res) {
			  res.setEncoding('utf8');
			  res.on('data', function (chunk) {
				logger.debug('saveDataobjectRelationship.response : ' + chunk);
				response = JSON.parse(chunk);
				console.log(new Date().toISOString()+' - relate dataobject: ' + sourceDataObjectId.toString() + ' to ' + targetDataObjectId + ', success: ' + response.success + ', message: ' + response.message);
			  });
			  
			  
			});

			req.on('error', function(e) {
			  console.log(new Date().toISOString()+' - problem with the request: ' + e.message);
			  logger.error('problem with the request: ' + e.message);
			});
			
			// write data to request body
			req.write(body);
			req.end();
		}
	},
	
	padLeadingZeros: function (num, size) {
		var s = num+"";
		while (s.length < size) s = "0" + s;
		return s;
	}
};

function setDelay (message, delay) {
	setTimeout(function(){
		console.log(message);
	}, delay);
}


module.exports = methods;
