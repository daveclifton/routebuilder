#!/usr/bin/env python

import os


import os
from flask import Flask, request, render_template, Response
#from flask_bootstrap import Bootstrap
#from flask.ext.sqlalchemy import SQLAlchemy
#from flask.ext.login import LoginManager
#from flask.ext.openid import OpenID
from config import basedir

app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')
#Bootstrap(app)

#lm = LoginManager()
#lm.init_app(app)
#lm.login_view = 'login'
#oid = OpenID(app, os.path.join(basedir, 'tmp'))


data_dir = os.path.join(basedir, 'routes')

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/route")
def route():
    return render_template('route.html')

@app.route("/route/<route_name>")
def route_load(route_name):
    return render_template('route.html', route_name=route_name)



@app.route("/load/<route_name>", methods=['GET'])
def load(route_name):
    file_path = os.path.join(basedir, 'routes', route_name+".route")
    with open( file_path, 'r' ) as f:
        output = f.read()

    return Response(response=output,
                    status=200,
                    mimetype="application/javascript")


@app.route("/save/<route_name>", methods=['POST'])
def save(route_name):
    file_path = os.path.join(basedir, 'routes', route_name+".route")
    with open( file_path, 'w' ) as f:
        f.write( "angular.callbacks._0( route =" + request.data + ")" )
    print request.data




if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    print "MyAudioTour starting on port", port
    app.run(host='0.0.0.0', port=port, debug=True)
