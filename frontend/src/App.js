import './App.css';
import React, { useState, useEffect, useRef } from 'react';
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
    EntityNode.color = "#00470f";
    EntityNode.bgcolor = "#002307";
    LiteGraph.registerNodeType("Entity/" + name, EntityNode);
  }
};

// https://www.color-hex.com/color-palette/3657
const createOperationBlocks = () => {
  function FilterNode() {
    this.addInput("a");
    this.widget = this.addWidget("combo", "Operation", "a = b", { "values": ["a = b", "a > b", "a < b", "a >= b", "a <= b"] });
    this.addInput("b");
    this.addOutput();
    this.addProperty("entity_type", "null");
  }

  FilterNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  FilterNode.prototype.onConnectInput = function (slot, input) {
    let link_id = this.inputs[slot];
    console.log(this.inputs[slot]);
    console.log(slot);
  }

  FilterNode.title = "Filter";
  FilterNode.color = "#600000";
  FilterNode.bgcolor = "#300000";
  LiteGraph.registerNodeType("Operations/Filter", FilterNode);

  function NewFilterNode() {
    this.addInput("a");
    this.addInput("b");
    this.widget = this.addWidget("combo", "Field", "sid", { "values": ["sid", "sname", "rating", "age"] });
    this.addWidget("combo", "Operation", "=", { "values": ["=", ">", "<", ">=", "<="] });
    this.addWidget("text", "", "100");
    this.addOutput();
    this.addProperty("entity_type", "null");
    this.addOutput("OR");
    this.addOutput("AND");
  }

  NewFilterNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  NewFilterNode.prototype.onConnectInput = function (slot, input) {
    let link_id = this.inputs[slot];
    console.log(this.inputs[slot]);
    console.log(slot);
  }

  NewFilterNode.title = "Filter";
  NewFilterNode.color = "#600000";
  NewFilterNode.bgcolor = "#300000";
  LiteGraph.registerNodeType("Operations/New Filter", NewFilterNode);

  function PerNode() {
    this.addInput("a");
    this.addInput("b");
    this.widget = this.addWidget("combo", "Operation", "AVG", { "values": ["AVG", "COUNT", "MIN", "MAX"] });
    this.addOutput();
  }

  PerNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  PerNode.title = "Per";
  PerNode.color = "#600000";
  PerNode.bgcolor = "#300000";
  LiteGraph.registerNodeType("Operations/Per", PerNode);

  function DisplayNode() {
    this.addInput();
  }

  DisplayNode.prototype.onExecute = function () {

  }

  DisplayNode.title = "Display";
  DisplayNode.color = "#120149";
  DisplayNode.bgcolor = "#090024";
  LiteGraph.registerNodeType("Display/Display", DisplayNode);

  function NumberNode() {
    this.addOutput("value", "number");
    this.addProperty("value", 1.0);
    this.widget = this.addWidget("number", "value", 1, "value");
    this.widgets_up = true;
    this.size = [180, 30];
  }

  NumberNode.title = "Number";

  NumberNode.prototype.onExecute = function () {
    this.setOutputData(0, parseFloat(this.properties["value"]));
  };

  NumberNode.prototype.getTitle = function () {
    if (this.flags.collapsed) {
      return this.properties.value;
    }
    return this.title;
  };

  NumberNode.prototype.setValue = function (v) {
    this.setProperty("value", v);
  }

  NumberNode.prototype.onDrawBackground = function (ctx) {
    this.outputs[0].label = this.properties["value"].toFixed(3);
  };
  LiteGraph.registerNodeType("Misc/Number", NumberNode);

  function GenericEntity() {
    this.addInput("entity");
  }

  GenericEntity.title = "Generic Entity";

  GenericEntity.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  GenericEntity.prototype.onConnectInput = function () {
    let inputs = this.inputs;
    let link_id = this.inputs[0].link;
  }

  LiteGraph.registerNodeType("Entity/Generic Entity", GenericEntity);

  function LogicNode() {
    this.addOutput("a");
    this.addOutput("b");
    this.widget = this.addWidget("combo", "Operation", "AND", { "values": ["AND", "OR"] });
    this.addInput();
  }

  LogicNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  LogicNode.title = "OR";
  LogicNode.color = "#600000";
  LogicNode.bgcolor = "#300000";
  LiteGraph.registerNodeType("Operations/Logic", LogicNode);

  function PeekNode() {
    this.addOutput();
    this.addInput();
  }

  PeekNode.prototype.onExecute = function () {
    this.setOutputData(0, this.getInputData(0));
  }

  PeekNode.title = "Peek";
  PeekNode.color = "#006060";
  PeekNode.bgcolor = "#003030";
  LiteGraph.registerNodeType("Display/Peek", PeekNode);
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

    const handleKeyDown = (e) => {
      if (e.key === 's') {
        getSQL();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    handleResize();

    graph = new LiteGraph.LGraph();
    graph.configure({
    });



    var canvas = new LiteGraph.LGraphCanvas("#mycanvas", graph);

    graph.start()
    LiteGraph.clearRegisteredTypes()


    createEntityBlocks();
    createOperationBlocks();
  });


  const getSQL = () => {
    // preprocess data here
    //[link_id, origin_id, origin_slot, target_id, target_slot, link_type];
    let serialization = graph.serialize();
    let nodes = serialization.nodes;
    let links = serialization.links;
    let sqlJson = [];

    // order nodes
    nodes.sort((a, b) => {
      return a.order - b.order;
    });

    for (let node of nodes) {
      if (node.type.substring(0, node.type.indexOf('/')) === 'Operations') {
        let o = { "operationType": node.type, inputs: [] };

        for (let i = 0; i < links.length; i++) {
          console.log(links[i]); // this is 0 for some reason...
          let l = links[i];
          if (l[3] === node.id) {
            let origin;
            console.log(nodes);
            for (let j = 0; j < nodes.length; j++) {
              if (nodes[j].id === l[1]) {
                origin = nodes[j];
              }
            }
            o.inputs[l[4]] = { "origin": origin, "output": origin.outputs[l[2]] };
          }
        }

        sqlJson.push(o);
      }
      else if (node.type.substring(0, node.type.indexOf('/')) === 'Display') {

      }
    }

    console.log(sqlJson);
    console.log(serialization);
  }

  return (
    <div className="App">
      <canvas ref={canvasRef} id='mycanvas' width='1024' height='720'></canvas>
    </div>
  );
}

export default App;
