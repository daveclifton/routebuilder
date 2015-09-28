"use strict";


var routebuilderApp = angular.module('routebuilderApp',['ngRoute','ngMap','ui.sortable','auth0','angular-storage','angular-jwt']);

//////////////////////////////////////////////////////////////////////
// RoutingController
//
routebuilderApp.config(function($routeProvider) {
    $routeProvider
        .when('/',                  { templateUrl: '/static/home.html',  controller:'RouteController as route', })
        .when('/about',             { templateUrl: '/static/about.html', controller:'RouteController as route' })
        .when('/route/:route_name', { templateUrl: '/static/route.html', controller:'RouteController as route' })
        .otherwise({ redirectTo: '/' });
});


/////////////////////////////////////////////////////////////////////////////
// Authentication, from https://auth0.com
//
// Google client ID 134951784568-e86bnelnpbuijo76ccqfje9q6g5gb4u9.apps.googleusercontent.com
//
routebuilderApp.config(function (authProvider) {
        authProvider.init({
            domain: 'routebuilder.eu.auth0.com',
            clientID: 'bEqVjIJFSjBygHI5JVZWgGcjAJV30eFK'
        });
    });

routebuilderApp.run(function(auth) {
        // This hooks al auth events to check everything as soon as the app starts
          auth.hookEvents();
    });

routebuilderApp.controller('LoginCtrl', ['$scope', '$http', 'auth', 'store', '$location',
    function ($scope, $http, auth, store, $location) {

        $scope.auth = auth; // Make auth visible!

        $scope.login = function () {
            auth.signin({}, function (profile, token) {
                console.log(profile);
                store.set('profile', profile);
                store.set('token', token);
                $location.path('/');
            }, function () {
                console.error( "ERROR from login controller" );
                // Error callback
            });
        }

        $scope.logout = function() {
            auth.signout();
            store.remove('profile');
            store.remove('token');
        }
    }]);

routebuilderApp.run(function($rootScope, auth, store, jwtHelper, $location) {
      // This events gets triggered on refresh or URL change
      $rootScope.$on('$locationChangeStart', function() {
        var token = store.get('token');

        if (token) {
          if (!jwtHelper.isTokenExpired(token)) {
            if (!auth.isAuthenticated) {
              auth.authenticate(store.get('profile'), token);
            }
          } else {
            // Either show the login page or use the refresh token to get a new idToken
            $location.path('/');
          }
        }
      });
    });

routebuilderApp.config(function (authProvider, $routeProvider, $httpProvider, jwtInterceptorProvider) {

        jwtInterceptorProvider.tokenGetter = ['store', function(store) {
            return store.get('token');
        }];

        $httpProvider.interceptors.push('jwtInterceptor');
    });


//////////////////////////////////////////////////////////////////////
// RouteController
//
routebuilderApp.controller('RouteController', [
        '$scope', '$http', '$routeParams', 'RouteService', 'DirectionsService', '$location',
        function($scope, $http, $routeParams, RouteService, DirectionsService, $location) {

    var self = this;
    var selected = null;   // Either the null (route overview) or a waypoint

    self.details = RouteService.details;

    self.add_waypoint = function() {
        self.select( RouteService.add_waypoint() );
        return( selected );
    };

    self.route_list = function() {
        return( RouteService.route_list())
    };

    self.select = function(item) {
        if ( $scope.routeForm.$valid == true ) {
            selected = item;
        }
    };

    self.is_selected = function(item) {
        return( item == selected )
    };

    $scope.$watch('routeForm.$invalid', function(new_val,old_val) {
        if ( selected ) {
            selected.invalid = new_val
        }
    });


    ////////////////////////////////////////////////////////////////////////
    // Google Maps controls
    //
    var render_manager = {};    // managers all rendered directions

    $scope.$on('mapInitialized', function(evt, evtMap) {
        self.map = evtMap;
        for ( var i in render_manager ) {
            render_manager[i].setMap(self.map);
        }
    });

    $scope.on_dragend = function(event,waypoint) {
        move_waypoint( waypoint, event.latLng.lat(), event.latLng.lng() );
    };

    $scope.on_click = function(event) {
        if ( self.is_selected(null) ) {
            waypoint = self.add_waypoint();
        }
        move_waypoint( selected, event.latLng.lat(), event.latLng.lng() );
    };

    $scope.click_marker = function(event) {
        console.log( "CLICKED MARKER", event );
        map.setCenter(event.latLng);
        //map.setZoom(8);
    };

    var move_waypoint = function(waypoint,lat,lng) {
        waypoint.lat = lat;
        waypoint.lng = lng;
        draw_directions_for_waypoint(waypoint);
    };

    //////////////////////////////////////////////////////////////////////////
    // Google Maps rendered lines / directions
    //
    var draw_directions_for_waypoint = function(waypoint) {
        waypoints = self.details().waypoints;
        i = waypoints.indexOf(waypoint);
        DirectionsService.get_directions( waypoints[i-1], waypoint, self.render_directions );
        DirectionsService.get_directions( waypoint, waypoints[i+1], self.render_directions );
    }

    var draw_all_directions = function() {
        var waypoints = self.details().waypoints;
        for ( var i in waypoints ) {
            DirectionsService.get_directions(waypoints[i], waypoints[parseInt(i)+1], self.render_directions);
        }
    }

    // After drag/drop sorting, redraw all routes
    $scope.sortableOptions = {
        stop: function(e, ui)   {
            for ( var i in render_manager ) {
                render_manager[i].setMap(null);
            }
            draw_all_directions()
        },
    };

    self.render_directions = function(directions, origin, destination) {
        var line = new google.maps.DirectionsRenderer({
            map: self.map,
            directions: directions,
            polylineOptions: { strokeColor: '#FF0000' }
        });

        render_manager["ORIGIN:"+origin.$$hashKey] && render_manager["ORIGIN:"+origin.$$hashKey].setMap(null);
        render_manager["ORIGIN:"+origin.$$hashKey] = line;

        render_manager["DESTINATION:"+destination.$$hashKey] && render_manager["DESTINATION:"+destination.$$hashKey].setMap(null);
        render_manager["DESTINATION:"+destination.$$hashKey] = line;
    }

    ///////////////////////////////////////////////////////////////////
    // Load / Save functions. Not right here!
    //
    if ( $routeParams.route_name ) {
        RouteService.load($routeParams.route_name, draw_all_directions);
    }

    self.save = function() {
        var slug = self.details().title
                .toLowerCase()
                .replace(/[^\w ]+/g, '')    // del non-word chars
                .replace(/\s/g, '-')        // spaces to -
                .replace(/\-\-+/g, '-')     // multiple -'s
                .replace(/^-+/, '')         // trim start
                .replace(/-+$/, '');        // trim end

        RouteService.save( slug );
    };


    ///////////////////////////////////////////////////////////////////
    // MP3 Player
    //
    self.audio_player = function() {
        var href = $('#audio').children('audio').attr('src');
        $.template('audioTemplate', '<audio src="'+selected.audio_file+'" controls>');
        if (Modernizr.audio.mp3) {
            $('#audio').empty();
            $.tmpl('audioTemplate', {src: href}).appendTo($('#audio'));
        }
    };
}]);


