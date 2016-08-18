var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var nodeCache = require('node-cache');
var webSocketServer = require('ws').Server;

var mpesaParser = require('./app_modules/mpesa-parser.js');

var app = express();
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

var cache = new nodeCache();

var server = app.listen(process.env.PORT || 3000);
var webSocket = new webSocketServer({ server: server });

webSocket.on('connection', function(client) {
  client.on('message', function(data) {
    data = JSON.parse(data);
    var response = '';

    // Acknowledge to the web client that we know who they are
    if (data.type === 'register') {
      cache.set(data.uuid, data.uuid, 3600);
      response = JSON.stringify({ type: 'ack', uuid: data.uuid });
    }

    client.send(response);
  });
});

// Recieve data from the Android app and save it
app.post('/mpesa_data/:uuid', function(req, res) {
  console.log(req.body);
  cache.set(req.params.uuid, req.body.mpesa_texts, 3600);

  // Tell clients they can download data
  webSocket.clients.forEach(function(client) {
    client.send( JSON.stringify({ type: 'fetch', who: req.params.uuid }) );
  });

  res.status(200).send(req.params.uuid)
});

// Request from the web client to send them their MPESA data
app.get('/mpesa_data/:uuid', function(req, res) {
  cache.get(req.params.uuid, function(err, data) {
    if (err || data === undefined) {
      console.log(err, data)
      res.status(400).json({ msg: 'No data' });
    } else {
      var mpesaTexts = mpesaParser.mpesaParser(data);
      res.status(200).json({ mpesa_data: mpesaTexts });
    }
  });
});