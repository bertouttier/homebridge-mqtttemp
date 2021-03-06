// MQTT Temp Accessory plugin for HomeBridge
//
// Remember to add accessory to config.json. Example:
// "accessories": [
//     {
//		"accessory": "mqtttemp",
//		"name": "PUT THE NAME OF YOUR SWITCH HERE",
//		"url": "PUT URL OF THE BROKER HERE",
//		"username": "PUT USERNAME OF THE BROKER HERE",
//		"password": "PUT PASSWORD OF THE BROKER HERE"
// 		"caption": "PUT THE LABEL OF YOUR SENSOR HERE",
// 		"topic": "PUT TOPIC HERE"
//     }
// ],
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.

'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");


function MqttTempAccessory(log, config) {
	this.log        = log;
	this.name 	= config["name"];
	this.url 	= config["url"];
	this.client_Id	= 'mqttjs_' + Math.random().toString(16).substr(2, 8);
	this.options 	= {
		keepalive: 10,
		clientId: this.client_Id,
		protocolId: 'MQTT',
		protocolVersion: 4,
		clean: true,
		reconnectPeriod: 1000,
		connectTimeout: 30 * 1000,
		will: {
			topic: 'WillMsg',
			payload: 'Connection Closed abnormally..!',
			qos: 0,
			retain: false
		},
		username: config["username"],
		password: config["password"],
		rejectUnauthorized: false
	};
	this.caption	= config["caption"];
	this.topic	= config["topic"];

	this.lastTemp = 0.0;
	
	this.service = new Service.TemperatureSensor(this.name);
  	this.service
		.getCharacteristic(Characteristic.CurrentTemperature)
		.on('get', this.getTemp.bind(this));
	
	// connect to MQTT broker
	this.client = mqtt.connect(this.url, this.options);
	var that = this;
	this.client.on('error', function () {
		that.log('Error event on MQTT');
	});

	this.client.on('message', function (topic, message) {
		if (topic == that.topic) {
			var temp = parseFloat(message);
			that.lastTemp = temp;
		   	that.service.getCharacteristic(Characteristic.CurrentTemperature).setValue(that.lastTemp, undefined, 'fromSetValue');
		}
	});
	this.client.subscribe(this.topic);
}

module.exports = function(homebridge) {
  	Service = homebridge.hap.Service;
  	Characteristic = homebridge.hap.Characteristic;
  
  	homebridge.registerAccessory("homebridge-mqtttemp", "mqtttemp", MqttTempAccessory);
}

MqttTempAccessory.prototype.getTemp = function(callback) {
    callback(null, this.lastTemp);
}

MqttTempAccessory.prototype.getServices = function() {
  return [this.service];
}
