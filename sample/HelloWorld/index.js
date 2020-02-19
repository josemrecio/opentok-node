/* eslint-disable no-console, no-path-concat */

// Dependencies
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const OpenTok = require('opentok');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const whitelist = ['https://localhost:8080', 'https://10.26.0.102:8080']
const corsOptions = {
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

const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;

// Verify that the API Key and API Secret are defined
if (!apiKey || !apiSecret) {
  console.log('You must specify API_KEY and API_SECRET environment variables');
  process.exit(1);
}

// Starts the express app
const key = fs.readFileSync(path.join(__dirname, 'selfsigned.key'));
const cert = fs.readFileSync(path.join(__dirname, 'selfsigned.crt'));
const options = {
  key: key,
  cert: cert
};
const httpsServer = https.createServer(options, app);
httpsServer.listen(3000, function () {
  console.log('You\'re app is now ready at https://localhost:3000/');
});

// Initialize OpenTok
const opentok = new OpenTok(apiKey, apiSecret);

app.post('/session', function (req, res) {
  console.log('Generating sessionId');
  var params = { mediaMode:"routed" };
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

