# OHIF Standalone Installation Instructions For Windows Server 2016:

**Note: Turn-Off Windows Defender Realtime protection during this process*

1. Install Chocolatey

	a. Go to this URL for instructions:
	
		https://chocolatey.org/install#install-with-cmdexe
	
	b. Execute this command in the cmd line as Admin:
		`@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"`
	
	c. Type `choco -?` to ensure the installation is OK.
2. Install Meteor
	
	a. Type the command: `choco install meteor`
3. Install node.js
	
	a. Download MSI from: https://nodejs.org/en/download/
4. Install MongoDB
	
	a. Download MSI from: 
https://www.mongodb.com/download-center/community
5. Install Git
	
	a. https://git-scm.com/download/win
6. Download the OHIF Viewer repository from GitHub, or use Git to clone it (recommended)
	
	a. GitHub Repo: https://github.com/OHIF/Viewers
	
	b. GIT Clone command: `git clone https://github.com/OHIF/Viewers`
7. Set the Meteor Packages folder environment variable
	
	a. Go to Advanced System Settings
	
	b. Under Advanced, click on the "Environment Variables..." button
	
	c. Under System Variables, click "New..."
	
	d. Set the following:
	
		i. Variable name: METEOR_PACKAGE_DIRS
		
		ii. Variable Value: {path to the OHIF Viewer Packages Folder} 
		example: C:\OHIF\Viewers\Packages
8. Using the command line, navigate/cs to the standalone viewer folder, example: `cd C:\OHIF\Viewers\StandaloneViewer\StandaloneViewer`
9. run the command: `meteor npm install`
10. Run the command: `meteor`

	a. if you get this error "Error: EPERM: operation not permitted, unlink" Or,
	
	b. You feel the build is stale for a very long time > 10min with no visual indication, restart the cmd prompt and repeat this step (`meteor`)

# Troubleshooting:

1.  If you get an error: Error: EPERM: operation not permitted, unlink 'c:\xxxxx' 

	a. https://github.com/phoenixframework/phoenix/issues/2464
