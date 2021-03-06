from os import path
from sqlalchemy import create_engine, func, Integer, String, Column, DateTime, exists, desc, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, load_only
from sqlalchemy.sql.functions import rank
from sqlalchemy import or_
from sqlalchemy import and_
from sqlalchemy.sql import label

#import flask
from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS

base = declarative_base()
engine = create_engine("mysql+pymysql://gk:$Password1@localhost/class")
base.metadata.create_all(engine)
conn = engine.connect()
db = Session(engine)

class sailors(base):
    __tablename__ = "sailors"
    sid = Column(Integer, primary_key=True)
    sname = Column(String)
    rating = Column(Integer)
    age = Column(Integer)


app = Flask(__name__)
cors = CORS(app)

edges = []

# depth first search to find all paths from a to b given array of edges and vertices
def dfs(a, b, edges, path=[]):
    path = path + [a]
    if a == b:
        return [path]
    paths = []
    for i in range(len(edges)):
        if edges[i][0] == a:
            if edges[i][1] not in path:
                newpaths = dfs(edges[i][1], b, edges, path)
                for newpath in newpaths:
                    paths.append(newpath)
    return paths        

def generateQuery(nodes, links):
    print(links)
    edges = []
    for link in links:
        edges.append([link[1], link[3]])

    paths = (dfs(nodes[0]["id"], nodes[len(nodes) - 1]["id"], edges))

    # replace all ids in paths with nodes
    for i in range(len(paths)):
        for j in range(len(paths[i])):
            for node in nodes:
                if node["id"] == paths[i][j]:
                    paths[i][j] = node

    pathQueries = []
    comps = []
    count = False
    groupBy = None
    values = []

    for i in range(len(paths)):
        query = None
        lastType = ""
        filters = []
        for node in paths[i]:
            print(node)
            if node["type"] == "Operations/Filter":
                lastType = "filter"
                if lastType == "filter":
                    filters.append(node)
            else:
                if lastType == "filter":
                    comp = (getFilterComps(filters, query))
                    comps.append(comp)
                    filters = []
                if node["type"] == "Operations/Projection":
                    values = getProjection(node)
                if node["type"] == "Operations/Count":
                    count = True
                if node["type"] == "Operations/ForEach":
                    groupBy = node
            if node["type"] == "Display/Display":
                pathQueries.append(query)

    # check if comps is empty
    pathQueries.append(getFilter(values, comps))
    response = db.query(*pathQueries).all()

    if groupBy != None:
        print(groupBy)
        agg = groupBy["properties"]["agg"].lower()
        field1 = getattr(sailors, groupBy["properties"]["Field1"])
        field2 = getattr(sailors, groupBy["properties"]["Field2"])

        if agg == "sum":
            response = db.query(field2, label('Sum', func.sum(field1))).group_by(field2).all()
        if agg == "avg":
            response = db.query(field2, label('Average', func.avg(field1))).group_by(field2).all()
        if agg == "min":
            response = db.query(field2, label('Min', func.min(field1))).group_by(field2).all()
        if agg == "max":
            response = db.query(field2, label('Max', func.max(field1))).group_by(field2).all()
    
    result, keys = convertToJson(response[0].keys(), response)
    t = "json"

    if count:
        result = [{"count": len(response)}]
        keys = ["count"]
        t = "number"


    return result, keys, "Query", t

def getProjection(node):
    v = []
    print(node["properties"]["Fields"])
    for field in node["properties"]["Fields"]:
        if field['value'] == True:
            print(field['name'])
            v.append(field['name'])

    return v

def convertToJson(keys, response):
    j = []
    k = [key for key in keys]
    print(keys)

    for r in response:
        jr = {key: r[key] for key in keys}
        j.append(jr)
    return j, k

def getFilter(fields, comps):
    a = []
    b = []
    for field in fields:
        b.append(getattr(sailors, field))

    for comp in comps:
        a.append(and_(*(comp)))
    
    if len(b) > 0:
        return db.query(*b).filter((or_(*(a)))).subquery()
    else:
        return db.query(sailors).filter((or_(*(a)))).subquery()

def getFilterComps(filters, subquery):
    if subquery is None:
        subquery = sailors

    comps = []
    for filter in filters:
        operation = filter["properties"]["Operation"]
        comp1 = getattr(sailors, filter["properties"]["Field"])
        comp2 = filter["properties"]["Field2"]

        if filter["properties"]["Field2"] == "custom input":
            comp2 = filter["properties"]["CustomValue"]
        else:
            comp2 = getattr(sailors, comp2)

        if operation == ">":
            comps.append((comp1 > comp2))
        if operation == "<":
            comps.append((comp1 < comp2))
        if operation == "=" or operation == "is the same as":
            comps.append((comp1 == comp2))
        if operation == ">=":
            comps.append((comp1 >= comp2))
        if operation == "<=":
            comps.append((comp1 <= comp2))
        if operation == "!=":
            comps.append((comp1 != comp2))
        if operation == "starts with":
            comps.append((comp1.like(comp2 + "%")))
        if operation == "ends with":
            comps.append((comp1.like("%" + comp2)))

    return comps

@app.route('/', methods=['POST'])
def main():
    result, keys, query, t = generateQuery(request.json['nodes'], request.json['links'])
    return jsonify({"result": result, "keys": keys, "query": query, "type": t})


app.run(debug=True)