var _shell = new ActiveXObject("WScript.Shell");
var _fileSystem = new ActiveXObject("Scripting.FileSystemObject");

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
	
	var cmdCreateMongoDBService="\""+mongoDBDir+"\\bin\\mongod.exe\" --config \""+mongoDBDir+"\\mongod.cfg\" --install";
	_shell.Run(cmdCreateMongoDBService, 1, true);
	
	var cmdStartMongoDBService="net start MongoDB";
	_shell.Run(cmdStartMongoDBService, 1, true);
	
	var cmdCreateLTDB="\""+mongoDBDir+"\\bin\\mongo.exe\" --eval \"connect('127.0.0.1:27017/lesiontracker')\"";
	_shell.Run(cmdCreateLTDB, 1, true);
}

function ConfigureLT() {
	// TODO
}

function Log(msg) {
    var record = Session.Installer.CreateRecord(0);
    record.StringData(0) = "CustomAction:: " + msg;
    Session.Message(0x01000000, record);
}
