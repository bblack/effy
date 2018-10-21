var url = require('url');
var _ = require('underscore');
var express  = require('express');
var cheerio  = require('cheerio');
var Promise  = require('bluebird');
var request  = Promise.promisifyAll(require('request'));

var ESPN_PROTO = 'http';
var ESPN_HOST = 'games.espn.go.com';
var SEASON = new Date().getFullYear();

function getLeagueRecentActivity($){
    return $('ul#lo-recent-activity-list li.lo-recent-activity-item')
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
}

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
        var teams = [];
        var currentDivision;
        $('.lo-sidebar-box').eq(-1).find('table tr').map(function(i,e){
            var $e = $(e);
            var newDivision = $e.find('td.division-name');
            if (newDivision.length) {
                currentDivision = newDivision.text();
                return;
            }
            var teamLink = $e.find('td').eq(1).find('a');
            if (!teamLink.length) return;
            var teamName = teamLink.text();
            var teamId = teamLink.attr('href').match(/teamId=(\d*)/)[1];
            var team = {name: teamName, id: teamId};
            var record = $e.find('td').eq(2).text().split('-');
            team.wins = Number(record[0]);
            team.losses = Number(record[1]);
            team.division = currentDivision;
            teams.push(team);
        });
        res.json({
            id   : req.param('id'),
            name : name,
            teams: teams,
            recent_activity: getLeagueRecentActivity($),
            manager_note: $('.lm-note-body').html()
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
        var actions = getLeagueRecentActivity($);
        res.json(actions);
    });
})
.get('/leagues/:id/scoreboard', function(req, res){
    console.log('garbage')
    var espnurl = url.format({
        protocol: ESPN_PROTO,
        host: ESPN_HOST,
        pathname: '/ffl/scoreboard',
        query: {
            leagueId: req.param('id'),
            seasonId: SEASON,
            matchupPeriodId: req.param('week')
        }
    });
    request.getAsync(espnurl)
    .spread(function(espnres){
        console.log('crap')
        var $ = cheerio.load(espnres.body);
        var matchups = $('#scoreboardMatchups table.matchup').map(function(i,e){
            var sides = $(e).find('tr').slice(0, 2).map(function(i,e){
                var teamAnchor = $(e).find('a').eq(0);
                var team = {
                    id: teamAnchor.attr('href').match('teamId=([0-9]+)')[1],
                    name: teamAnchor.text(),
                    record: $(e).find('.record').text(), // TODO: parse harder
                };
                return {
                    team: team,
                    score: Number($(e).find('td.score').text())
                };
            });
            return sides;
        });
        console.log('ok')
        console.log(matchups)
        res.json(matchups);
    });
})
.get('/leagues/:league_id/players', function(req, res){
    var SLOT_CATEGORY_ID = {
        QB: 0,
        RB: 2,
        WR: 4,
        TE: 6,
        'D/ST': 16,
        K: 17
    };
    var espnurl = url.format({
        protocol: ESPN_PROTO,
        host: ESPN_HOST,
        // pathname: '/ffl/playertable/prebuilt/freeagency',
        pathname: '/ffl/leaders',
        query: {
            leagueId: req.param('league_id'),
            seasonId: req.param('season'),
            avail: -1, // -1: all, 1: FA
            slotCategoryId: SLOT_CATEGORY_ID[req.param('position')]
        }
    });
    request.getAsync(espnurl)
    .spread(function(espnres){
        var $ = cheerio.load(espnres.body);
        var lines = $('table.playerTableTable tr.pncPlayerRow').map(function(i,e){
            var $e = $(e);
            var playerAnchor = $e.find('td.playertablePlayerName a');
            var teamAndPos = $e.find('td.playertablePlayerName').contents().eq(1).text().split(/\s+/);
            return {
                id: playerAnchor.attr('playerid'),
                name: playerAnchor.text(),
                team: teamAndPos[1],
                pos: teamAndPos[2],
                stats: {
                    points: parseInt($e.find('td.playertableStat.appliedPoints').eq(0).text())
                }
            };
        });
        res.send(lines);
    });
})
.get('/leagues/:league_id/teams/:team_id/news', function(req, res){
    // need to be auth'd for this
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
            var playerAnchor = $(e).find('td').eq(1).find('a').eq(0);
            var player = !playerAnchor.length ? null : {
                id: playerAnchor.attr('playerid'),
                name: playerAnchor.text()
            }
            return {
                pos: $(e).find('td').eq(0).text(),
                player: player
            };
        });
        res.json(rosterSpots);
    })
});

module.exports = app;
