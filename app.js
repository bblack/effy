var express  = require('express');
var cheerio  = require('cheerio');
var Promise  = require('bluebird');
var Mustache = require('mustache');
var request  = Promise.promisifyAll(require('request'));

var app = express()
.get('/leagues/:id', function(req, res){
    var url = Mustache.render('http://games.espn.go.com/ffl/leagueoffice?leagueId={{id}}', {
        id: req.param('id')
    });
    request.getAsync(url)
    .spread(function(espnRes){
        var $ = cheerio.load(espnRes.body);
        var name = $(".league-team-names h1").text();
        var teams = $("#games-tabs1 a").map(function(i,e){
            return {
                id:   $(e).attr('href').match(/teamId=(\d*)/)[1],
                name: $(e).contents()[0].data
            };
        });
        res.json({
            id   : req.param('id'),
            name : name,
            teams: teams
        });
    });
});

module.exports = app;
