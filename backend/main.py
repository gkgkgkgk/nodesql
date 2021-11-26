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
engine = create_engine("mysql+pymysql://newuser:password@localhost/class")
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

# TODO: implement special case for cascaded filters
def generateQuery(nodes, links):
    operations = []
    lastOperation = None
    # get all nodes that are operations
    for n in nodes:
        if n["type"].startswith("Operations"):
            if n["type"] == "Operations/Filter":
                q = getFilterQuery(n, lastOperation)
                operations.append(q)
                lastOperation = q

    response = db.query(lastOperation).all()    
    result, keys = convertToJson(response[0].keys(), response)
    print(keys)
    return result, keys, str(q)

def convertToJson(keys, response):
    j = []
    k = []
    
    for key in keys:
        k.append(key)

    for r in response:
        jr = {};
        for key in keys:
            jr[key] = r[key]
        j.append(jr)
    
    return j, k

def getFilterQuery(filter, subquery):
    if subquery is None:
        subquery = sailors

    operation = filter["properties"]["Operation"]
    comp1 = getattr(sailors, filter["properties"]["Field"])
    comp2 = filter["properties"]["Field2"]

    if filter["properties"]["Field2"] == "custom input":
        comp2 = filter["properties"]["CustomValue"]
    else:
        comp2 = getattr(sailors, comp2)

    if operation == ">":
        return db.query(subquery).filter(comp1 > comp2).subquery()
    if operation == "<":
        return db.query(subquery).filter(comp1 < comp2).subquery()
    if operation == "=":
        return db.query(subquery).filter(comp1 == comp2).subquery()
    if operation == ">=":
        return db.query(subquery).filter(comp1 >= comp2).subquery()
    if operation == "<=":
        return db.query(subquery).filter(comp1 <= comp2).subquery()
    if operation == "!=":
        return db.query(subquery).filter(comp1 != comp2).subquery()

@app.route('/', methods=['POST'])
def main():
    result, keys, query = generateQuery(request.json['nodes'], request.json['links'])
    return jsonify({"result": result, "keys": keys, "query": query})


app.run(debug=True)