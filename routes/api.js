var express = require("express");
var router = express.Router();
var log = require("disnode-logger");
var Database = require("../DB");
var config = require("../config");
var upd;
var Updater = require("../updater");
const numeral = require('numeral');
Database.Connect().then(() => {
  //upd = new Updater(Database);
});

router.use((req, res, next) => {
  if (req.headers.auth && req.headers.auth == config.auth) {
    log.Success("CasinoRouter", "Auth", "IP: " + req.ip + " Was granted access with auth: " + req.headers.auth + " to " + req.method + " " + req.url);
    next();
  } else {
    log.Warning("CasinoRouter", "DENY FROM AUTH", "IP: " + req.ip + " Was denied access with auth: " + req.headers.auth + " to " + req.method + " " + req.url);
    res.status(401).send({ error: "You are unauthorized! please provide an `auth` header with a correct auth key!" });
  }
});
router.get("/players", (req, res) => {
  Database.Find("players", {}).then((players) => {
    for (var i = 0; i < players.length; i++) {
      delete players[i]["_id"];
    }
    res.status(200).send(players);
  })
});
router.get("/players/:query", (req, res) => {
  Database.Find("players", {}).then((players) => {
    var id = parseMention(req.params.query);
    for (var i = 0; i < players.length; i++) {
      if (players[i].id == id) {
        delete players[i]["_id"];
        res.status(200).send({ found: true, p: players[i] });
        return;
      } else if (players[i].name.toLowerCase() == req.params.query.toLowerCase()) {
        delete players[i]["_id"];
        res.status(200).send({ found: true, p: players[i] });
        return;
      }
    }
    var found = [];
    var msg = "Did you mean?\n";
    for (var i = 0; i < players.length; i++) {
      if (req.params.query.length < 3) break;
      if (players[i].name.toLowerCase().includes(req.params.query.toLowerCase())) {
        found.push(players[i])
      }
    }
    for (var i = 0; i < found.length; i++) {
      if (found[i].banned) {
        msg += "**" + found[i].name + "  (banned)**\n"
      } else {
      msg += "**" + found[i].name + "**\n"
    }
    }
    if (found.length == 1) {
      delete found[0]["_id"];
      res.status(200).send({ found: true, p: found[0] });
      return;
    } else if (found.length > 0) {
      res.status(200).send({ found: false, msg: msg });
      return;
    } else if (found.length == 0) {
      res.status(200).send({ found: false, msg: "Could not find any player matching that description!" });
      return;
    }
    res.status(404).send({ error: "Failed with request" });
  })
});
router.post("/players/:id", (req, res) => {
  if (req.body) {
    if (req.body.id && req.body.id == req.params.id) {
      Database.Update("players", { "id": req.body.id }, req.body).then(() => {
        res.status(200).send();
      })
    } else {
      res.status(400).send({ error: "ID Mismatch" });
    }
  } else {
    res.status(400).send({ error: "No Body" });
  }
})
router.post("/player/new", (req, res) => {
  if (req.body) {
    if (req.body.id) {
      Database.Insert("players", { "id": req.body.id }, req.body).then(() => {
        res.status(200).send();
      })
    } else {
      res.status(400).send({ error: "ID Mismatch" });
    }
  } else {
    res.status(400).send({ error: "No Body" });
  }
})
router.get("/player/:id", (req, res) => {
  Database.Find("players", { "id": req.params.id }).then((players) => {
    for (var i = 0; i < players.length; i++) {
      if (players[i].id == req.params.id) {
        delete players[i]["_id"];
        res.status(200).send(players[i]);
        return;
      }
    }
    res.status(404).send();
  })
})
router.post("/ultra/", (req, res) => {
  console.log(req.body);
  Database.Find("players", {}).then((players) => {
    for (var i = 0; i < players.length; i++) {
      if (players[i].id == req.body.id) {
        if (req.body.status == "true") {
          players[i].Premium = true;
        } else {
          players[i].Premium = false;
        }
        Database.Update("players", { "id": players[i].id }, players[i]).then(() => {
          res.status(200).send({ status: "Updated", id: req.body.id });
        })
        return;
      }
    }
    res.status(404).send({ status: "Failed", error: "Could not find player with id: " + req.body.id + " in Database" });
  })
})
router.get("/cobj", (req, res) => {
  Database.Find("casinoObj", { "id": "cobj" }).then((cobj) => {
    delete cobj[0]["_id"];
    res.status(200).send(cobj[0]);
  })
});
router.post("/cobj", (req, res) => {
  if (req.body) {
    if (req.body.id && req.body.id == "cobj") {
      Database.Update("casinoObj", { "id": req.body.id }, req.body).then(() => {
        res.status(200).send();
      })
    } else {
      res.status(400).send({ error: "Invalid Body" });
    }
  } else {
    res.status(400).send({ error: "No Body" });
  }
})
router.get("/income/:id", (req, res) => {
  Database.Find("players", { "id": req.params.id }).then((players) => {
    for (var i = 0; i < players.length; i++) {
      if (players[i].id == req.params.id) {
        delete players[i]["_id"];
        var p = players[i];
        var now = parseInt(new Date().getTime());
        var diff = now - p.lastIncome;
        if (diff < 300000) {
          var t = parseTime(diff);
          var tmsg = "";
          if (t.days > 0) {
            tmsg = t.days + " Days, " + t.hours + " Hours, " + t.minutes + " Minutes, " + t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else if (t.hours > 0) {
            tmsg = t.hours + " Hours, " + t.minutes + " Minutes, " + t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else if (t.minutes > 0) {
            tmsg = t.minutes + " Minutes, " + t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else if (t.seconds > 0) {
            tmsg = t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else {
            tmsg = t.miliseconds + " Miliseconds"
          }
          res.status(200).send({
            complete: false,
            msg: "You must wait at least 5 minutes before requesting income again. Time since last Income: " + tmsg
          })
        } else {
          if (diff >= 345600000) diff = 345600000;
          var mult = diff / 1800000;
          if(p.prestige != undefined && p.prestige.incomeMult != undefined){
          var toadd = ((p.income * mult) * p.prestige.incomeMult);
          } else var toadd = (p.income * mult);
          p.money += toadd;
          var t = parseTime(diff);
          var tmsg = "";
          if (t.days > 0) {
            tmsg = t.days + " Days, " + t.hours + " Hours, " + t.minutes + " Minutes, " + t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else if (t.hours > 0) {
            tmsg = t.hours + " Hours, " + t.minutes + " Minutes, " + t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else if (t.minutes > 0) {
            tmsg = t.minutes + " Minutes, " + t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else if (t.seconds > 0) {
            tmsg = t.seconds + " Seconds, " + t.miliseconds + " Miliseconds"
          } else {
            tmsg = t.miliseconds + " Miliseconds"
          }
          p.lastIncome = now;
          Database.Update("players", { "id": p.id }, p).then(() => {
            res.status(200).send({
              complete: true,
              given: toadd,
              mult: mult,
              time: tmsg,
              bal: p.money
            });
          })
        }
        return;
      }
    }
    res.status(404).send();
  })
})

function parseTime(ms) {
  var days = 0;
  var hours = 0;
  var minutes = 0;
  var seconds = parseInt(ms / 1000);
  var miliseconds = ms % 1000;
  while (seconds >= 60) {
    minutes++;
    seconds -= 60;
    if (minutes == 60) {
      hours++;
      minutes = 0;
    }
    if (hours == 24) {
      days++
      hours = 0;
    }
  }
  return {
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    miliseconds: miliseconds
  }
}

function parseMention(dataString) {
  var self = this;
  var returnV = dataString;
  returnV = returnV.replace(/\D/g, '');
  return returnV;
}

module.exports = router;
