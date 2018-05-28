var express = require("express");
var router = express.Router();
var logger = require("disnode-logger"); // Or Logger if ur cool.
var Database = require("../DB");
Database.Connect().then(() => {});


router.post("/", (req, res) => {
  if (req.body.type == 'upvote') {
    Database.Find("players", {
      id: req.body.user
    }).then((player) => {
      if (player[0] != undefined) {
        if (true) {
          if (player[0].voteCount == undefined) {
            player[0].voteCount = 1;
          } else {
            player[0].voteCount++;
          }
          player[0].money += (100000 * player[0].voteCount);
          player[0].lastVote = new Date().getTime()
          logger.Info('WebhookRouter', 'Voted', `${player[0].name} ${player[0].id} received $${(100000 * player[0].voteCount)}`)
          Database.Update('players', {
            id: player[0].id
          }, player[0]);
        } else logger.Info('WebhookRouter', 'Voted Already', `${player[0].name} ${player[0].id}`)
      }
    })
  }
  res.status(200);
});
module.exports = router;
