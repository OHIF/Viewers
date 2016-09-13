import SimpleHTTPServer, SocketServer
import urlparse, os

PORT = 3000

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
   def do_GET(self):

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
