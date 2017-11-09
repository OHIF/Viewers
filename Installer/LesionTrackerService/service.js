var Service = require('node-windows').Service;

// Usage: node service.js "path\to\app.js" [--install | --uninstall | --start | --stop]

var svc = new Service({
	name:'Lesion Tracker Server',
	script: process.argv[2],
	env: {
		name: "NODE_ENV",
		value: "production"
	}
});

if (process.argv[3] == "--install") {
	svc.install();
}
else if (process.argv[3] == "--uninstall") {
	svc.uninstall();
}
else if (process.argv[3] == "--start") {
	svc.start();
}
else if (process.argv[3] == "--stop") {
	svc.stop();
}
