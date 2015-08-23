requirejs.config({
    paths: {
        angular: '../bower_components/angular/angular.min',
        'angular-resource': '../bower_components/angular-resource/angular-resource.min',
        'angular-route': '../bower_components/angular-route/angular-route.min',
        underscore: '../bower_components/underscore/underscore-min'
    },
    shim: {
        angular: {
            exports: 'angular'
        },
        'angular-resource': ['angular'],
        'angular-route': ['angular'],
        underscore: {
            exports: '_'
        }
    }
})

define(function(require){
    var angular = require('angular');
    require('angular-route');
    var _ = require('underscore');

    angular.module('effy', ['ngRoute'])
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
                var leagueId = $routeParams.league_id;
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
            },
            templateUrl: '/templates/leagues/recent_activity.html'
        })
        .otherwise({
            controller: function($scope, $route){
                console.log($route);
            }
        })
    });
    angular.bootstrap(document.body, ['effy']);
})
