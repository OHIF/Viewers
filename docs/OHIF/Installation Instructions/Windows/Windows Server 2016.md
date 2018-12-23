# OHIF Standalone Installation Instructions For Windows Server 2016:

* Note: Turn-Off Windows Defender Realtime protection during this process

1. Install Chocolatey
    
        a. Go to this URL for instructions: 
            https://chocolatey.org/install#install-with-cmdexe
    
        b. Execute this command in the cmd line as Admin:
    
            `@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"`
    
        c. Type choco -? to ensure the installation is OK.

2. Install Meteor
    
        a. Type the command: choco install meteor

3. Install node.js
