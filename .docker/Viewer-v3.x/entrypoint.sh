#!/bin/sh

if [ -n "$SSL_PORT" ]
  then
    envsubst '${SSL_PORT}:${PORT}' < /usr/src/default.ssl.conf.template > /etc/nginx/conf.d/default.conf
  else
    envsubst '${PORT}' < /usr/src/default.conf.template > /etc/nginx/conf.d/default.conf
fi

if [ -n "$APP_CONFIG" ]
  then
    echo "$APP_CONFIG" > /usr/share/nginx/html/app-config.js
fi

if [ -n "$CLIENT_ID" ] || [ -n "$HEALTHCARE_API_ENDPOINT" ]
  then
    # If CLIENT_ID is specified, use the google.js configuration with the modified ID
    if [ -n "$CLIENT_ID" ]
      then
  	    echo "Google Cloud Healthcare \$CLIENT_ID has been provided: "
  	    echo "$CLIENT_ID"
  	    echo "Updating config..."

  	    # - Use SED to replace the CLIENT_ID that is currently in google.js
	      sed -i -e "s/YOURCLIENTID.apps.googleusercontent.com/$CLIENT_ID/g" /usr/share/nginx/html/google.js
	  fi

    # If HEALTHCARE_API_ENDPOINT is specified, use the google.js configuration with the modified endpoint
    if [ -n "$HEALTHCARE_API_ENDPOINT" ]
      then
        echo "Google Cloud Healthcare \$HEALTHCARE_API_ENDPOINT has been provided: "
        echo "$HEALTHCARE_API_ENDPOINT"
        echo "Updating config..."

        # - Use SED to replace the HEALTHCARE_API_ENDPOINT that is currently in google.js
        sed -i -e "s+https://healthcare.googleapis.com/v1+$HEALTHCARE_API_ENDPOINT+g" /usr/share/nginx/html/google.js
    fi

	  # - Copy google.js to overwrite app-config.js
	  cp /usr/share/nginx/html/google.js /usr/share/nginx/html/app-config.js
fi

echo "Starting Nginx to serve the OHIF Viewer..."

exec "$@"
