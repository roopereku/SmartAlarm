const spawn = require("child_process").spawn
const express = require('express')
const mqtt = require('mqtt')
const http = require('http')
const webSocket = require('ws')

const port = 3000
const app = express()
const mqttClient = mqtt.connect("mqtt://localhost:1883", { clientId: "server" });

app.use(express.static(__dirname + "/../site/"))

mqttClient.on("connect", () => {
	console.log("MQTT connected");
	mqttClient.subscribe("noderesult");
})

mqttClient.on("message", (topic, message) => {
	const msg = JSON.parse(message.toString())

	//	If the message tells if the node is a sensor, it also contains the parameter format
	if(msg.sensor !== undefined)
	{
		let node = activeNodes.find((n) => msg.from == n.ID);
		if(node.isSensor === undefined)
		{
			node.isSensor = msg.sensor;
			node.paramFormat = msg.format;
		}
	}

	//	Is result present
	if(msg.result !== undefined)
	{
		//	Find the node that this message is from and see if it passef
		node = activeNodes.find((n) => msg.from == n.ID)
		node.instances[msg.instance].passed = msg.result

		trigger(node.instances[msg.instance])
	}
})

const httpServer = http.createServer(app).listen(3001)
const ws = new webSocket.Server({ server: httpServer })

function sendToAll(json)
{
	ws.clients.forEach((client) => {
		client.send(JSON.stringify(json));
	})
}

ws.on("connection", (c) => {
	c.on("message", (payload) => {
		const msg = JSON.parse(payload.toString())
		console.log(msg)

		if(msg.cmd == "instance")
		{
			const ID = msg.arg[0]
			node = activeNodes.find((n) => ID == n.ID);

			if(node === undefined)
				msg.error = true

			else msg.result = createInstance(node)
		}

		if(msg.cmd == "dependency")
		{
			addDependency(msg.arg[0], parseInt(msg.arg[1]), msg.arg[2], parseInt(msg.arg[3]))
		}

		sendToAll(msg);
	})
})

const builtinNodes = [
    "day",
    "time",
    "test"
]

let activeNodes = []

function trigger(instance)
{
	let passed = allDependenciesPassed(instance)

	/*	Since it's guaranteed that the nodes send their state
	 *	only when it changes, it should be fine to send the state
	 *	to each client every time that there is a state change */
	sendToAll({
		cmd: "passed",
		arg: [ instance.parent.ID + ":" + instance.num.toString(), passed ]
	})

	/*	Find the nodes that are dependant on the node that sent
	 *	the message and trigger them if all of
	 *	their dependecies have passed */
	forDependantInstances(instance, (i) => {

		/*	Call trigger recursively so that an instance won't
		 *	display as passed if even one of the dependencies hasn't passed */
		trigger(i)

		if(allDependenciesPassed(i)) {
			console.log("trigger", i.parent.ID, "instance", i.num)

			if(!i.parent.isSensor)
				//	TODO Send a message to the node that tells it to activate
				console.log("activate", i.parent.ID, "instance", i.num);
		}

		else
		{
			if(!i.parent.isSensor)
				//	TODO Send a message to the node that tells it to deactivate
				console.log("deactivate", i.parent.ID, "instance", i.num);
		}
	})
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function allDependenciesPassed(instance) {
	let passed = 0
	instance.dependencies.forEach((d) => {
		passed += allDependenciesPassed(d)
	})

	console.log("(", instance.parent.ID, " instance ", instance.num, ") Passed", passed, "/", instance.dependencies.length)

	let thisPassed = instance.parent.isSensor ? instance.passed : true;
	return thisPassed && passed >= instance.dependencies.length
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

	return entry.num
}

function addDependency(toID, toInstace, nodeID, nodeInstance) {
	to = activeNodes.find((n) => toID == n.ID)
	dep = activeNodes.find((n) => nodeID == n.ID)

	to.instances[toInstace].dependencies.push(dep.instances[nodeInstance])
	console.log(to.ID, " instance ", toInstace, " now depends on ", dep.ID, " instance ", nodeInstance)

	//	Immediately notify about possible state changes
	trigger(dep.instances[nodeInstance])
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
	entry.instances = [];
	entry.builtin = true;
	entry.name = name;
	entry.topic = "nodes/" + nodeType;
	entry.ID = nodeType + ":" + name;

	activeNodes.push(entry);
	return entry;
}

app.get("/add/:builtintype/:name", (req, res) => {
	const ID = req.params.builtintype + ":" + req.params.name;
	node = activeNodes.find((n) => ID == n.ID)

	if(node === undefined)
	{
		res.send("No node called " + ID);
		return;
	}

	res.send(createInstance(node).toString());
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/../site/index.html")
})

app.listen(port, () => {
	startBuiltinNode("test", 1);
	startBuiltinNode("time", 1);
	startBuiltinNode("day", 1);
})
