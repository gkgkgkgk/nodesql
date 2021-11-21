import { LiteGraph } from 'litegraph.js';
const { tables } = require('./schemas/tables.json');

var graph;

const init = (g) => {
    graph = g;

    createEntityBlocks();
    createFilterBlock();
    createDisplayBlock();
};

const getNodeFromLink = id => {
    let serialized = graph.serialize();
    let links = serialized.links;
    let origin_id;
    let target_id;

    console.log(links);
    console.log(serialized.nodes);
    console.log(id);
    for (let l of links) {
        if (l[5] === id) {
            origin_id = l[1];
            target_id = l[3];
        }
    }

    return [graph.getNodeById(origin_id), graph.getNodeById(target_id)];
};

const getLink = id => {
    let serialized = graph.serialize();
    let links = serialized.links;

    for (let l of links) {
        console.log(l);
        console.log(id);
        if (l[0] === id) {
            return l;
        }
    }
};

const createEntityBlocks = () => {
    for (let table of tables) {
        let name = table.name_;
        function EntityNode() {
            this.addOutput(table.name_, "Entity");
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

const createFilterBlock = () => {
    const adjustWidgets0 = (value, widget, node) => {
        let type;
        for (let field of node.properties.Fields) {
            if (field.name === value) {
                type = field.type;
            }
        }

        if (type === 'string') {
            node.widgets[1].options.values = ['is the same as', 'starts with', 'ends with'];
            node.widgets[1].value = 'is the same as';

            let stringFields = [];
            for (let field of node.properties.Fields) {
                if (field.type === 'string') {
                    stringFields.push(field.name);
                }
            }

            stringFields.push('custom input');
            stringFields.push('external node');

            node.widgets[2].options.values = stringFields;
            node.widgets[2].value = stringFields[0];
        }
        else if (type === 'number') {
            node.widgets[1].options.values = ['=', '<', '>', '<=', '>='];
            node.widgets[1].value = '=';

            let numberFields = [];
            for (let field of node.properties.Fields) {
                if (field.type === 'number') {
                    numberFields.push(field.name);
                }
            }

            numberFields.push('custom input');
            numberFields.push('external node');

            node.widgets[2].options.values = numberFields;
            node.widgets[2].value = numberFields[0];
        }
        console.log(node.inputs);
    };

    const adjustWidgets2 = (value, widget, node) => {
        if (value === 'external node') {
            // check if node has input 'value'
            if (node.inputs.length <= 1) {
                node.addInput('value');
            }
        }
        else {
            node.removeInput(1);
        }

        let type;
        for (let field of node.properties.Fields) {
            if (field.name === node.widgets[0].value) {
                type = field.type;
            }
        }

        if (value === 'custom input') {
            if (type === 'string') {
                node.addWidget("text", "Custom Input", "");
            }
            else if (type === 'number') {
                node.addWidget("number", "Custom Input", 0);
            }
        }
        else {
            // remove last element from node.widgets
            if (node.widgets.at(-1).name === 'Custom Input') {
                node.widgets.pop();
            }
        }
    };
    function FilterNode() {
        this.addProperty('Fields', [], 'array');
        this.addInput("entity");
        this.addOutput("output");
        this.addWidget("combo", "Field", "Field", adjustWidgets0, { "values": [''] });
        this.addWidget("combo", "Operation", '', { "values": [''] });
        this.addWidget("combo", "Field", '', adjustWidgets2, { "values": [''] });
    }

    FilterNode.prototype.onExecute = function () {
    };

    FilterNode.prototype.onConnectionsChange = function (type, slotIndex, isConnected, link, ioSlot) {
        if (slotIndex === 0) {
            let node = graph.getNodeById(link.origin_id);
            let fieldValues = [];
            let outputs = [];

            if (node.type == "Operations/Filter") {
                outputs = node.properties.Fields;
                for (let i = 0; i < outputs.length; i++) {
                    this.properties.Fields[i] = outputs[i];
                    fieldValues.push(outputs[i].name);
                }
            }
            else {
                outputs = node.outputs;
                for (let i = 1; i < outputs.length; i++) {
                    this.properties.Fields[i - 1] = outputs[i];
                    fieldValues.push(outputs[i].name);
                }
            }

            this.widgets[0].options.values = fieldValues;
            this.widgets[0].value = fieldValues[0];
        }
    };

    FilterNode.title = "Filter";
    LiteGraph.registerNodeType("Operations/Filter", FilterNode);
};

const createDisplayBlock = () => {
    function DisplayNode() {
        this.addInput("entity");
    }

    DisplayNode.prototype.onExecute = function () {
    };

    DisplayNode.prototype.onConnectionsChange = function (type, slotIndex, isConnected, link, ioSlot) {
        if (isConnected) {
            this.addInput("entity");
        }
        else {
            this.removeInput(slotIndex);
        }
    };

    DisplayNode.title = "Display";
    LiteGraph.registerNodeType("Display/Display", DisplayNode);
};

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
};

export default init;

//[link_id, origin_id, origin_slot, target_id, target_slot, link_type];