function set_audio(audio_file) {
  if ( audio_file ) {
      $('#audio').html("<video controls height='0' width='90%' style='padding:40px 0 0 0'>"+
                       "<source id='audio_file' src='"+ audio_file +"' onclick='this.play();'>"+
                       "<!-- fallback if video tag not recognised -->"+
                       "<div class='boxed'>"+
                       "  <a id='audio_file_2' href='"+ audio_file +"'/>Listen Now</a>"+
                       "</div>"+
                       "</video>" );
  } else {
      $('#audio').html("");
  }
}


function goto_overview() {
  $('#overview .title').text( route.title );
  $('#overview .main_image img').attr("src", route.image );
  $('#overview .description p').text( route.description);
  $('#overview').show();
  $('#waypoint').hide();
  set_audio(null);
}


var current_waypoint_id = 1;

function goto_waypoint(waypoint_id) {
  if ( ! route.waypoints[waypoint_id] ) {
      return
  }

  current_waypoint_id = waypoint_id

  waypoint = route.waypoints[current_waypoint_id];

  $('#waypoint .title').text( waypoint.title );
  $('#waypoint .main_image img').attr("src", waypoint.image );
  $('#waypoint .description p').text( waypoint.description);
  $('#waypoint').show();
  $('#overview').hide();
  set_audio(waypoint.audio_file);

  if (!route.waypoints[waypoint_id-1]) { $('.to_prev').addClass("disabled") }
  if ( route.waypoints[waypoint_id-1]) { $('.to_next').removeClass("disabled") }
  if (!route.waypoints[waypoint_id+1]) { $('.to_next').addClass("disabled") }
  if ( route.waypoints[waypoint_id+1]) { $('.to_prev').removeClass("disabled") }
}


function next_waypoint()  { goto_waypoint(current_waypoint_id+1); }
function prev_waypoint()  { goto_waypoint(current_waypoint_id-1); }


$(function(){
    $('body').on('swipeleft',  next_waypoint);
    $('body').on('swiperight', prev_waypoint);
    goto_overview();
});
