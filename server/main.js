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
		node.passed = msg.result

		if(node.passed)
		{
			/*	Find the nodes that are dependant on the node that sent
			 *	the message and trigger them if all of
			 *	their dependecies have passed */
			forDependantNodes(msg.from, (n) => {
				if(allDependenciesPassed(n)) {
					console.log("trigger", n.ID)
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

function allDependenciesPassed(node) {
	let passed = 0
	node.dependencies.forEach((d) => {
		passed += d.passed
	})

	console.log("(", node.ID, ") Passed", passed, "/", node.dependencies.length)
	return passed >= node.dependencies.length
}

function forDependantNodes(nodeName, callback) {
	//	Find all the nodes that depend on nodeName
	activeNodes.forEach((n) => {
		n.dependencies.forEach((d) => {
			if(nodeName === d.ID) {
				callback(n)
			}
		})
	})
}

function addDependency(toID, nodeID) {
	to = activeNodes.find((n) => toID == n.ID)
	dep = activeNodes.find((n) => nodeID == n.ID)

	to.dependencies.push(dep)
	console.log(to.ID, "now depends on", dep.ID)
}

function startBuiltinNode(name, ID, isInput) {
	const nodeName = builtinNodes.find((s) => s === name);

    if(nodeName == undefined)
        return false;

    const builtinRoot = __dirname + "/../nodes/builtin/";
    const nodePath = builtinRoot + "Node" + capitalizeFirstLetter(nodeName) + ".py";
    console.log(nodePath + " ID " + ID);

	entry = {};
    entry.process = spawn("python3", [ nodePath, ID ]);
	entry.dependencies = [];
	entry.builtin = true;
	entry.passed = false;
	entry.name = name;
	entry.ID = name + ":" + ID;

	activeNodes.push(entry);

	return true;
}

app.get("/input/:name/:id", (req, res) => {
	if(!startBuiltinNode(req.params.name, req.params.id, true)) {
		res.send("Invalid name");
		return;
	}

	res.redirect("/");
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
	startBuiltinNode("time", 1);
	startBuiltinNode("time", 11);

	startBuiltinNode("time", 2);
	startBuiltinNode("day", 1);

	addDependency("day:1", "time:1")

	addDependency("time:2", "time:1")
	addDependency("time:2", "time:11")
})
