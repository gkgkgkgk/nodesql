# NodeSQL
NodeSQL is a graphical interface that allows users to construct SQL queries
without writing any SQL code. The interface is based on a node graph, which
is a series of nodes that are connected to each other with links. Each node has
input and outputs, and is responsible for performing some sort of computation
on data, while links are responsible for transferring data from node to node.
NodeSQL includes a collection of nodes that perform common computations in
database querying, such as filtering and aggregation. This can be useful for non-technical users who don’t know how to write SQL code and for users that would
benefit from a visual representation of a query. SQL queries can get confusing
and verbose, and NodeSQL aims to fix that by providing an intuitive graphical
environment for building SQL queries.

Read more about it here: https://gkgkgkgk.github.io/database/2021/12/27/nodesql.html

Below are some screenshots of nodesql in action:
![Complex Filter](https://raw.githubusercontent.com/gkgkgkgk/nodesql/main/images/complexfilter.png)
![Projection](https://raw.githubusercontent.com/gkgkgkgk/nodesql/main/images/projections.png)


![Query](https://raw.githubusercontent.com/gkgkgkgk/nodesql/main/images/query.png)
Above is a query that gets the names of all the sailors in the database who have an age above 50.

This project is using litegraph.js and SQLAlchemy.

* https://github.com/jagenjo/litegraph.js
* https://github.com/sqlalchemy/sqlalchemy
