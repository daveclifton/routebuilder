#!/usr/bin/env python

import os
from flask import Flask, request, render_template, Response
from config import basedir

app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')


data_dir = os.path.join(basedir, 'routes')


@app.route("/")
def index():
    return render_template('index.html')


@app.route("/route")
def route():
    return render_template('route.html')

@app.route("/about")
def about():
    return render_template('about.html')



@app.route("/route/<route_name>")
def route_load(route_name):
    return render_template('route.html', route_name=route_name)


@app.route("/load/<route_name>", methods=['GET'])
def load(route_name):
    file_path = os.path.join(basedir, 'routes', route_name+".route")
    with open( file_path, 'r' ) as f:
        output = f.read()
    return Response(response=output, status=200, mimetype="application/javascript")


@app.route("/save/<route_name>", methods=['POST'])
def save(route_name):
    file_path = os.path.join(basedir, 'routes', route_name+".route")
    with open( file_path, 'w' ) as f:
        f.write( "angular.callbacks._0( route =" + request.data + ")" )
    return Response(response=request.data, status=200, mimetype="application/javascript")




if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    print "MyAudioTour starting on port", port
    app.run(host='0.0.0.0', port=port, debug=True)
