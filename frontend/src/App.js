import './App.css';
import React, { useState, useEffect } from 'react';
import { LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
const { tables } = require('./schemas/tables.json');
const { operations } = require('./schemas/operations.json');


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

const createOperationBlocks = () => {
  // for(let operation of operations) {
  //   console.log(operation);
  //   let name = operation.name;
  //   function OperationNode(){
  //     for(let i = 0; i < operation.inputs; i++) {
  //       this.addInput(i, "string");
  //       this.addOutput(i, "string");
  //     }
  //   }

  //   OperationNode.prototype.onExecute = function() {
  //     this.setOutputData(0, this.getInputData(0));
  //   };
  //   OperationNode.title = name;
  //   LiteGraph.registerNodeType("basic/" + name, OperationNode);
  // }
  function FilterNode() {
    this.addInput("", "number");
    this.addInput("", "number");
    this.addOutput("", "string");
    this.widget = this.addWidget("combo", "Operation", "=", {"values": ["=", ">", "<", ">=", "<="]});
  }

  FilterNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  FilterNode.title = "Filter";
  LiteGraph.registerNodeType("basic/Filter", FilterNode);
};


function App() {
  useEffect(() => {
    var graph = new LiteGraph.LGraph();
    graph.configure({
    });

    var canvas = new LiteGraph.LGraphCanvas("#mycanvas", graph);
    graph.use_default_nodes = false;

    graph.start()

    createEntityBlocks();
    createOperationBlocks();
  });

  return (
    <div className="App">
      <canvas id='mycanvas' width='1024' height='720' style={{ border: '1px solid' }}></canvas>
    </div>
  );
}

export default App;
