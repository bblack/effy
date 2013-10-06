var express  = require('express');
var cheerio  = require('cheerio');
var http     = require('http');
var Q        = require('q');
var Mustache = require('mustache');

var app = express();

var getBody = function(url){
    var deferred = Q.defer();

    var req = http.get(url, function(res){
        var body = '';

        res.on('data', function(chk){
            body += chk;
        }).on('end', function(){
            deferred.resolve(body);
        });
    });

    return deferred.promise;
};

app.get('/leagues/:id', function(req, res){
    getBody(Mustache.render('http://games.espn.go.com/ffl/leagueoffice?leagueId={{id}}', {
        id: req.param('id')
    })).then(function(body){
        var $ = cheerio.load(body);

        var teams = $("#games-tabs1 a").map(function(i,e){
            return {
                id:   $(e).attr('href').match(/teamId=(\d*)/)[1],
                name: $(e).contents()[0].data
            }
        });

        res.send({
            id: req.param('id'),
            teams: teams
        });
    }).catch(function(err){
        res.send(err);
    });
});

app.listen(5050);