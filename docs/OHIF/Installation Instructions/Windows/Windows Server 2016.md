# OHIF Standalone Installation Instructions For Windows Server 2016:

*Turn-Off Windows Defender Realtime protection during this process

Install Chocolatey

Go to this URL for instructions:

https://chocolatey.org/install#install-with-cmdexe

Execute this command in the cmd line as Admin:
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command “iex ((New-Object System.Net.WebClient).DownloadString(‘https://chocolatey.org/install.ps1’))” && SET “PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin”

Type choco -? to ensure the installation is OK.

Install Meteor

Type the command: choco install meteor

Install node.js

Download MSI from: https://nodejs.org/en/download/
