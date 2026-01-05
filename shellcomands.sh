cd platform/app

HTTPS=true \                                               
NODE_ENV=development \
PROXY_TARGET=/dcm4chee-arc \
PROXY_DOMAIN=https://10.73.173.205:8443 \
APP_CONFIG=config/dicomweb-server.js \
yarn webpack-dev-server --config .webpack/webpack.pwa.js --watch --server-type https

##api commandos
curl -i "http://10.73.173.205:8080/dcm4chee-arc/aets/DCM4CHEE/rs/studies?limit=1"
