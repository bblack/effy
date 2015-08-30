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
                $scope.positions = ['QB', 'RB', 'WR', 'TE', 'D/ST', 'K'];
                $scope.chartController = function($scope, $element, $compile){
                    var d3 = require('d3');
                    var datacount = 50;
                    $scope.h = 400;
                    $scope.setHoverDatum = function(d){
                        $scope.hoverdatum = _.findWhere($scope.data, {id: d});
                    }

                    $http.get('/leagues/' + $routeParams.league_id + '/players', {
                        params: {
                            position: $scope.pos
                        }
                    })
                    .then(function(res){
                        var data = $scope.data = res.data;
                        d3.select($element.find('div')[0]) // find('.chart') doesn't work, who knows
                        .selectAll('.bar')
                        .data(data)
                        .enter()
                        .append('div')
                        .attr('class', 'bar')
                        .style({
                            height: function(datum){ return datum.stats.points + 'px'; },
                            top: $scope.h - data[0].stats.points,
                            width: (100 / datacount) + '%'
                        })
                        .attr('ng-mouseenter', function(d){ return 'setHoverDatum("' + d.id + '")'; })
                        .attr('ng-mouseleave', 'hoverdatum = null')

                        d3.select($element[0])
                            .selectAll('.x-gridlines')
                            .data([10, 20, 30, 40])
                            .enter()
                            .append('div')
                            .attr('class', 'x-gridlines')
                            .style({
                                display: 'inline-block',
                                height: '100%',
                                width: '1px',
                                'background-color': 'rgba(255,255,255,0.25)',
                                position: 'absolute',
                                top: 0,
                                left: function(d){ return d / datacount * 100 + '%'; }
                            });

                        d3.select($element[0])
                            .selectAll('.y-gridlines')
                            .data([50,100,150,200,250,300,350])
                            .enter()
                            .append('div')
                            .attr('class', 'y-gridlines')
                            .style({
                                display: 'inline-block',
                                width: '100%',
                                height: '1px',
                                'background-color': 'rgba(255,255,255,0.25)',
                                position: 'absolute',
                                left: 0,
                                top: function(d){ return d + 'px'; }
                            });

                        $compile($element.find('div')[0])($scope);
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
