import { LiteGraph } from 'litegraph.js';
import axios from 'axios';
const { tables } = require('./schemas/tables.json');

var graph;
let setResponse;

const init = (g, showModal, r) => {
    graph = g;
    setResponse = r;

    createEntityBlocks();
    createFilterBlock();
    createProjectionBlock();
    creatCountBlock();
    createForEachBlock();
    createDisplayBlock(showModal);
};

const getNodeFromLink = id => {
    let serialized = graph.serialize();
    let links = serialized.links;
    let origin_id;
    let target_id;

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
            
            let fields = [];
            
            for (let field of table.columns) {
                this.addOutput(field.name, field.type);
                fields.push({ name: field.name, type: field.type });
            }

            this.properties = { Fields: fields };            
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

const creatCountBlock = () => {
    function CountNode() {
        this.addInput("Count", "Entity");
        this.addOutput("Count", "number");
    }

    CountNode.prototype.onExecute = function () {
    };

    CountNode.title = "Count";
    LiteGraph.registerNodeType("Operations/Count", CountNode);
}

const createForEachBlock = () => {

    const adjustAgg = (value, widget, node) => {
        node.properties.agg = value;
    }

    const adjustField1 = (value, widget, node) => {
        node.properties.Field1 = value;
    }

    const adjustField2 = (value, widget, node) => {
        node.properties.Field2 = value;
    }

    function ForEachNode() {
        this.addInput("Entity", "Entity");
        this.addOutput("Output", "number");
        this.properties = { Fields: [], Field1: "", Field2: "", agg: "" };
        this.addWidget("combo", "Function", "", adjustAgg, {values: ["Count", "Sum", "Avg", "Min", "Max"]});
        this.addWidget("combo", "Field1", "", adjustField1, {values: []});
        this.addWidget("combo", "", "Per", {values: ["Per"]});
        this.addWidget("combo", "Field2", "", adjustField2, {values: []});
    }

    ForEachNode.prototype.onExecute = function () {
    };

    ForEachNode.prototype.onConnectionsChange = function (type, slotIndex, isConnected, link, ioSlot) {
        if (isConnected) {
            let node = this.graph.getNodeById(link.origin_id);
            let fields = node.properties.Fields;
            this.properties.Fields = fields;
            this.widgets[1].options.values = fields.map(f => f.name);
            this.widgets[3].options.values = fields.map(f => f.name);
        }
    }

    ForEachNode.title = "ForEach";
    LiteGraph.registerNodeType("Operations/ForEach", ForEachNode);
}

const createProjectionBlock = () => {
    const adjustToggle = (value, widget, node) => {
        for (let i = 0; i < node.widgets.length; i++) {
            node.properties.Fields[i].value = node.widgets[i].value;
        }

        console.log(node.properties.Fields);
    }
    function ProjectionNode() {
        this.addInput("Entity", "Entity");
        this.addOutput("Entity", "Entity");
        this.properties = { Fields: [] };
    }

    ProjectionNode.prototype.onExecute = function () {
    };

    ProjectionNode.prototype.onConnectionsChange = function (type, slotIndex, isConnected, link, ioSlot) {
        if (isConnected) {
            console.log(this.widgets);
            if (!this.widgets || this.widgets.length == 0) {

                let node = graph.getNodeById(link.origin_id);
                let f = [];
                if (node.type.startsWith("Operations")) {
                    if (node.properties.Fields) {
                        f = node.properties.Fields.map(field => field.name);
                    }
                }
                else if (node.type.startsWith("Entity")) {
                    console.log(node.outputs);
                    f = node.outputs.map(output => output.name);
                    f.shift();
                }
                console.log(f);

                f.forEach(field => {
                    this.addWidget("toggle", field, true, adjustToggle);
                    this.properties.Fields.push({ "name": field, "value": true });
                });
            }
        }
        else {
            if (this.widgets) {
                let l = this.widgets.length;
                for (let i = 0; i < l; i++) {
                    this.widgets.pop();
                }
            }
            this.properties.Fields = [];
        }
    };

    ProjectionNode.title = "Projection";
    LiteGraph.registerNodeType("Operations/Projection", ProjectionNode);
}
const createFilterBlock = () => {
    const setCustomValue = (value, widget, node) => {
        node.properties.CustomValue = value;
    };

    const setOperation = (value, widget, node) => {
        node.properties.Operation = value;
    };

    const adjustWidgets0 = (value, widget, node) => {
        node.properties.Field = value;
        let type;
        for (let field of node.properties.Fields) {
            if (field.name === value) {
                type = field.type;
            }
        }

        if (type === 'string') {
            node.widgets[1].options.values = ['is the same as', 'starts with', 'ends with'];
            node.widgets[1].value = 'is the same as';
            node.properties.Operation = 'is the same as';

            let stringFields = [];
            for (let field of node.properties.Fields) {
                if (field.type === 'string') {
                    stringFields.push(field.name);
                }
            }

            stringFields.push('external node');
            stringFields.push('custom input');

            node.widgets[2].options.values = stringFields;
            node.widgets[2].value = stringFields[0];
            node.properties.Field2 = stringFields[0];
        }
        else if (type === 'number') {
            node.widgets[1].options.values = ['=', '<', '>', '<=', '>=', '!='];
            node.widgets[1].value = '=';
            node.properties.Operation = '=';

            let numberFields = [];
            for (let field of node.properties.Fields) {
                if (field.type === 'number') {
                    numberFields.push(field.name);
                }
            }

            numberFields.push('external node');
            numberFields.push('custom input');

            node.widgets[2].options.values = numberFields;
            node.widgets[2].value = numberFields[0];
            node.properties.Field2 = numberFields[0];
        }
    };

    const adjustWidgets2 = (value, widget, node) => {
        node.properties.Field2 = value;
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
            // todo: make sure not to add widget if custom input already exists
            if (type === 'string') {
                node.addWidget("text", "Custom Input", "", setCustomValue);
            }
            else if (type === 'number') {
                node.addWidget("number", "Custom Input", 0, setCustomValue);
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
        this.addWidget("combo", "Operation", '', setOperation, { "values": [''] });
        this.addWidget("combo", "Field", '', adjustWidgets2, { "values": [''] });
        this.properties = { Field: "", Field2: "", CustomValue: "", Operation: "", Fields: [] };
    }

    FilterNode.prototype.onExecute = function () {
    };

    FilterNode.prototype.onConnectionsChange = function (type, slotIndex, isConnected, link, ioSlot) {
        console.log(type, slotIndex, isConnected, link, ioSlot);
        if (isConnected) {
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
            }
            else if (slotIndex == 1) {
                let node = graph.getNodeById(link.origin_id);
                this.properties.CustomValue = node.properties.Output;
            }
        }
    };

    FilterNode.title = "Filter";
    LiteGraph.registerNodeType("Operations/Filter", FilterNode);
};

const createDisplayBlock = showModal => {
    const show = () => {
        showModal(true);
    }
    function DisplayNode() {
        this.addInput("entity");
        this.addWidget("button", "Run Query", "", show);
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
    DisplayNode.color = "#00004d";
    DisplayNode.bgcolor = "#000034";
    LiteGraph.registerNodeType("Display/Display", DisplayNode);
};

const getSQL = () => {
    // preprocess data here
    //[link_id, origin_id, origin_slot, target_id, target_slot, link_type];
    console.log(graph.serialize());
    let serialization = graph.serialize();

    let nodes = serialization.nodes;
    let links = serialization.links;

    // sort nodes by order
    nodes.sort((a, b) => {
        return a.order - b.order;
    });

    console.log(nodes, links);

    axios.post('http://localhost:5000/', {
        nodes: nodes,
        links: links
    }, { useCredentails: true }).
        then(function (response) {
            console.log(response.data);
            setResponse(response.data.query, response.data.result, response.data.keys);
        }).catch(function (error) {
            console.log(error);
        });
};

const convertToJson = result => {
    let json = result.split("(");
    // remove first and last element from array
    json.shift();
    json.pop();
    // remove all close parenthesis
    json = json.map(element => element.replace(/\)/g, ''));

    console.log(json);

    return json;
};

export { init, getSQL, convertToJson };