account_name=$(printenv ACCOUNT_NAME)
protocol=$(printenv PROTOCOL)
port=$(printenv PORT_DICOMWEB)

sed -i "s/{ACCOUNT_NAME}/$account_name/g" /usr/src/app/platform/viewer/public/config/default.js
sed -i "s/{PROTOCOL}/$protocol/g" /usr/src/app/platform/viewer/public/config/default.js
sed -i "s/{PORT_DICOMWEB}/$port/g" /usr/src/app/platform/viewer/public/config/default.js

npm start --production
