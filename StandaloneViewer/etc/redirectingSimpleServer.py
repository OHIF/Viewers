import SimpleHTTPServer, SocketServer
import urlparse, os

PORT = 3000

## Note: If you set this parameter, you can try to serve files
# at a subdirectory. You should use
# -u http://localhost:3000/subdirectory
# when building the application, which will set this as your
# ROOT_URL.
#URL_PATH="/subdirectory"
URL_PATH=""

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
   def do_GET(self):

       # Strip the subdirectory from the PATH
       # e.g. localhost:3000/subdirectory/packages/ohif_polyfill/svg4everybody.min.js
       # is interpreted by this script as localhost:3000/packages/ohif_polyfill/svg4everybody.min.js
       # so the file is found properly.
       self.path = self.path.replace(URL_PATH, "")

       # Parse query data to find out what was requested
       parsedParams = urlparse.urlparse(self.path)

       # See if the file requested exists
       if os.access('.' + os.sep + parsedParams.path, os.R_OK):
          # File exists, serve it up
          SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self);
       else:
          # send index.html
          self.send_response(200)
          self.send_header('Content-Type', 'text/html')
          self.end_headers()
          with open('index.html', 'r') as fin:
            self.copyfile(fin, self.wfile)

Handler = MyHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
