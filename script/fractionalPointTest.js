var util = require('util');
var url = require('url');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var _ = require('underscore');
var request = Promise.promisifyAll(require('request'));

var url_ = url.format({
    protocol: 'http',
    host: 'games.espn.go.com',
    pathname: '/ffl/boxscorefull',
    query: {
        leagueId: 172724,
        teamId: 2,
        scoringPeriodId: 1,
        seasonId: 2015,
        view: 'scoringperiod',
        version: 'full'
    }
});

var SCORING = {
    passYds: 1/25,
    passTds: 4,
    passInts: -2,
    rushYds: 1/10,
    rushTds: 6,
    rcvYds: 1/10,
    rcvTds: 6,
    misc2pt: 2,
    miscFumbles: -2,
    miscTds: 6,
    fgMade: 3,
    xpMade: 1,
    dstTd: 6,
    dstInt: 2,
    dstFR: 2,
    dstSack: 2,
    dstSafety: 2,
    dstBlock: 2,
    dstPA: function(pa) {
        return pa === 0 ? 10 :
            pa <= 6 ? 7 :
            pa <= 13 ? 4 :
            pa <= 17 ? 1 :
            pa <= 27 ? -1 :
            pa <= 34 ? -4 :
            pa <= 45 ? -7 :
            (typeof pa == 'number') ? -10 :
            0;
    }
}

request.getAsync(url_)
.spread(function(res){
    var $ = cheerio.load(res.body);
    var teams = $('.danglerBox.totalScore').map(function(i,e){
        var $e = $(e).parent().parent();
        var skillPlayers = $e.find('table.playerTableTable').eq(0).find(' tr.pncPlayerRow').map(function(i,e){
            var $e = $(e);
            return {
                // attempts and completions: $e.find('td.playertableStat').eq(0).text(),
                passYds: Number($e.find('td.playertableStat').eq(1).text()),
                passTds: Number($e.find('td.playertableStat').eq(2).text()),
                passInts: Number($e.find('td.playertableStat').eq(3).text()),
                // rushCount: Number($e.find('td.playertableStat').eq(4).text()),
                rushYds: Number($e.find('td.playertableStat').eq(5).text()),
                rushTds: Number($e.find('td.playertableStat').eq(6).text()),
                // rcvCount: Number($e.find('td.playertableStat').eq(7).text()),
                rcvYds: Number($e.find('td.playertableStat').eq(8).text()),
                rcvTds: Number($e.find('td.playertableStat').eq(9).text()),
                // rcvTgts: Number($e.find('td.playertableStat').eq(10).text()),
                misc2pt: Number($e.find('td.playertableStat').eq(11).text()),
                miscFumbles: Number($e.find('td.playertableStat').eq(12).text()),
                miscTds: Number($e.find('td.playertableStat').eq(13).text()),
            };
        });
        var kickers = $e.find('table.playerTableTable').eq(1).find(' tr.pncPlayerRow').map(function(i,e){
            var $e = $(e);
            return {
                // fgShort: Number($e.find('td.playertableStat').eq(0).text()),
                // fgMed: Number($e.find('td.playertableStat').eq(1).text()),
                // fgLong: Number($e.find('td.playertableStat').eq(2).text()),
                fgMade: Number($e.find('td.playertableStat').eq(3).text().split('/')[0]),
                xpMade: Number($e.find('td.playertableStat').eq(4).text().split('/')[0])
            };
        })
        var dst = $e.find('table.playerTableTable').eq(2).find(' tr.pncPlayerRow').map(function(i,e){
            var $e = $(e);
            return {
                dstTd: Number($e.find('td.playertableStat').eq(0).text()),
                dstInt: Number($e.find('td.playertableStat').eq(1).text()),
                dstFR: Number($e.find('td.playertableStat').eq(2).text()),
                dstSack: Number($e.find('td.playertableStat').eq(3).text()),
                dstSafety: Number($e.find('td.playertableStat').eq(4).text()),
                dstBlock: Number($e.find('td.playertableStat').eq(5).text()),
                dstPA: Number($e.find('td.playertableStat').eq(6).text())
            }
        })
        var players = skillPlayers.concat(kickers).concat(dst);
        players = players.map(function(p){
            return _.chain(SCORING)
                .map(function(v,k){
                    if (typeof v == 'number') {
                        var count = v;
                        v = function(n) {
                            return n === undefined ? 0 : count * n;
                        }
                    }
                    return v(p[k]);
                })
                .map(Math.floor)
                .reduce(function(memo, points){
                    return memo + points;
                }, 0)
                .value();
        });
        var team = {
            players: players
        };
        return team;
    });
    console.log(util.inspect(teams, {depth: null}));
})
