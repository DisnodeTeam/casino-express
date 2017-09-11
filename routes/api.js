var express = require("express");
var router = express.Router();
var log = require("disnode-logger");
var Database = require("../DB");
var config = require("../config");
var upd;
Database.Connect().then(() => {
    upd = new Updater(Database);
});
var Updater = require("../updater");

router.use((req, res, next) => {
    if(req.headers.auth && req.headers.auth == config.auth){
        log.Success("CasinoRouter", "Auth", "IP: " + req.ip + " Was granted access with auth: " + req.headers.auth + " to " + req.method + " " + req.url);
        next();
    }else{
        log.Warning("CasinoRouter", "DENY FROM AUTH", "IP: " + req.ip + " Was denied access with auth: " + req.headers.auth + " to " + req.method + " " + req.url);
        res.status(401).send({error: "You are unauthorized! please provide an `auth` header with a correct auth key!"});
    }
});

router.get("/time", (req, res) => {
    res.status(200).send(upd.getTimeRemain());
});
router.get("/cobj",(req, res) => {
    Database.Find("casinoObj", {"id":"cobj"}).then((cobj) => {
        delete cobj[0]["_id"];
        res.status(200).send(cobj[0]);
    })
});
router.post("/cobj", (req,res) => {
    if(req.body){
        if(req.body.id && req.body.id == "cobj"){
            Database.Update("casinoObj", {"id":req.body.id}, req.body).then(() => {
                res.status(200).send();
            })
        }else{
            res.status(400).send({error: "Invalid Body"});
        }
    }else{
        res.status(400).send({error: "No Body"});
    }
})


module.exports = router;