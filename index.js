var express = require("express");
var log = require("disnode-logger");
var bodyparser = require("body-parser");
var config = require("./config");

var app = express();
app.use(bodyparser.urlencoded({ extended: true}));
app.use(bodyparser.json());

app.use("/casino", require("./routes/api"));

app.listen(3333, () => {
    log.Success("Casino-Updater", "Start", "App started! listening on port 3333!");
});