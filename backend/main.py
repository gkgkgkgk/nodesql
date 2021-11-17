from sqlalchemy import create_engine, func, Integer, String, Column, DateTime, exists, desc, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import rank

#import flask
from flask import Flask
from flask_restful import Api, Resource

app = Flask(__name__)
api = Api(app)


class Main(Resource):
    def post(self):
        print('post')
        return "hi"


api.add_resource(Main, '/')

app.run(debug=True)