// This sets up a proxy to work around CORS.
// See http://chafey.blogspot.be/2014/09/working-around-cors.html
// For more information
var http = require('http'),
    httpProxy = require('http-proxy');

var proxy =  httpProxy.createProxyServer({
    target: 'http://192.168.99.100:8042',
    auth: 'orthanc:orthanc'
}).listen(8042);

proxy.on('proxyRes', function(proxyReq, req, res, options) {
  // add the CORS header to the response
  res.setHeader('Access-Control-Allow-Origin', '*');
});

proxy.on('error', function(e) {
  // suppress errors
  console.log(e);
});
