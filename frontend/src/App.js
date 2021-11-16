import './App.css';
import React, { useState, useEffect } from 'react';
import { LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
const { tables } = require('./schemas/tables.json');


const createEntityBlocks = () => {
  for (let table of tables) {
    let name = table.name_;
    function EntityNode() {
      for (let field of table.columns) {
        this.addOutput(field.name, field.type);
      }
    }

    EntityNode.prototype.onExecute = function () {
      this.setOutputData(0, this.getInputData(0));
    };

    EntityNode.title = name;


    LiteGraph.registerNodeType("basic/" + name, EntityNode);
  }
};


function App() {
  useEffect(() => {
    var graph = new LiteGraph.LGraph();
    graph.configure({
      contextMenu: false
    });

    var canvas = new LiteGraph.LGraphCanvas("#mycanvas", graph);



    var node_const = LiteGraph.createNode("basic/const");
    node_const.pos = [200, 200];
    graph.add(node_const);
    node_const.setValue(4.5);

    var node_watch = LiteGraph.createNode("basic/watch");
    node_watch.pos = [700, 200];
    graph.add(node_watch);

    node_const.connect(0, node_watch, 0);

    graph.start()

    createEntityBlocks();
  });

  return (
    <div className="App">
      <canvas id='mycanvas' width='1024' height='720' style={{ border: '1px solid' }}></canvas>
    </div>
  );
}

export default App;
