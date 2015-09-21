
var routebuilderApp = angular.module('routebuilderApp', [ 'ngRoute', 'ngMap', 'ui.sortable' ]);

//////////////////////////////////////////////////////////////////////
// RoutingController
//
routebuilderApp.config(function($routeProvider) {

    $routeProvider
    .when('/about', {
        templateUrl: '/static/about.html',
        controller: 'RouteController as route'
    })
    .when('/', {
        templateUrl: '/static/home.html',
        controller:'RouteController as route',
    })
    .when('/route/:route_name', {
        templateUrl: '/static/route.html',
        controller:'RouteController as route',

        //resolve: {
        //    auth: ['$q', '$location', 'UserService',
        //        function($q, $location, UserService) {
        //           return UserService.session().then(
        //               function(success) {},
        //               function(err) {
        //                  $location.path('/login');
        //                  $location.replace();
        //                  return $q.reject(err);
        //           });
        //        }]
        //     }
        //
        })
    .otherwise({
        redirectTo: '/'
    });
  });



//////////////////////////////////////////////////////////////////////
// RouteController
//
routebuilderApp.controller('RouteController', [
                '$scope', '$http', '$routeParams', 'RouteService', 'DirectionsService', '$location',
                function($scope, $http, $routeParams, RouteService, DirectionsService, $location) {
    var self = this;

    self.details       = RouteService.details;
    self.selected_item = null;   // Either the route overview or a waypoint


    self.selected_form = function() {
        return( (self.selected_item)?"waypoint":"route" );
    }

    self.add_waypoint = function() {
        self.selected_item = RouteService.add_waypoint();
        return( self.selected_item );
    }


    ////////////////////////////////////////////////////////////////////////
    // Google Maps controller.
    //

    $scope.$on('mapInitialized', function(evt, evtMap) {
        self.map = evtMap;
    });

    $scope.on_dragend = function(event,waypoint) {
        move_waypoint( waypoint, event.latLng.lat(), event.latLng.lng() );
    };

    $scope.on_click = function(event) {
        if ( ! self.selected_item ) {
            waypoint = self.add_waypoint();
        }
        move_waypoint( self.selected_item, event.latLng.lat(), event.latLng.lng() );
        //map.setZoom(8);
        //map.setCenter(marker.getPosition());
    };

    $scope.click_marker = function(event) {
        console.log( "CLICKED MARKER", event );
        map.setCenter(event.latLng);
        //map.setZoom(8);
    };

    move_waypoint = function(waypoint,lat,lng) {
        waypoint.lat = lat;
        waypoint.lng = lng;
        draw_directions_for_waypoint(waypoint);
    };


    //////////////////////////////////////////////////////////////////////////
    // Google Maps rendered lines / directions
    //

    var render_manager = [];

    draw_directions_for_waypoint = function(waypoint) {
        waypoints = self.details().waypoints;
        i = waypoints.indexOf(waypoint);
        DirectionsService.get_directions( waypoints[i-1], waypoint, render_directions );
        DirectionsService.get_directions( waypoint, waypoints[i+1], render_directions );
    }

    draw_all_directions = function() {
        waypoints = self.details().waypoints;
        for ( i in waypoints ) {
            DirectionsService.get_directions(waypoints[i], waypoints[parseInt(i)+1], render_directions);
        }
    }

    // After drag/drop sorting, redraw all routes
    $scope.sortableOptions = {
        stop: function(e, ui)   {
            for ( i in render_manager ) {
                render_manager[i].setMap(null);
            }
            draw_all_directions()
        },
    };

    render_directions = function(directions, origin, destination) {
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

    self.save_route = function() {
        RouteService.save_route("/save/my_route");
    };


    ///////////////////////////////////////////////////////////////////
    // MP3 Player
    //
    self.audio_player = function() {
        href = $('#audio').children('a').attr('href');
        $.template('audioTemplate', '<audio src="'+self.selected_item.audio_file+'" controls>');
        if (Modernizr.audio.mp3) {
            $('#audio').empty();
            $.tmpl('audioTemplate', {src: href}).appendTo($('#audio'));
        }
    };

} ] );


//////////////////////////////////////////////////////////////////////
// RouteService
//
routebuilderApp.factory('RouteService', ['$http', function($http) {
    var self = this;

    // Default = New route
    self.details = { title: "New Route",
                     image: "http://www.rightmove.co.uk/overseas-magazine/files/2012/11/Pin-on-Map2.jpg",
                     waypoints: [] };

    return {
        details: function() {
            return self.details
        },

        set: function(details) {
            self.details = details;
        },

        add_waypoint: function() {
            new_waypoint = {
                title: "New Waypoint",
                image: "http://thistimeimeanit.com/wp-content/uploads/2013/04/road-sign-with-question-mark.jpg"
            }
            self.details.waypoints.push( new_waypoint );
            return( new_waypoint );
        },


        ///////////////////////////////////////////////////////////////////
        //  Botched way of loading the data
        //
        load: function(route_name, callback) {

            if ( ! route_name ) {
                return;
            };

            $http.jsonp("/load/"+route_name)
            .then(
                function(response) {
                    console.log("SUCCESS", ' fetching route ', "/load/"+route_name);
                    self.details = response.data;
                    callback()
                },
                function(errResponse) {
                    console.error(errResponse.status, ' fetching route ', "/load/"+route_name);
                }
            );
        },

        save_route: function(url,route) {
            $http.post(url, self.details )
            .then(
                load_route(url)
            ).then(
                function(response) {
                    self.details = { waypoints: [] };
                }
            );
        },

    };
}]);


//////////////////////////////////////////////////////////////////////
// Google DirectionsService
//
routebuilderApp.factory('DirectionsService', [ function() {
    var self = this;

    ///////////////////////////////////////////////////////////////////////
    // Fetch/cache directions from the google.maps.directionService
    //
    var directionsService = new google.maps.DirectionsService;
    var directions_cache = {};

    return {
        get_directions: function(origin, destination, render_callback) {

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
                        directions_cache[key] = response;
                        render_callback(directions_cache[key],origin,destination);
                    } else {
                        // Only 10 calls per second, watch for OVER_QUERY_LIMIT!
                        console.log("DirectionsService:",status);
                    }
                }
            );
        }
    };
}]);
