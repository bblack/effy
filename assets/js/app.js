requirejs.config({
    paths: {
        angular: '../bower_components/angular/angular.min',
        'angular-resource': '../bower_components/angular-resource/angular-resource.min',
        'angular-route': '../bower_components/angular-route/angular-route.min'
    },
    shim: {
        angular: {
            exports: 'angular'
        },
        'angular-resource': ['angular'],
        'angular-route': ['angular']
    }
})

define(function(require){
    var angular = require('angular');
    require('angular-route');

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
                var url = '/leagues/' + leagueId + '/recent_activity';
                $http.get(url)
                .then(function(res){
                    $scope.actions = res.data;
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
