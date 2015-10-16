GuideMan (NiftyGuide)
===================

Comprises two applications:
> **routebuilder:** Web site for building Routes
> **appbuilder**: Scripts for generating a WebView app.

RouteBuilder
-------------
Occupies the top level directory.

Directory Structure:
> root
> - **routes**: data stored (actually, the database for the server - one route per json file)
> - **static**: htdocs.
> - **venv**: Python virtualenv for the routebuilder app.
> - **appbuilder**: see below

Run using Python 2.x:
> python app.py

AppBuilder
-------------
Directory Structure:
> root > appbuilder
> - **build**: Python build script. Reads a json file from ../routes
> - **route_viewer**:  static assets and template that will be included in the app
> - **OUTPUT**: HTML is generated here.

Run using Python 2.x:
> python build.py
