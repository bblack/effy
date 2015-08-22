var url = require('url');
var express  = require('express');
var cheerio  = require('cheerio');
var Promise  = require('bluebird');
var request  = Promise.promisifyAll(require('request'));

var ESPN_PROTO = 'http';
var ESPN_HOST = 'games.espn.go.com';
var SEASON = new Date().getFullYear();

var app = express()
.use(express.static('assets'))
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
.get('/leagues/:id/recent_activity', function(req, res){
    var espnurl = url.format({
        protocol: ESPN_PROTO,
        host: ESPN_HOST,
        pathname: '/ffl/leagueoffice',
        query: {
            leagueId: req.param('id'),
            seasonId: SEASON
        }
    });
    request.getAsync(espnurl)
    .spread(function(espnres){
        var $ = cheerio.load(espnres.body);
        var actions = $('ul#lo-recent-activity-list li.lo-recent-activity-item')
        .map(function(i,e){
            var $e = $(e);
            return {
                date: $e.find('.recent-activity-date').text(),
                time: $e.find('.recent-activity-time').text(),
                type: $e.find('.recent-activity-image').attr('class')
                    .split(' ').reverse()[0],
                // TODO: parse harder
                desc: $e.find('.recent-activity-description').text()
            };
        });
        res.json(actions);
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
            seasonId: SEASON,
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
})
.get('/leagues/:league_id/teams/:team_id/roster', function(req, res){
    var espnurl = url.format({
        protocol: ESPN_PROTO,
        host: ESPN_HOST,
        pathname: '/ffl/clubhouse',
        query: {
            leagueId: req.param('league_id'),
            teamId: req.param('team_id'),
            seasonId: SEASON
        }
    });
    request.getAsync(espnurl)
    .spread(function(espnres){
        var $ = cheerio.load(espnres.body);
        var rosterSpots = $('table.playerTableTable tr.pncPlayerRow').map(function(i,e){
            var playerAnchor = $(e).find('td').eq(1).find('a').eq(0)
            return {
                pos: $(e).find('td').eq(0).text(),
                player: {
                    id: playerAnchor.attr('playerid'),
                    name: playerAnchor.text()
                }
            };
        });
        res.json(rosterSpots);
    })
});

module.exports = app;
