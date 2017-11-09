var Service = require('node-windows').Service;

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

if (option == "--install") {
	svc.install();
} else if (option == "--uninstall") {
	svc.uninstall();
} else if (option == "--start") {
	svc.start();
} else if (option == "--stop") {
	svc.stop();
}
