#!/usr/bin/env python

import os
import json
import requests
import shutil
from distutils.dir_util import copy_tree
from jinja2 import Environment, PackageLoader


def main( route_name, root, output_dir ):

    # Read route.json in to 'route'
    route = json.load(open( os.path.join(root,'..','routes',route_name+'.route'), 'r'))

    # Copy remote assets (urls) to local files and update 'route'
    fetch_asset( route, 'image', 9999 )
    for waypoint_id, waypoint in enumerate(route['waypoints']):
        fetch_asset( waypoint, 'audio_file', waypoint_id )
        fetch_asset( waypoint, 'image',      waypoint_id )

    # Write 'route' to route.js!
    with open( os.path.join( output_dir, 'route.js' ), 'w' ) as r:
        r.write( "var route = "+ json.dumps(route, indent=4) + ";\n" )

    env = Environment(loader=PackageLoader('route_viewer','templates'))

    with open( os.path.join(output_dir,'index.html'), 'w' ) as f:
        f.write( env.get_template('index.html').render(route=route) )


def fetch_asset( record, key, waypoint_id ):
    if not key in record:
        return

    url = record[key]

    suffix = url[url.rfind('.'):]
    if '?' in suffix:
        suffix = suffix[:suffix.find('?')]

    file_name = 'assets/{:04}{}'.format(waypoint_id,suffix)

####################################################################
# If running repeatedly in dev without modifying the assets,
# then comment these 4 lines out for performance.
#
#    # Retrieve assets from the internet and rename 001.jpg, etc.
#    r = requests.get(url, stream=True)
#    if r.status_code == 200:
#       with open( os.path.join(output_dir,file_name), 'wb') as f:
#            r.raw.decode_content = True
#            shutil.copyfileobj(r.raw, f)
####################################################################

    # rename the asset with the new shortname
    record[key] = file_name

    # Android Webview apps have all assets in a special folder.
    # Comment this out if you're testing the output on a computer.
    #record[key] = "file:///android_asset/" + file_name

    print "fetch", url, "-->", record[key]


if __name__ == "__main__":

    ## CHANGE THIS - INDICATES THE JSON ROUTE FILE TO USE IN ../routes
    route_name = 'bath'

    root       = os.path.dirname(__file__)
    output_dir = os.path.join(root,'OUTPUT',route_name)
    if not os.path.exists( output_dir+"/assets" ):
        os.makedirs( output_dir+"/assets" );

    copy_tree( os.path.join(root,'route_viewer','include' ), output_dir )

    main( route_name, root, output_dir )
