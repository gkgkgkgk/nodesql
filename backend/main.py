import flask

app = flask.Flask("__nodesql__")

@app.route("/")
def my_index():
    return flask.render_template("index.html")

app.run(debug=True)