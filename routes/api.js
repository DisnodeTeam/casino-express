var express = require("express");
var router = express.Router();
var Database = require("../DB");
var config = require("../config");
Database.Connect();

router.use((req, res, next) => {
    if(req.headers.auth && req.headers.auth == config.auth){
        next();
    }else{
        res.status(401).send({error: "You are unauthorized! please provide an `auth` header with a correct auth key!"});
    }
});

router.get("/time", (req, res) => {
    res.send("some time left!");
});
router.get("/cobj",(req, res) => {
    Database.Find("casinoObj", {"id":"cobj"}).then((cobj) => {
        delete cobj[0]["_id"];
        res.status(200).send(cobj[0]);
    })
});
router.put("/cobj", (req,res) => {
    if(req.body){
        if(req.body.id && req.body.id == "cobj"){
            Database.Update("casinoObj", {"id":"cobj"}, req.body.id).then(() => {
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