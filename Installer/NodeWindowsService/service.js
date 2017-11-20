var Service = require('node-windows').Service;
var exec = require("child_process").exec;

// Usage: node service.js "<service name>" "path\to\app.js" [--install | --uninstall | --start | --stop]

var serviceName = process.argv[2];
var scriptPath = process.argv[3];
var option = process.argv[4];

var svc = new Service({
	name: serviceName,
	script: scriptPath,
	env: {
		name: "NODE_ENV",
		value: "production"
	}
});

svc.on("install", function () {
	svc.start();
	
	var timeout = 60000;
	var interval = 5000;
	
	var timePassed = 0;
	var timer = setInterval(function() {
		timePassed += interval;
		
		if (timePassed > timeout) {
			console.log("Starting service is timed out.");
			clearInterval(timer);
			return;
		}
		
		exec("sc query lesiontrackerserver.exe", function(err, stdout) {
			stdout.toString().split("\r\n").filter(function (line) {
				if (line.indexOf("STATE") < 0) {
					return;
				}
				
				if (line.indexOf("RUNNING") < 0) {
					console.log("Service could not be started. Retrying...");
					exec('net start lesiontrackerserver.exe');
					return;
				}
				
				console.log("Service is started successfully.");
				clearInterval(timer);
			});
		});
	}, interval);
});

if (option == "--install") {
	svc.install();
} else if (option == "--uninstall") {
	svc.uninstall();
} else if (option == "--start") {
	svc.start();
} else if (option == "--stop") {
	svc.stop();
}

