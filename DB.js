var mongo = require("mongodb").MongoClient;
var config = require("./config");
var log = require("disnode-logger");
this.db = null;
module.exports.Connect = () => {
    var self = this;
    return new Promise(function (resolve, reject) {
        mongo.connect("mongodb://" + config.username + ":" + config.pass + "@" + config.host).then(function(db){
            if(self.int != null){
                clearInterval(self.int);
                self.int = null;
            }
            self.db = db;
            self.db.on('close', function () {
                log.Error("DB", "Disconnect", "Disconnected from DB! Attempting Reconnect!");
                self.AttemptReconnect();
            });
            log.Success("DB", "Connect", "Connected to DB!");
            resolve();
        })
    });
}
module.exports.Update = (collection, identifier, newData) => {
    var self = this;
    return new Promise(function (resolve, reject) {
        var _collection = self.db.collection(collection);
	    _collection.updateOne(identifier, {$set : newData}, {upsert: true}, function (err, result) {
		    if(err){
                reject(err);
                return;
            }
			resolve(result);
		});
	});
}
module.exports.Find = (collection, search) => {
    var self = this;
    return new Promise(function (resolve, reject) {
        var _collection = self.db.collection(collection);
        _collection.find(search, function (err, docs) {
            if(err){
                reject(err);
                return;
            }
            resolve(docs.toArray());
        });
    });
}
module.exports.AttemptReconnect = () => {
    this.int = setInterval(() => {
        log.Success("DB", "Reconnect", "Attempting to reconnect.");
        this.Connect();
    }, 5000);
}
module.exports.GetDB = () => {
    return this.db;
}