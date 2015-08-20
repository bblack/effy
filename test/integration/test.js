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
