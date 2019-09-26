#!/bin/bash

# If CLIENT_ID is specified, use the google.js configuration with the modified ID
if [ ! -z "$CLIENT_ID" ]
  then
  	echo "Google Cloud Healthcare $CLIENT_ID has been provided: "
  	echo $CLIENT_ID
  	echo "Updating config..."

  	# - Use SED to replace the CLIENT_ID that is currently in google.js
	sed -i -e "s/YOURCLIENTID.apps.googleusercontent.com/$CLIENT_ID/g" /usr/share/nginx/html/google.js

	# - Copy google.js to overwrite app-config.js
	cp /usr/share/nginx/html/google.js /usr/share/nginx/html/app-config.js
fi

echo "Starting Nginx to serve the OHIF Viewer..."

exec "$@"
