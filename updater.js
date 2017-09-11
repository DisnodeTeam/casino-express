const axios = require("axios");
const Countdown = require('countdownjs');

class Updater {
    constructor(DB){
        this.DB = DB;
        this.firstupdate = true;
        this.startUpdating();
    }
    startUpdating(){
        var self = this;
        self.updateCoroutine();
        if(self.timer)self.timer.stop();
        self.updateUltraUsers();
        self.timer = new Countdown(1800000,function(){
            self.startUpdating();
        });
        self.timer.start();
    }
    getTimeRemain(){
        var self = this;
        var msleft = self.timer.getRemainingTime();
        var tobj = self.getElapsedTime(msleft);
        var returnobj = {
            minutes: tobj.minutes,
            seconds: tobj.seconds,
            readable: tobj.minutes + " Minutes, " + tobj.seconds + " Seconds."
        }
        return returnobj;
    }
    GetUltraUsers(){
        var self = this;
        return new Promise(function (resolve, reject) {
            axios.get("https://api.disnodeteam.com/user/ultra")
            .then(function (res) {
                if (res.data.type == "ERR") {
                    reject(res.data.data);
                     return;
                 }
                resolve(res.data.data);
            }).catch(function (err) {
                reject(err.message)
            })
        });
      }
    updateUltraUsers(){
      var self = this;
      var currentUltras = [];
      var ultras = [];
      var apiUltra = [];
      var newUltra = [];
      var notInApi = [];
      self.DB.Find("players", {}).then(function(players) {
        for (var i = 0; i < players.length; i++) {
          if(players[i].Premium){
            currentUltras.push(players[i]);
          }
        }
        self.GetUltraUsers().then(function(apiUltra){
            ultras = JSON.parse(JSON.stringify(apiUltra));
            for(var i = 0; i < currentUltras.length; i++){
              var found = false;
              for(var j = 0; j < ultras.length; j++){
                if(currentUltras[i].id == ultras[j].id){
                  found = true;
                  break;
                }
              }
              if(!found){
                notInApi.push(currentUltras[i]);
              }
            }
            for(var i = 0; i < ultras.length; i++){
              var found = false;
              for(var j = 0; j < currentUltras.length; j++){
                if(currentUltras[j].id == ultras[i].id){
                  found = true;
                  break;
                }
              }
              if(!found){
                newUltra.push(ultras[i]);
              }
            }
            for(var i = 0; i < newUltra.length; i++){
                self.DB.Find("players", {"id":newUltra[i].id}).then((data) =>{
                    var p = data[0];
                    delete p["_id"];
                    p.Premium = true;
                    self.DB.Update("players", {"id":p.id}, p);
                });
            }
            for(var i = 0; i < notInApi.length; i++){
                self.DB.Find("players", {"id":notInApi[i].id}).then((data) =>{
                    var p = data[0];
                    delete p["_id"];
                    p.Premium = false;
                    self.DB.Update("players", {"id":p.id}, p);
                });
            }
        });
      });
    }
    getElapsedTime(ms){
        var days = 0;
        var hours = 0;
        var minutes = 0;
        var seconds = parseInt(ms / 1000);
        var miliseconds = ms % 1000;
        while (seconds > 60) {
          minutes++;
          seconds -= 60;
          if (minutes == 60) {
            hours++;
            minutes = 0;
          }
          if(hours == 24){
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
    updateLastSeen(player){
        var date = new Date().getTime();
        player.lastSeen = parseInt(date);
    }
    canGetIncome(player){
      var self = this;
      var date = new Date().getTime();
      var elapsed = date - player.lastSeen;
      var elapsedObj = self.getElapsedTime(elapsed);
      if((elapsedObj.days >= 2)){
        return false;
      }
      return true;
    }
    updateCoroutine(){
        var self = this;
        self.DB.Find("players", {}).then(function(players) {
          for (var i = 0; i < players.length; i++) {
            if(players[i].lastSeen == undefined){
              self.updateLastSeen(players[i]);
            }
            if(players[i].rules == undefined){
              players[i].rules = false;
            }
            if(self.canGetIncome(players[i])){
              players[i].money += players[i].income;
            }
            players[i].lastMessage = null;
            self.DB.Update("players", {"id":players[i].id}, players[i]);
          }
        });
      }
}
module.exports = Updater;