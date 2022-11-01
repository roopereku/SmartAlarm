const spawn = require("child_process").spawn
const express = require('express')
const mqtt = require('mqtt')

const port = 3000
const app = express()
const mqttClient = mqtt.connect("mqtt://localhost:1883", { clientId: "server" });

mqttClient.on("connect", () => {
	console.log("MQTT connected");
	mqttClient.subscribe("noderesult");
})

mqttClient.on("message", (topic, message) => {
	const msg = JSON.parse(message.toString())

	//	Is result present
	if(msg.result !== undefined)
	{
		//	Find the node that this message is from and see if it passef
		node = activeNodes.find((n) => msg.from == n.ID)
		node.instances[msg.instance].passed = msg.result

		if(node.instances[msg.instance].passed)
		{
			/*	Find the nodes that are dependant on the node that sent
			 *	the message and trigger them if all of
			 *	their dependecies have passed */
			forDependantInstances(node.instances[msg.instance], (i) => {
				if(allDependenciesPassed(i)) {
					console.log("trigger", i.parent.ID, "instance", i.num)
				}
			})
		}
	}
})

const builtinNodes = [
    "day",
    "time"
]

let activeNodes = []

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function requestParameters(node) {
	mqttClient.publish("nodes/" + node.name, node.id + " paramsformat", {}, (error) => {
		if(error)
			console.log(error)
	})
}

function allDependenciesPassed(instance) {
	let passed = 0
	instance.dependencies.forEach((d) => {
		passed += d.passed
	})

	console.log("(", instance.parent.ID, " instance ", instance.num, ") Passed", passed, "/", instance.dependencies.length)
	return passed >= instance.dependencies.length
}

function forDependantInstances(instance, callback) {
	//	Find all the instances that depend on the given instance
	activeNodes.forEach((n) => {
		n.instances.forEach((i) => {
			i.dependencies.forEach((d) => {
				if(d === instance) {
					callback(i)
				}
			})
		})
	})
}

function createInstance(node) {
	let entry = {}

	entry.dependencies = [];
	entry.passed = false;
	entry.parent = node
	entry.num = node.instances.length

	node.instances.push(entry)
	console.log("Created instance", entry.num, "for", node.ID)
}

function addDependency(toID, toInstace, nodeID, nodeInstance) {
	to = activeNodes.find((n) => toID == n.ID)
	dep = activeNodes.find((n) => nodeID == n.ID)

	to.instances[toInstace].dependencies.push(dep.instances[nodeInstance])
	console.log(to.ID, " instance ", toInstace, " now depends on ", dep.ID, " instance ", nodeInstance)
}

function startBuiltinNode(type, name, isInput) {
	const nodeType = builtinNodes.find((s) => s === type);

    if(nodeType == undefined)
        return undefined;

    const builtinRoot = __dirname + "/../nodes/builtin/";
    const nodePath = builtinRoot + "Node" + capitalizeFirstLetter(nodeType) + ".py";
    console.log(nodePath + " Name " + name);

	entry = {};
    entry.process = spawn("python3", [ nodePath, name ]);
	entry.instances = []
	entry.builtin = true;
	entry.name = name;
	entry.ID = nodeType + ":" + name;

	createInstance(entry)
	activeNodes.push(entry);

	return entry;
}

app.get("/input/:builtintype/:name", (req, res) => {
	if(startBuiltinNode(req.params.builtintype, req.params.name, true) === undefined) {
		res.send("Invalid node type");
		return;
	}

	res.redirect("/");
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
	let t = startBuiltinNode("time", 1);
	createInstance(t)

	startBuiltinNode("day", 1);

	addDependency("day:1", 0, "time:1", 0)
	addDependency("day:1", 0, "time:1", 1)
	//addDependency("time:2", "time:11")
})
