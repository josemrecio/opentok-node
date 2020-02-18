/* eslint-disable no-console, no-path-concat */

// Dependencies
var express = require('express');
var OpenTok = require('../../lib/opentok');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');

var whitelist = ['http://localhost:8080']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions));
app.use(bodyParser.json());

var opentok;
var apiKey = process.env.API_KEY;
var apiSecret = process.env.API_SECRET;

// Verify that the API Key and API Secret are defined
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Starts the express app
function init() {
  app.listen(3000, function () {
    console.log('You\'re app is now ready at http://localhost:3000/');
  });
}

init();

// Initialize OpenTok
opentok = new OpenTok(apiKey, apiSecret);

app.post('/session', function (req, res) {
  console.log('Generating sessionId');
  const params = { };
  const requestLocation = req.body.location;
  if (requestLocation && requestLocation !== 'null') {
    console.log('location:' + requestLocation);
    params.location = requestLocation;
  }
  // Create a session
  opentok.createSession(params, function (err, session) {
    if (err) {
      res.status(400).json({"error": err.toString()});
      return;
    }
    sessionId = session.sessionId;
    console.log('sessionId:' + sessionId);
    res.json({"sessionId": sessionId});
  });
});

app.get('/session', function (req, res) {
  const sessionId = req.query.sessionId;
  if (!sessionId || sessionId == 'null') {
    console.log('GET missing sessionId');
    res.send(400);
    return;
  }
  console.log('sessionId:' + sessionId);
  // generate a fresh token for this client
  const token = opentok.generateToken(sessionId);
  res.json({"apiKey": apiKey, "sessionId": sessionId, "token": token});
});

