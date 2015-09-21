#!/usr/bin/env python

import os
from flask import Flask, send_from_directory


app = Flask(__name__)


@app.route("/")
def index():
    return send_from_directory('static', 'index.html')


@app.route("/load/<route_name>", methods=['GET'])
def load(route_name):
    return send_from_directory(os.path.dirname(__file__), "routes/"+route_name+".route")


@app.route("/save/<route_name>", methods=['POST'])
def save(route_name):
    file_path = os.path.join(os.path.dirname(__file__), 'routes', route_name+".route")
    with open( file_path, 'w' ) as f:
        f.write( "angular.callbacks._0( route =" + request.data + ")" )
    return Response(response=request.data, status=200, mimetype="application/javascript")


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    print "Routebuilder starting on 0.0.0.0:{}".format(port)
    app.run(host='0.0.0.0', port=port, debug=True)
