import os

basedir = os.path.abspath(os.path.dirname(__file__))

SQLALCHEMY_DATABASE_URI = "postgresql://postgres:postgres@localhost:5432/audioguide"
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')


class Config(object):
	#SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']
	SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI

	WTF_CSRF_ENABLED = True
	SECRET_KEY = 'you-will-never-guess'

	OPENID_PROVIDERS = [
	    {'name': 'Google', 'url': 'https://www.google.com/accounts/o8/id'},
	    {'name': 'Yahoo', 'url': 'https://me.yahoo.com'},
	    {'name': 'AOL', 'url': 'http://openid.aol.com/<username>'},
	    {'name': 'Flickr', 'url': 'http://www.flickr.com/<username>'},
	    {'name': 'MyOpenID', 'url': 'https://www.myopenid.com'}]



class ProductionConfig(Config):
	DEBUG = False


class StagingConfig(Config):
	DEVELOPMENT = True
	DEBUG = True


class DevelopmentConfig(Config):
	DEVELOPMENT = True
	DEBUG = True


class TestingConfig(Config):
	TESTING = True
