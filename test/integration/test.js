var assert = require('assert');
var app = require('../../app');
var request = require('supertest');

describe('GET /leagues/:id', function(){
    it('should work', function(done){
        request(app)
        .get('/leagues/172724')
        .end(function(err, res){
            if (err) {
                done(err);
                return;
            }
            assert(res.body.id);
            assert(res.body.name);
            assert(res.body.teams);
            assert.equal(res.body.teams.length, 10);
            done();
        })
    })
})
describe('GET /leagues/:id/recent_activity', function(){
    it('should work', function(done){
        request(app)
        .get('/leagues/172724/recent_activity')
        .end(function(err, res){
            if (err) {
                done(err);
                return;
            }
            assert(res.body.length);
            assert(res.body[0].date);
            assert(res.body[0].time);
            assert(res.body[0].type);
            assert(res.body[0].desc);
            done();
        })
    })
})
describe('GET /leagues/:league_id/scoreboard', () => {
    before(function(){
        return request(app)
            .get('/leagues/172724/recent_activity')
            .then((res) => this.res = res);
    })
    it('should respond 200', function(){
        assert.equal(this.res.status, 200)
    })
    it('should return an array', function(){
        
    })
});
describe('GET /leagues/:league_id/teams/:team_id/news', function(){
    it('should work', function(done){
        request(app)
        .get('/leagues/172724/teams/2/news')
        .end(function(err, res){
            if (err) {
                done(err);
                return;
            }
            assert(res.body.length);
            assert(res.body[0].title);
            assert(res.body[0].date);
            assert(res.body[0].text);
            done();
        })
    })
})
describe('GET /leagues/:league_id/teams/:team_id/roster', function(){
    it('should work', function(done){
        request(app)
        .get('/leagues/172724/teams/2/roster')
        .end(function(err, res){
            if (err) {
                done(err);
                return;
            }
            var positions = ['QB', 'RB', 'WR', 'TE', 'Bench'];
            positions.forEach(function(pos){
                assert(res.body.some(function(rosterspot){
                    return rosterspot.pos == pos;
                }), 'Roster has a spot for ' + pos);
            });
            done();
        })
    })
})
