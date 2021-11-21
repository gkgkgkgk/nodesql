import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import { init, getSQL } from './utils';
const { operations } = require('./schemas/operations.json');

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


    init(graph);
  });

  return (
    <div className="App">
      <canvas ref={canvasRef} id='mycanvas' width='1024' height='720'></canvas>
    </div>
  );
}

export default App;
