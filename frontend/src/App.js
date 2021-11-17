import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import Button from './components/Button';
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
  function FilterNode() {
    this.addInput();
    this.widget = this.addWidget("combo", "Operation", "=", {"values": ["=", ">", "<", ">=", "<="]});
    this.addInput();
    this.addOutput();
  }

  FilterNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  FilterNode.title = "Filter";
  LiteGraph.registerNodeType("basic/Filter", FilterNode);

  function PerNode() {
    this.addInput();
    this.addInput();
    this.widget = this.addWidget("combo", "Operation", "AVG", {"values": ["AVG", "COUNT", "MIN", "MAX"]});
    this.addOutput();
  }

  PerNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  PerNode.title = "Per";
  LiteGraph.registerNodeType("basic/Per", PerNode);
};


function App() {
  var graph;
  var canvasRef = useRef(null);


  useEffect(() => {

    const handleResize = () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    graph = new LiteGraph.LGraph();
    graph.configure({
    });

    

    var canvas = new LiteGraph.LGraphCanvas("#mycanvas", graph);
    
    graph.start()

    createEntityBlocks();
    createOperationBlocks();
  });


  const getSQL = () => {
    // preprocess data here
    //[link_id, origin_id, origin_slot, target_id, target_slot, link_type];
    let serialization = graph.serialize();
    let nodes = serialization.nodes;
    let links = serialization.links;
  }

  return (
    <div className="App">
      <canvas ref={canvasRef} id='mycanvas' width='1024' height='720'></canvas>
      {/* <Button callBack={getSQL}/> */}
    </div>
  );
}

export default App;
