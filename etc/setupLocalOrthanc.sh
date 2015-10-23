#!/bin/bash
echo "Retrieving docker default machine IP address..."
MACHINEIP=$(docker-machine ip default)
echo "Copying nodeCORSProxy.example to nodeCORSProxy.js"
cp nodeCORSProxy.example nodeCORSProxy.js
sed -i '' "s/localhost:8042/$MACHINEIP:8042/g" nodeCORSProxy.js
echo "Installing node http-proxy from npm..."
npm install http-proxy
echo "Running proxy server..."
echo "In a separate tab/terminal, go to /main and run ./bin/localhostOrthanc.sh to start the Meteor server"
node nodeCORSProxy.js
