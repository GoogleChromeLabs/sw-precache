/* eslint-disable no-unused-vars */
/* global angular:true */

var app = angular.module('app', []);

app.controller('MainCtrl', ['$scope', function($scope) {
  $scope.items = [
    'AngularJS is cached',
    'And ready to be used offline'
  ];
}]);
