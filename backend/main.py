from sqlalchemy import create_engine, func, Integer, String, Column, DateTime, exists, desc, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import rank

#import flask
from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS


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
cors = CORS(app)


def generateQuery(nodes, links):
    operations = []
    # get all nodes that are operations
    for n in nodes:
        if n["type"].startswith("Operations"):
            if n["type"] == "Operations/Filter":
                print("filter: ", n)
                q = getFilterQuery(n)
                operations.append(q)

    return "yo", "hi"

def getFilterQuery(filter):
    operation = filter["properties"]["Operation"]
    comp1 = getattr(sailors, filter["properties"]["Field"])
    comp2 = filter["properties"]["Field2"]

    if filter["properties"]["Field2"] == "custom input":
        comp2 = filter["properties"]["CustomValue"]
    else:
        comp2 = getattr(sailors, comp2)

    if operation == ">":
        return db.query(sailors).filter(comp1 > comp2).subquery()
    if operation == "<":
        return db.query(sailors).filter(comp1 < comp2).subquery()
    if operation == "=":
        return db.query(sailors).filter(comp1 == comp2).subquery()
    if operation == ">=":
        return db.query(sailors).filter(comp1 >= comp2).subquery()
    if operation == "<=":
        return db.query(sailors).filter(comp1 <= comp2).subquery()
    if operation == "!=":
        return db.query(sailors).filter(comp1 != comp2).subquery()

@app.route('/', methods=['POST'])
def main():
    result, query = generateQuery(request.json['nodes'], request.json['links'])
    return jsonify({"result": result, "query": query})


app.run(debug=True)