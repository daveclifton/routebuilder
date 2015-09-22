#!/usr/bin/env python

import os
import jwt
import base64
import sys
from functools import wraps
from flask import Flask, request, jsonify, _request_ctx_stack, send_from_directory
from werkzeug.local import LocalProxy
from flask.ext.cors import cross_origin


app = Flask(__name__)

current_user = LocalProxy(lambda: _request_ctx_stack.top.current_user)


#############################################################################
# Codesample from
# https://manage.auth0.com/#/applications/bEqVjIJFSjBygHI5JVZWgGcjAJV30eFK/quickstart
#
# Config here:
# https://console.developers.google.com/project/routebuilder-1075/apiui/apis/library
#

def authenticate(error):
  resp = jsonify(error)
  resp.status_code = 401
  return resp


def requires_auth(f):
  @wraps(f)
  def decorated(*args, **kwargs):

    auth = request.headers.get('Authorization', None)

    if not auth:
      return authenticate({'code': 'authorization_header_missing', 'description': 'Authorization header is expected'})

    parts = auth.split()

    if parts[0].lower() != 'bearer':
      return {'code': 'invalid_header', 'description': 'Authorization header must start with Bearer'}
    elif len(parts) == 1:
      return {'code': 'invalid_header', 'description': 'Token not found'}
    elif len(parts) > 2:
      return {'code': 'invalid_header', 'description': 'Authorization header must be Bearer + \s + token'}

    token = parts[1]
    try:
        payload = jwt.decode(
            token,
            base64.b64decode(client_secret.replace("_","/").replace("-","+")),
            audience=bEqVjIJFSjBygHI5JVZWgGcjAJV30eFK
        )
    except jwt.ExpiredSignature:
        return authenticate({'code': 'token_expired', 'description': 'token is expired'})
    except jwt.InvalidAudienceError:
        return authenticate({'code': 'invalid_audience', 'description': 'incorrect audience, expected: bEqVjIJFSjBygHI5JVZWgGcjAJV30eFK'})
    except jwt.DecodeError:
        return authenticate({'code': 'token_invalid_signature', 'description': 'token signature is invalid'})

    _request_ctx_stack.top.current_user = user = payload
    return f(*args, **kwargs)

  return decorated


# This doesn't need authentication
@app.route("/ping")
@cross_origin(headers=['Content-Type', 'Authorization'])
def ping():
    return "All good. You don't need to be authenticated to call this"

# This does need authentication
@app.route("/secured/ping")
@cross_origin(headers=['Content-Type', 'Authorization'])
@requires_auth
def securedPing():
    return "All good. You only get this message if you're authenticated"

###############################################################


@app.route("/")
def index():
    return send_from_directory('static', 'index.html')


@app.route("/load/<route_name>", methods=['GET'])
@cross_origin(headers=['Content-Type', 'Authorization'])
############# DISABLED FOR NOW!!
#@requires_auth
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
