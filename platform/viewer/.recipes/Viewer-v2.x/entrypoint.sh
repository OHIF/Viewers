#!/bin/bash

# If CLIENT_ID is specified, use the google.js configuration with the modified ID
if [ ! -z "$CLIENT_ID" ]
  then
  	echo "Google Cloud Healthcare $CLIENT_ID has been provided: "
  	echo $CLIENT_ID
  	echo "Updating config..."

  	# - Use SED to replace the CLIENT_ID that is currently in public/config/google.js
	sed -i -e "s/YOURCLIENTID.apps.googleusercontent.com/$CLIENT_ID/g" /usr/share/nginx/html/config/google.js

	# - Copy public/config/google.js to overwrite public/config/default.js
	cp /usr/share/nginx/html/config/google.js /usr/share/nginx/html/config/default.js
fi

echo "Starting Nginx to serve the OHIF Viewer..."

exec "$@"
