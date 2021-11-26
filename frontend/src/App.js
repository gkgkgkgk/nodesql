import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import { init, getSQL, convertToJson } from './utils';
import Modal from './components/Modal';
const { operations } = require('./schemas/operations.json');

function App() {
  var graph;
  var canvasRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [keys, setKeys] = useState('');

  const setResponse = (query, result, keys) => {
    setQuery(query);
    setResult(result);
    setKeys(keys);
  }

  const setShowModalWrapper = (b) => {
    getSQL(graph);
    setShowModal(b);
  }

  useEffect(() => {

    const handleResize = () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    };

    const handleKeyDown = (e) => {
      if (e.key === 's') {
        convertToJson("[(58, 'rusty', 10, 35), (60, 'jit', 10, 35), (62, 'shaun', 10, 35), (71, 'zorba', 10, 35)]");
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


    init(graph, setShowModalWrapper, setResponse);
    var displayNode = LiteGraph.createNode("Display/Display");
    displayNode.pos = [window.innerWidth / 2, window.innerHeight / 2];
    graph.add(displayNode);
  }, []);

  return (
    <div className="App">
      <canvas ref={canvasRef} id='mycanvas' width='1024' height='720'></canvas>
      <Modal showModal={showModal} setShowModal={setShowModal} query={query} result={result} keys={keys}></Modal>
    </div>
  );
}

export default App;
