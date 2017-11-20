var _shell = new ActiveXObject("WScript.Shell");
var _fileSystem = new ActiveXObject("Scripting.FileSystemObject");

// Custom Action called by WIX to configure MongoDB settings and start MongoDB service
function ConfigureMongoDB() {
	var installDir = Session.Property("CustomActionData");
	
	var mongoDBDir="C:\\Program Files\\MongoDB\\Server\\3.4\\";
	if (!_fileSystem.FolderExists(mongoDBDir)) {
		// Return error and cancel installation
		return 1;
	}
	
	var mongoDBDatabaseDir=mongoDBDir+"db";
	if (!_fileSystem.FolderExists(mongoDBDatabaseDir)) {
		_fileSystem.CreateFolder(mongoDBDatabaseDir);
	}
	
	var mongoDBLogDir=mongoDBDir+"log";
	if (!_fileSystem.FolderExists(mongoDBLogDir)) {
		_fileSystem.CreateFolder(mongoDBLogDir);
	}
	
	_fileSystem.CopyFile(installDir+"mongod.cfg", mongoDBDir, true);
	
	var configCommands = [
		"\""+mongoDBDir+"\\bin\\mongod.exe\" --config \""+mongoDBDir+"\\mongod.cfg\" --install",
		"net start MongoDB",
		"\""+mongoDBDir+"\\bin\\mongo.exe\" --eval \"connect('127.0.0.1:27017/lesiontracker')\""
	];
	
	RunShellCommands(configCommands);
}

// Custom Action called by WIX to install and start LesionTracker service
function InstallLTService() {
	var installDir = Session.Property("CustomActionData");
	
	// Set environment variables
	SetEnvironmentVariables(installDir);
	
	var installCommands = [
		"node \""+installDir+"NodeWindowsService\\service.js\" \"LesionTracker Server\" \""+installDir+"bundle\\main.js\" --install",
		"netsh http add urlacl url=http://+:3000/ user=\Everyone",
		"netsh advfirewall firewall add rule name=\"LesionTracker Default Port 3000\" dir=in action=allow protocol=TCP localport=3000"
	];
	
	RunShellCommands(installCommands);
}

function UninstallOrthancServer() {
	var orthancDir = "C:\\Program Files\\Orthanc Server\\unins000.exe";
	
	if (!_fileSystem.FileExists(orthancDir)) {
		return;
	}

	var orthancCommands = [
		"\""+orthancDir+"\" /VERYSILENT /SUPPRESSMSGBOXES"
	];
		
	RunShellCommands(orthancCommands);
}

// Custom Action called by WIX to uninstall LesionTracker service and stop MongoDB service
function UninstallLTService() {
	var installDir = Session.Property("CustomActionData");
	
	var uninstallCommands = [
		"net stop lesiontrackerserver.exe",
		"sc delete lesiontrackerserver.exe",
		"net stop MongoDB",
		"sc delete MongoDB"
	];
	
	RunShellCommands(uninstallCommands);
	
	// Unset environment variables
	UnsetEnvironmentVariables();
	
	UninstallOrthancServer();
}

// Run shell commands
function RunShellCommands(commands) {
	for (var i=0; i<commands.length; i++) {
		_shell.Run(commands[i], 0, true);
	}
}

// Set environment variable to System
function SetEnvironmentVariable(key, value) {
	var systemEnv = _shell.Environment('SYSTEM');
	systemEnv(key) = value;
}

// Set environment variables which are used to run the application
function SetEnvironmentVariables(installDir) {
	var settings = GetFileContent(installDir+"\\orthancDICOMWeb.json");
	var rootUrl = "http://localhost";
	var port = 3000;
	var mongoUrl = "mongodb://127.0.0.1:27017/lesiontracker";
	
	SetEnvironmentVariable('METEOR_SETTINGS', settings);
	SetEnvironmentVariable('ROOT_URL', rootUrl);
	SetEnvironmentVariable('PORT', port);
	SetEnvironmentVariable('MONGO_URL', mongoUrl);
}

// Remove enviroment variable from the System
function UnsetEnvironmentVariable(key) {
	var systemEnv = _shell.Environment('SYSTEM');
	systemEnv.Remove(key);
}

// Unset environment variables which are used to run the application
function UnsetEnvironmentVariables() {
	UnsetEnvironmentVariable('METEOR_SETTINGS');
	UnsetEnvironmentVariable('ROOT_URL');
	UnsetEnvironmentVariable('PORT');
	UnsetEnvironmentVariable('MONGO_URL');
}

// Get content of the file
function GetFileContent(fileName) {
	var f = _fileSystem.OpenTextFile(fileName, 1);
	  
	  // Read from the file.
    if (f.AtEndOfStream) {
		return ("");
	}
	
	return f.ReadAll();
}

// Show a dialog with log message for debug purposes
function Log(msg) {
    var record = Session.Installer.CreateRecord(0);
    record.StringData(0) = "CustomAction:: " + msg;
    Session.Message(0x01000000, record);
}
