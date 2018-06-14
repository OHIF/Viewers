import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';
import { Accounts } from 'meteor/accounts-base';
import { OHIF } from 'meteor/ohif:core';
import { Servers } from 'meteor/ohif:servers/both/collections';

const url = require('url');
const http = require('http');
const https = require('https');
const now = require('performance-now');

const doAuth = Meteor.users.find().count() ? true : false;

const authenticateUser = request => {
    // Only allow logged-in users to access this route
    const userId = request.headers['x-user-id'];
    const loginToken = request.headers['x-auth-token'];
    if (!userId || !loginToken) {
        return;
    }

    const hashedToken = Accounts._hashLoginToken(loginToken);

    return Meteor.users.findOne({
        _id: userId,
        'services.resume.loginTokens.hashedToken': hashedToken
    });
};

const handleRequest = function() {
  const request = this.request;
  const response = this.response;
  const params = this.params;

  let start = now();
  let user;
  if (doAuth) {
      user = authenticateUser(request);
      if (!user) {
          response.writeHead(401);
          response.end('Error: You must be logged in to perform this action.\n');
          return;
      }
  }

  let end = now();
  const authenticationTime = end - start;

  start = now();

  const server = Servers.findOne(params.query.serverId);
  if (!server) {
      response.writeHead(500);
      response.end('Error: No Server with the specified Server ID was found.\n');
      return;
  }

  const requestOpt = server.requestOptions;

  // If no Web Access to DICOM Objects (WADO) Service URL is provided
  // return an error for the request.
  const wadoUrl = params.query.url;
  if (!wadoUrl) {
      response.writeHead(500);
      response.end('Error: No WADO URL was provided.\n');
      return;
  }

  if (requestOpt.logRequests) {
      console.log(request.url);
  }

  start = now();
  if (requestOpt.logTiming) {
      console.time(request.url);
  }

  // Use Node's URL parse to decode the query URL
  const parsed = url.parse(wadoUrl);

  // Create an object to hold the information required
  // for the request to the PACS.
  let options = {
      headers: {},
      method: request.method,
      hostname: parsed.hostname,
      path: parsed.path
  };

  let requester;
  if (parsed.protocol === 'https:') {
      requester = https.request;

      const allowUnauthorizedAgent = new https.Agent({ rejectUnauthorized: false });
      options.agent = allowUnauthorizedAgent;
  } else {
      requester = http.request;
  }

  if (parsed.port) {
      options.port = parsed.port;
  }

  Object.keys(request.headers).forEach(entry => {
      const value = request.headers[entry];
      if (entry) {
          options.headers[entry] = value;
      }
  });

  // Retrieve the authorization user:password string for the PACS,
  // if one is required, and include it in the request to the PACS.
  if (requestOpt.auth) {
      options.auth = requestOpt.auth;
  }

  end = now();
  const prepRequestTime = end - start;

  // Use Node's HTTP API to send a request to the PACS
  const proxyRequest = requester(options, proxyResponse => {
      // When we receive data from the PACS, stream it as the
      // response to the original request.
      // console.log(`Got response: ${proxyResponse.statusCode}`);
      end = now();
      const proxyReqTime = end - start;
      const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
      const serverTimingHeaders = `
          auth=${authenticationTime}; "Authenticate User",
          prep-req=${prepRequestTime}; "Prepare Request Headers",
          proxy-req=${proxyReqTime}; "Request to WADO URI",
          total-proxy=${totalProxyTime}; "Total",
      `.replace(/\n/g, '');

      proxyResponse.headers['Server-Timing'] = serverTimingHeaders;

      response.writeHead(proxyResponse.statusCode, proxyResponse.headers);

      if (requestOpt.logTiming) {
          console.timeEnd(request.url);
      }

      return proxyResponse.pipe(response, { end: true });
  });

  // If our request to the PACS fails, log the error message
  proxyRequest.on('error', error => {
      end = now();
      const proxyReqTime = end - start;
      const totalProxyTime = authenticationTime + prepRequestTime + proxyReqTime;
      console.timeEnd(request.url);
      const serverTimingHeaders = {
          'Server-Timing': `
              auth=${authenticationTime}; "Authenticate User",
              prep-req=${prepRequestTime}; "Prepare Request Headers",
              proxy-req=${proxyReqTime}; "Request to WADO URI",
              total-proxy=${totalProxyTime}; "Total",
          `.replace(/\n/g, '')
      };

      response.writeHead(500, serverTimingHeaders);
      response.end(`Error: Problem with request to PACS: ${error.message}\n`);
  });

  // Stream the original request information into the request
  // to the PACS
  request.pipe(proxyRequest);
}

// Setup a Route using Iron Router to avoid Cross-origin resource sharing
// (CORS) errors. We only handle this route on the Server.
Router.route(Settings.uri.replace(OHIF.utils.absoluteUrl(), ''), handleRequest, { where: 'server' });
