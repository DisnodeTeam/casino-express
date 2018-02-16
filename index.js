var express = require("express");
var log = require("disnode-logger");
var bodyparser = require("body-parser");
var config = require("./config");

var app = express();
app.use(bodyparser.urlencoded({ extended: true}));
app.use(bodyparser.json());
app.enable('trust proxy');
app.use("/casino", require("./routes/api"));
app.use('/webhook', require('./routes/webhook'))
app.listen(5000, () => {
    log.Success("Casino-Express", "Start", "App started! listening on port 5000!");
});
