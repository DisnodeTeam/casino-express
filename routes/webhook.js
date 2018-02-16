var express = require("express");
var router = express.Router();
var log = require("disnode-logger");
var Database = require("../DB");
Database.Connect().then(() => {});

router.post("/", (req, res) => {
  Database.Find("players", {
    id: req.body.user
  }).then((player) => {
    if (player[0] != undefined) {
      if (player[0].voteCount == undefined) {
        player[0].voteCount = 1;
      } else {
        player[0].voteCount++;
      }
      player[0].money += (100000 * player[0].voteCount);
      Database.Update('players', {
        id: player[0].id
      }, player[0]);
    }
    res.status(200);
  })
});
module.exports = router;
