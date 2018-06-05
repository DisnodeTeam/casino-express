var express = require("express");
var router = express.Router();
var logger = require("disnode-logger"); // Or Logger if ur cool.
var Database = require("../DB");
Database.Connect().then(() => {});



router.use((req, res, next) => {
  if (req.headers.authorization === config.webhook) {
    logger.Success("Webhook Route", "Auth", "IP: " + req.ip + " -> " + req.method + " " + req.url);
    next();
  } else {
    logger.Warning("Webhook Route", "DENY FROM AUTH", "IP: " + req.ip + " -> " + req.method + " " + req.url);
    res.status(401).send({
      error: "You are unauthorized! please provide an `auth` header with a correct auth key!"
    });
  }
});

router.post("/", async (req, res) => {
  if (req.body.type === 'upvote') {
    const [player] = await Database.Find('players', {
      id: req.user.id
    });
    if (player) {
      if (player.voteCount) {
        player.voteCount++;
      } else {
        player.voteCount = 1;
      }
      player.money += (100000 * player.voteCount);
      player.lastVote = new Date().getTime();
      logger.Info('Webhook Route', 'Vote', `${player.name} ${player.id} received $${(100000 * player.voteCount)}`)
      await Database.Update('players', {
        id: player.id
      }, player);
    }
    res.status(200).end();
  } else if (req.body.type === 'test') {
    logger.Info('Webhook Route', 'Test', 'All good');
    res.status(200).end();
  } else {
    res.status(400).send('Bad Request');
  }
});

module.exports = router;
