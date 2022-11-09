const spawn = require("child_process").spawn
const express = require('express')
const http = require('http')
const webSocket = require('ws')
const net = require("net");

const port = 3000
const app = express()

app.use(express.static(__dirname + "/../site/"))

const server = net.createServer((client) => {
	console.log("Connection from ", client.remoteAddress)

	client.on("data", (data) => {
		/*	When using plain TCP, it's possible that separate messages
		 *	are found in the same packet. To prevent this split the data
		 *	with newlines because that shouldn't be in a JSON */
		const jsons = data.toString().trim().split("\n")
		jsons.forEach((json) => {

			const msg = JSON.parse(json)
			console.log(msg)

			//	Nodes will only send their ID in the first message
			if(msg.id !== undefined)
			{
				let node = activeNodes.find((n) => msg.id === n.ID)

				if(node.connection === undefined)
				{
					node.isSensor = msg.sensor;
					node.paramFormat = msg.format;
					node.connection = client
				}
			}

			//	Is result present
			if(msg.result !== undefined)
			{
				//	Find the node that this message is from and see if it passef
				let node = activeNodes.find((n) => client === n.connection)
				node.instances[msg.instance].passed = msg.result

				trigger(node.instances[msg.instance])
			}
		})
	})
})

const httpServer = http.createServer(app).listen(3001)
const ws = new webSocket.Server({ server: httpServer })

function sendToAll(json) {
	ws.clients.forEach((client) => {
		client.send(JSON.stringify(json));
	})
}

function informAboutNode(node, client) {
	const msg = {
		cmd : "nodeadd",
		name : node.name,
		type : node.type,
		format : node.paramFormat,
		sensor : node.isSensor
	}

	client.send(JSON.stringify(msg));
}

ws.on("connection", (c) => {
	activeNodes.forEach((n) => {
		informAboutNode(n, c)
	})

	c.on("message", (payload) => {
		const msg = JSON.parse(payload.toString())
		console.log(msg)

		if(msg.cmd === "instance") {
			const ID = msg.arg[0]
			node = activeNodes.find((n) => ID === n.ID);

			if(node === undefined)
				msg.error = true

			else msg.result = createInstance(node)
		}

		else if(msg.cmd === "dependency") {
			addDependency(msg.arg[0], parseInt(msg.arg[1]), msg.arg[2], parseInt(msg.arg[3]))
		}

		else if(msg.cmd === "parameters") {
			let node = activeNodes.find((n) => msg.arg[0] === n.ID);
			node.connection.write(msg.arg[1] + " " + msg.arg[2])
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
	let passed = hasPassed(instance)

	/*	Since it's guaranteed that the nodes send their state
	 *	only when it changes, it should be fine to send the state
	 *	to each client every time that there is a state change */
	sendToAll({
		cmd: "passed",
		arg: [ instance.parent.ID, instance.num, passed ]
	})

	/*	Find the nodes that are dependant on the node that sent
	 *	the message and trigger them if all of
	 *	their dependecies have passed */
	forDependantInstances(instance, (i) => {
		//	Call trigger recursively so that dependant nodes are alerted when something changes
		trigger(i)

		if(hasPassed(i)) {
			console.log("trigger", i.parent.ID, "instance", i.num)

			if(!i.parent.isSensor) {
				console.log("activate", i.parent.ID, "instance", i.num);
				i.parent.connection.write(i.num + " activate")
			}
		}

		else
		{
			if(!i.parent.isSensor) {
				console.log("deactivate", i.parent.ID, "instance", i.num);
				i.parent.connection.write(i.num + " deactivate")
			}
		}
	})
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function hasPassed(instance) {
	let passed = 0
	instance.dependencies.forEach((d) => {
		passed += hasPassed(d)
	})

	console.log("(", instance.parent.ID, " instance ", instance.num, ") Passed", passed, "/", instance.dependencies.length)

	let thisPassed = instance.parent.isSensor ? instance.passed : true;
	let dependecyPassed = instance.dependencies.length == 0 ? true : passed > 0

	return thisPassed && dependecyPassed
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
	to = activeNodes.find((n) => toID === n.ID)
	dep = activeNodes.find((n) => nodeID === n.ID)

	to.instances[toInstace].dependencies.push(dep.instances[nodeInstance])
	console.log(to.ID, " instance ", toInstace, " now depends on ", dep.ID, " instance ", nodeInstance)

	//	Immediately notify about possible state changes
	trigger(dep.instances[nodeInstance])
}

function startBuiltinNode(type, name, isInput) {
	const nodeType = builtinNodes.find((s) => s === type);

    if(nodeType === undefined)
        return undefined;

    const builtinRoot = __dirname + "/../nodes/builtin/";
    const nodePath = builtinRoot + "Node" + capitalizeFirstLetter(nodeType) + ".py";
    console.log(nodePath + " Name " + name);

	entry = {};
    entry.process = spawn("python3", [ nodePath, name ]);
	entry.instances = [];
	entry.builtin = true;
	entry.type = nodeType;
	entry.name = name;
	entry.topic = "nodes/" + nodeType;
	entry.ID = nodeType + ":" + name;

	activeNodes.push(entry);

	return entry;
}

app.get("/add/:builtintype/:name", (req, res) => {
	const ID = req.params.builtintype + ":" + req.params.name;
	node = activeNodes.find((n) => ID === n.ID)

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
	server.listen(4242, () => {
		startBuiltinNode("test", "test1");
		startBuiltinNode("time", "time1");
		startBuiltinNode("day", "day1");
	})
})
