var url = require('url');
var express  = require('express');
var cheerio  = require('cheerio');
var Promise  = require('bluebird');
var request  = Promise.promisifyAll(require('request'));

var ESPN_PROTO = 'http';
var ESPN_HOST = 'games.espn.go.com';

var app = express()
.get('/leagues/:id', function(req, res){
    var espnUrl = url.format({
        protocol: ESPN_PROTO,
        host: ESPN_HOST,
        pathname: '/ffl/leagueoffice',
        query: {
            leagueId: req.param('id')
        }
    });
    request.getAsync(espnUrl)
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
})
.get('/leagues/:league_id/teams/:team_id/news', function(req, res){
    var espnUrl = url.format({
        protocol: ESPN_PROTO,
        host: ESPN_HOST,
        pathname: '/ffl/playertable/prebuilt/manageroster',
        query: {
            leagueId: req.param('league_id'),
            teamId: req.param('team_id'),
            seasonId: 2015,
            // no idea what the rest of this does
            view: 'news',
            context: 'clubhouse',
            ajaxPath: 'playertable/prebuilt/manageroster',
            managingIr: false,
            droppingPlayers: false,
            asLM: false,
            scoringPeriodId: 1,
            version: 'chrono',
            r: 24668505 // random number for cache bust?
        }
    });
    request.getAsync(espnUrl)
    .spread(function(espnRes){
        var $ = cheerio.load(espnRes.body);
        var stories = $('#lm-newsfeed .feedentry').map(function(i,e){
            // TODO: parse harder
            var $e = $(e);
            return {
                title: $e.find('.feedtitle').text(),
                date: $e.find('.feeddate').text(),
                text: $e.find('.feedcontent .pni-contents').text()
            };
        })
        res.json(stories);
    });
});

module.exports = app;
