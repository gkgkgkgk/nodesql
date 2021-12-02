from os import path
from sqlalchemy import create_engine, func, Integer, String, Column, DateTime, exists, desc, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import rank

#import flask
from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS

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

edges = []

# depth first search to find al paths from a to b given array of edges and vertices
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
    for i in range(len(paths)):
        query = None;
        lastType = "";
        filters = [];
        for node in paths[i]:
            print(node)
            if node["type"] == "Operations/Filter":
                lastType = "filter"
                if lastType == "filter":
                    filters.append(node)
            else:
                if lastType == "filter":
                    query = (getFilterQuery(filters, query))
                    filters = []
            if node["type"] == "Display/Display":
                pathQueries.append(query)


    q = str(db.query(*pathQueries))
    response = db.query(*pathQueries).all()
    print(paths)
    print(len(pathQueries))    
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

def getFilterQuery(filters, subquery):
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
            comps.append(comp1 > comp2)
        if operation == "<":
            comps.append(comp1 < comp2)
        if operation == "=":
            comps.append(comp1 == comp2)
        if operation == ">=":
            comps.append(comp1 >= comp2)
        if operation == "<=":
            comps.append(comp1 <= comp2)
        if operation == "!=":
            comps.append(comp1 != comp2)

    return db.query(subquery).filter(*comps).subquery()

@app.route('/', methods=['POST'])
def main():
    result, keys, query = generateQuery(request.json['nodes'], request.json['links'])
    return jsonify({"result": result, "keys": keys, "query": query})


app.run(debug=True)