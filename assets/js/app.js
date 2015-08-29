requirejs.config({
    paths: {
        angular: '../bower_components/angular/angular.min',
        'angular-resource': '../bower_components/angular-resource/angular-resource.min',
        'angular-route': '../bower_components/angular-route/angular-route.min',
        d3: '../bower_components/d3/d3',
        underscore: '../bower_components/underscore/underscore-min'
    },
    shim: {
        angular: {
            exports: 'angular'
        },
        'angular-resource': ['angular'],
        'angular-route': ['angular'],
        d3: {
            exports: 'd3'
        },
        underscore: {
            exports: '_'
        }
    }
})

define(function(require){
    var angular = require('angular');
    require('angular-resource');
    require('angular-route');
    var _ = require('underscore');

    angular.module('effy', ['ngResource', 'ngRoute'])
    .config(function($locationProvider, $routeProvider){
        $locationProvider.html5Mode(true);
        $routeProvider
        .when('/', {
            controller: function($scope, $route, $routeParams){
                console.log($route);
            }
        })
        .when('/leagues/:league_id', {
            controller: function($scope, $routeParams, $http){
                var leagueId = $scope.leagueId = $routeParams.league_id;
                var url = '/leagues/' + leagueId;
                $http.get(url)
                .then(function(res){
                    $scope.actions = res.data.recent_activity;
                    var teams = res.data.teams;
                    $scope.divisions = _.chain(teams)
                        .sortBy('wins')
                        .reverse()
                        .groupBy('division')
                        .value();
                    $scope.manager_note = res.data.manager_note;
                });
                $http.get('/leagues/' + leagueId + '/scoreboard')
                .then(function(res){
                    $scope.matchups = res.data;
                });
            },
            templateUrl: '/templates/leagues/recent_activity.html'
        })
        .when('/leagues/:league_id/stats', {
            controller: function($scope, $routeParams, $http) {
                var d3 = require('d3');
                $scope.positions = ['QB', 'RB', 'WR', 'TE', 'D/ST', 'K'];
                $scope.chartController = function($scope, $element){
                    $http.get('/leagues/' + $routeParams.league_id + '/players', {
                        params: {
                            position: $scope.pos
                        }
                    })
                    .then(function(res){
                        d3.select($element[0])
                        .selectAll('div')
                        .data(res.data)
                        .enter()
                        .append('div')
                        .style({
                            width: function(datum){ return datum.stats.points + 'px'; },
                            'background-color': '#004060',
                            color: 'white',
                            'font-size': '50%',
                            'white-space': 'nowrap',
                            overflow: 'hidden',
                        })
                        .text(function(datum){ return datum.name; });
                    });
                };
            },
            templateUrl: '/templates/leagues/stats.html'
        })
        .when('/leagues/:league_id/teams/:team_id', {
            controller: function($scope, $routeParams, Team, $http){
                var leagueId = $routeParams.league_id;
                var teamId = $routeParams.team_id;
                // var params = {league_id: leagueId, team_id: teamId};
                // $scope.team = Team.get(params);
                $http.get('/leagues/' + leagueId + '/teams/' + teamId + '/roster')
                .then(function(res){
                    $scope.roster = res.data;
                });
            },
            templateUrl: '/templates/leagues/teams/show.html'
        })
        .otherwise({
            controller: function($scope, $route){
                console.log($route);
            }
        })
    })
    .factory('Team', function($resource, $http){
        var teamUrl = '/leagues/:league_id/teams/:team_id';
        var Team = $resource(teamUrl);
        return Team;
    })
    angular.bootstrap(document.body, ['effy']);
})
