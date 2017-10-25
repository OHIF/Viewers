REM Create LesionTracker Installer
REM 1. Install Node.js
REM 2. Install Meteor
REM 3. Run 'npm install -g windows-build-tools' in Node.js command prompt
REM 4. Run this script

set SRCDIR="C:\Workspace\Viewers\LesionTracker"

REM Build Meteor Server
cd %SRCDIR%
rmdir /s /q ..\Installer\build & mkdir ..\Installer\build
call meteor npm install --production
set METEOR_PACKAGE_DIRS=..\Packages
call meteor build --directory ..\Installer\build
cd ..\Installer\build\bundle\programs\server
call npm install --production
cd ..\..\..\..\

REM Copy LICENSE file
xcopy /y LICENSE.rtf build

REM Create Installer
rmdir /s /q output & mkdir output
del /q LesionTrackerWXS\BuildDir.wxs
call "%WIX%\bin\heat.exe" dir build -dr INSTALLDIR -cg MainComponentGroup -out LesionTrackerWXS\BuildDir.wxs -ke -sfrag -gg -var var.SourceDir -sreg -scom
call "%WIX%\bin\candle.exe" -dSourceDir="build" LesionTrackerWXS\*.wxs -o output\ -ext WiXUtilExtension
call "%WIX%\bin\light.exe" -o output\installer.msi output\*.wixobj -cultures:en-US -ext WixUIExtension.dll -ext WiXUtilExtension
