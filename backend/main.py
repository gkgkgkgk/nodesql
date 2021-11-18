from sqlalchemy import create_engine, func, Integer, String, Column, DateTime, exists, desc, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import rank

#import flask
from flask import Flask
from flask import request
from flask import jsonify

# TODO:
# - parse the node links
# - generate sql query
# - deynamically create classes based on the table names


base = declarative_base()
engine = create_engine("mysql+pymysql://root:gkgkgkgk@localhost/class")
db = Session(engine)
base.metadata.create_all(engine)
conn = engine.connect()

class sailors(base):
    __tablename__ = "sailors"
    sid = Column(Integer, primary_key=True)
    sname = Column(String)
    rating = Column(Integer)
    age = Column(Integer)


app = Flask(__name__)


def generateQuery(nodes, links):
    result = db.query(func.avg(sailors.age)).filter(sailors.rating == 10).scalar()
    query = str(db.query(func.avg(sailors.age)).filter(sailors.rating == 10))
    return result, query


@app.route('/', methods=['POST'])
def main():
    result, query = generateQuery(request.json['nodes'], request.json['links'])
    return jsonify({"result": result, "query": query})


app.run(debug=True)