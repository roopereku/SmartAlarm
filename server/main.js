const spawn = require("child_process").spawn
const express = require('express')
const http = require('http')
const webSocket = require('ws')
const net = require("net");

const port = 3000
const app = express()

app.use(express.static(__dirname + "/../site/"))

let nodeValues = {}
let layout = {}

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

			/*	If a message contains the ID, it should be the first
			 *	message that a node sends. The first message contains all
			 *	sorts of relevant information so let's save it */
			if(msg.id !== undefined)
			{
				let node = {};
				node.instances = [];
				node.builtin = false;
				node.type = msg.type;
				node.name = msg.name;
				node.ID = msg.id

				node.context = msg.context;
				node.paramFormat = msg.format;
				node.connection = client

				activeNodes.push(node);
				nodeValues[node.ID] = {}
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

function sendToNode(node, message) {
	node.connection.write(message + "\n")
}

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
		context : node.context
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

		if(msg.cmd === "getlayout") {
			msg.result = [
				layout,
				nodeValues
			]
		}

		if(msg.cmd === "layout") {
			layout = msg.arg[0]
		}

		else if(msg.cmd === "instance") {
			const ID = msg.arg[0]
			node = activeNodes.find((n) => ID === n.ID);

			if(node === undefined)
				msg.error = true

			else {
				msg.result = createInstance(node)
				sendToNode(node, msg.arg[1] + "\r" + "instance")

				nodeValues[ID][msg.arg[1]] = ""
				console.log(nodeValues)
			}
		}

		else if(msg.cmd === "depend") {
			if (msg.arg[4]) {
				addDependency(msg.arg[0], parseInt(msg.arg[1]), msg.arg[2], parseInt(msg.arg[3]))
			} else {
				removeDependency(msg.arg[0], parseInt(msg.arg[1]), msg.arg[2], parseInt(msg.arg[3]))
			}
		}

		else if(msg.cmd === "parameters") {
			let node = activeNodes.find((n) => msg.arg[0] === n.ID);

			/*	Because the node deactivates itself when it receives new parameters,
			 *	reactivate it if it should be active */
			sendToNode(node, msg.arg[1] + "\r" + msg.arg[2])
			handleActivate(node.instances[msg.arg[1]])

			nodeValues[msg.arg[0]][msg.arg[1]] = msg.arg[2]
			console.log(nodeValues)
		}

		sendToAll(msg);
	})
})

let activeNodes = []

function handleActivate(instance) {
	//	Sensors cannot be activated
	if(instance.parent.context != "sensor") {

		/*	Because an action node or a control node will never pass
		 *	by itself, wait for one of the dependencies to pass
		 *	and then activate / deactivate the instance */
		const passed = dependenciesPassed(instance)

		if(passed) {
			console.log("activate", instance.parent.ID, "instance", instance.num);
			sendToNode(instance.parent, instance.num + "\ractivate")
		}

		else {
			console.log("deactivate", instance.parent.ID, "instance", instance.num);
			sendToNode(instance.parent, instance.num + "\rdeactivate")
		}
	}
}

function trigger(instance) {
	let passed = hasPassed(instance)
	console.log("trigger ", instance.parent.ID, " ", instance.num)

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
		handleActivate(i)
	})
}

function dependenciesPassed(instance) {
	let passed = 0
	instance.dependencies.forEach((d) => {
		passed += hasPassed(d)
	})

	return passed
}

function hasPassed(instance) {
	let passed = dependenciesPassed(instance)
	let thisPassed = instance.parent.context == "action" ? true : instance.passed
	let dependecyPassed = instance.dependencies.length == 0 ? true : passed > 0

	console.log("(", instance.parent.ID, " instance ", instance.num, ") Passed", passed, "/", instance.dependencies.length, " thisPassed ", thisPassed)
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

function removeDependency(toID, toInstance, nodeID, nodeInstance) {
	to = activeNodes.find((n) => toID === n.ID)
	dep = activeNodes.find((n) => nodeID === n.ID)

	const index = to.instances[toInstance].dependencies.indexOf(dep.instances[nodeInstance])
	if (index > -1) {
		to.instances[toInstance].dependencies.splice(index, 1)
		console.log(to.ID, " instance ", toInstance, " no longer depends on ", dep.ID, " instance ", nodeInstance)
	}

	//	Immediately notify about possible state changes
	trigger(dep.instances[nodeInstance])
	trigger(to.instances[toInstance])
}

function startBuiltinNode(scriptName, name) {
    const builtinRoot = __dirname + "/../nodes/builtin/"
    const nodePath = builtinRoot + scriptName + ".py"
    console.log(nodePath + " " + name)

    spawn("python3", [ nodePath, name ])
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
		startBuiltinNode("NodeTest", "test1");
		startBuiltinNode("NodeTime", "time1");
		//startBuiltinNode("NodeDay", "day1");
		//startBuiltinNode("NodeLoop", "loop1");
		//startBuiltinNode("NodeSleep", "sleep1");
		//startBuiltinNode("NodeCounter", "counter1");
		//startBuiltinNode("NodeProgram", "program1");
	})
})
