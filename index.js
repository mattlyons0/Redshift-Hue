'use strict';

const http = require("http");
const textBody = require("body");
const redshiftControl = require('./colorController');

redshiftControl.init();

http.createServer(function (req, res) {
  textBody(req, res, function (err, body) {
    if(body == 'resume'){
      redshiftControl.resume();
    }

    res.end();
  })
}).listen(5000);
