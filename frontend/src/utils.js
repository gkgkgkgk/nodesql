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
    createDisplayBlock(showModal);
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
        else if (slotIndex == 1) {
            let node = graph.getNodeById(link.origin_id);
            this.properties.CustomValue = node.properties.Output;
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
    // let serialization = graph.serialize();
    console.log(graph.serialize());
    let serialization = graph.serialize();

    let nodes = serialization.nodes;
    let links = serialization.links;

    // sort nodes by order
    nodes.sort((a, b) => {
        return a.order - b.order;
    });

    // console.log(nodes);

    let paths = [];
    let displayNode = serialization.nodes.find(node => node.type === 'Display/Display');

    for (let i = 0; i < displayNode.inputs.length; i++) {
    }

    console.log("post request");

    axios.post('http://localhost:5000/', {
        nodes: nodes,
        links: links
    }, { useCredentails: true }).
        then(function (response) {
            setResponse(response.data.query, response.data.result);
        }).catch(function (error) {
            console.log(error);
        });
    // console.log(serialization);
};

export { init, getSQL };

/* example data:
{
    "last_node_id": 3,
    "last_link_id": 3,
    "nodes": [
        {
            "id": 1,
            "type": "Display/Display",
            "pos": [
                1251,
                625
            ],
            "size": {
                "0": 140,
                "1": 46
            },
            "flags": {},
            "order": 2,
            "mode": 0,
            "inputs": [
                {
                    "name": "entity",
                    "type": 0,
                    "link": 3
                },
                {
                    "name": "entity",
                    "type": 0,
                    "link": null
                }
            ],
            "properties": {}
        },
        {
            "id": 3,
            "type": "Operations/Filter",
            "pos": [
                900,
                556
            ],
            "size": {
                "0": 210,
                "1": 130
            },
            "flags": {},
            "order": 1,
            "mode": 0,
            "inputs": [
                {
                    "name": "entity",
                    "type": 0,
                    "link": 2
                }
            ],
            "outputs": [
                {
                    "name": "output",
                    "links": [
                        3
                    ]
                }
            ],
            "properties": {
                "Fields": [
                    {
                        "name": "sid",
                        "type": "number",
                        "links": null
                    },
                    {
                        "name": "sname",
                        "type": "string",
                        "links": null
                    },
                    {
                        "name": "rating",
                        "type": "number",
                        "links": null
                    },
                    {
                        "name": "age",
                        "type": "number",
                        "links": null
                    }
                ]
            }
        },
        {
            "id": 2,
            "type": "Entity/Sailor",
            "pos": [
                635,
                581
            ],
            "size": {
                "0": 140,
                "1": 106
            },
            "flags": {},
            "order": 0,
            "mode": 0,
            "outputs": [
                {
                    "name": "Sailor",
                    "type": "Entity",
                    "links": [
                        2
                    ]
                },
                {
                    "name": "sid",
                    "type": "number",
                    "links": null
                },
                {
                    "name": "sname",
                    "type": "string",
                    "links": null
                },
                {
                    "name": "rating",
                    "type": "number",
                    "links": null
                },
                {
                    "name": "age",
                    "type": "number",
                    "links": null
                }
            ],
            "properties": {}
        }
    ],
    "links": [
        [
            2,
            2,
            0,
            3,
            0,
            0
        ],
        [
            3,
            3,
            0,
            1,
            0,
            0
        ]
    ],
    "groups": [],
    "config": {},
    "extra": {},
    "version": 0.4
}
*/