//////////////////////////////////////////////////////////////////////
// RouteService
//
routebuilderApp.factory('RouteService', ['$http', function($http) {
    var self = this;

    // Default = New route
    self.details = { title: "New Route",
                     image: "http://www.rightmove.co.uk/overseas-magazine/files/2012/11/Pin-on-Map2.jpg",
                     color: "#FF0000",
                     waypoints: [] };

    ////////////////////////////////

    self.route_list = [];

    $http.get("/routes")
    .then(
        function(response) {
            self.route_list = angular.fromJson( response.data );
        },
        function(errResponse) {
            console.error(errResponse.status, ' fetching routes');
        }
    );
    ////////////////////////////////

    return {
        details: function() {
            return self.details
        },

        set: function(details) {
            self.details = details;
        },

        add_waypoint: function() {
            var new_waypoint = {
                title: "New Waypoint",
                image: "http://thistimeimeanit.com/wp-content/uploads/2013/04/road-sign-with-question-mark.jpg"
            }
            self.details.waypoints.push( new_waypoint );
            return( new_waypoint );
        },

        ///////////////////////////////////////////////////////////////////
        //  Botched way of loading the data
        //
        route_list: function() {
            return(self.route_list)
        },

        load: function(slug, callback) {
            if ( ! slug ) {
                return;
            };

            $http.get("/load/"+slug).then(
                function(response) {
                    self.details = angular.fromJson( response.data );
                    callback()
                }, function(errResponse) {
                    console.error(errResponse.status, ' fetching route ', "/load/"+slug);
        })},

        save: function(slug) {
            $http.post("/save/"+slug, self.details ).then(
                    function(response) {
                        /// NEED SOMETHING HERE
                   }, function(errResponse) {
                       console.error(errResponse.status, ' saving route ', "/save/"+slug);
        })},
    };
}]);


//////////////////////////////////////////////////////////////////////
// google.maps.directionService Service (with caching)
//
routebuilderApp.factory('DirectionsService', [ function() {

    var self = this;
    var directionsService = new google.maps.DirectionsService;
    var directions_cache = {};

    function get_directions(origin, destination, render_callback) {

        if ( ! origin || ! destination ) {
            return;
        }

        var key = origin.lat+","+origin.lng+","+destination.lat+","+destination.lng+",";

        if ( directions_cache[key] ) {
            render_callback(directions_cache[key],origin,destination);
            return;
        }

        directionsService.route( {
              origin:      new google.maps.LatLng(origin.lat,     origin.lng),
              destination: new google.maps.LatLng(destination.lat,destination.lng),
              travelMode:  google.maps.TravelMode.WALKING
              //travelMode:  google.maps.TravelMode.TRANSIT,
              //transitOptions:  { modes: [ google.maps.TransitMode.BUS ] }
            },

            function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    console.error("DirectionsService:","OK");
                    directions_cache[key] = response;
                    render_callback(directions_cache[key],origin,destination);
                } else if ( status = 'OVER_QUERY_LIMIT' ) {
                    // Only 10 calls per second, wait, then retry.
                    setTimeout(function() {get_directions(origin, destination, render_callback) }, 1500 )
                } else {
                    console.error("DirectionsService:",status);
                }
            }
        );
    };

    return {
        get_directions: get_directions
    };
}]);
