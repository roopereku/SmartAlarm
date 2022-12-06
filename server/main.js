const spawn = require("child_process").spawn
const express = require('express')
const crypto = require('crypto')
const webSocket = require('ws')
const http = require('http')
const net = require("net")
const fs = require("fs")

const port = 3000
const app = express()

app.use(express.static(__dirname + "/../site/"))

let nodeValues = {}
let builtins = []
let layout = {}

let loginPasscode = "11dc1d3da523b078578806b4cf6ee2baad0cd9f26d6da62c3fe87c2520be7b1f"
console.log(encrypt("admin"))
function encrypt(pass) {
	return crypto.pbkdf2Sync(pass, 'salt', 1000, 512/16, 'sha512').toString('hex');
}

function recoverNodeState(node) {
	node.instances.forEach((i) => {
		sendToNode(node, i.num + "\r" + "instance")

		let instanceParams = nodeValues[node.ID][i.num]
		sendToNode(node, i.num + "\r" + instanceParams)
		handleActivate(i)
	})
}

function saveSession() {
	console.log("saving...")
	try {
		fs.mkdirSync("session")
	}

	catch(e) {}

	fs.writeFile("session/layout.json", JSON.stringify(layout), (err) => {
		if(err) console.log(err)
	})

	let instanceData = {}
	activeNodes.forEach((n) => {
		instanceData[n.ID] = []
		console.log("Values at", n.ID, nodeValues[n.ID])
		console.log("Instances", n.instances)

		n.instances.forEach((i) => {
			instanceDependencies = []

			i.dependencies.forEach((d) => {
				instanceDependencies.push(d.num)
			})

			console.log("at", i.num, nodeValues[n.ID][i.num])

			instanceData[n.ID].push({
				num : i.num,
				params : nodeValues[n.ID][i.num],
				dependencies : instanceDependencies
			})
		})
	})

	fs.writeFile("session/instances.json", JSON.stringify(instanceData), (err) => {
		if(err) console.log(err)
	})
}

function loadSession() {
	try {
		fs.mkdirSync("session")
	}

	catch(e) {}

	if(!fs.existsSync("session/instances.json")) {
		fs.writeFileSync("session/instances.json", "{}")
	}

	if(!fs.existsSync("session/layout.json")) {
		fs.writeFileSync("session/layout.json", "{}")
	}

	fs.readFile("session/layout.json", 'utf8', (err, data) => {
		if(err) {
			console.error(err);
			return;
		}

		layout = JSON.parse(data)
	});

	fs.readFile("session/instances.json", 'utf8', (err, data) => {
		if(err) {
			console.error(err);
			return;
		}

		let instanceData = JSON.parse(data)
		for (const [key, value] of Object.entries(instanceData)) {
			//	There should be no nodes at this point
			let name = key.split(":")[1]
			let node = { ID: key, name: name, instances: [] }
			nodeValues[key] = {}

			value.forEach((i) => {
				node.instances.push({
					num: i.num,
					parent: node,
					dependencies: []
				})
				
				nodeValues[key][i.num] = i.params
			})

			activeNodes.push(node)
		}

		activeNodes.forEach((n) => {
			for(let i = 0; i < n.instances.length; i++) {
				//	Look for each dependency of this instance
				instanceData[n.ID][i].dependencies.forEach((d) => {
					//	Loop through each node again so that we can find the dependency
					activeNodes.forEach((n2) => {
						//	Does any ID of the instances match the dependency
						let dep = n2.instances.find((inst) => inst.num == d)

						//	We have a match!
						if(dep !== undefined)
							n.instances[i].dependencies.push(dep)
					})
				})
			}
		})

		console.log(activeNodes)
	});
}

const server = net.createServer((client) => {
	console.log("Connection from ", client.remoteAddress)

    client.setKeepAlive(true, 1000);
	let lastMessage = ""

	client.on("error", (e) => {
		let node = activeNodes.find((n) => client === n.connection)

		console.log(node.ID, "Died")
		node.connection = undefined

		node.instances.forEach((i) => {
			i.passed = false
			trigger(i)
		})

		sendToAll({
			cmd : "dead",
			arg : [ node.ID, node.name ]
		})
	})

	client.on("data", (data) => {
		let stringified = data.toString()
		console.log(stringified)

		//	Was there an unfinished JSON in the last message?
		if(lastMessage.length > 0)
		{
			stringified = lastMessage + stringified
			console.log("Message is now", stringified)
			lastMessage = ""
		}

		/*	When using plain TCP, it's possible that separate messages
		 *	are found in the same packet. To prevent this split the data
		 *	with newlines because that shouldn't be in a JSON */
		const jsons = stringified.trim().split("\n")

		jsons.forEach((json) => {
			let msg = {}

			try {
				msg = JSON.parse(json)
				console.log(msg)
			}

			//	This JSON was missing some information so save it temporarily
			catch(e) {
				console.log("Message ended unexpectedly")
				lastMessage = json
				return
			}

			/*	If a message contains the ID, it should be the first
			 *	message that a node sends. The first message contains all
			 *	sorts of relevant information so let's save it */
			if(msg.id !== undefined)
			{
				let node = activeNodes.find((n) => msg.id === n.ID)
				const reconnect = node !== undefined
				const afterReboot = reconnect && node.context === undefined

				if(!reconnect) {
					console.log("new node")
					node = {};

					node.instances = [];
					node.ID = msg.id;

					activeNodes.push(node);
					nodeValues[node.ID] = {}
				}

				node.icon = msg.icon;
				node.context = msg.context;
				node.paramFormat = msg.format;
				node.connection = client;
				node.type = msg.type;
				node.name = msg.name;

				if(!reconnect || afterReboot) {
					ws.clients.forEach((client) => {
						informAboutNode(node, client)
					})
				}

				//	Only recover the node state if it ever disconnected
				if(reconnect) {
					console.log(node.ID, "reconnected")
					node.connection = client
					recoverNodeState(node)

					sendToAll({
						cmd : "alive",
						arg : [ node.ID, node.name ]
					})
				}
			}

			//	Is result present
			if(msg.result !== undefined) {
				//	Find the node that this message is from and see if it passef
				let node = activeNodes.find((n) => client === n.connection)
				findInstance(node, msg.instance).passed = msg.result

				trigger(findInstance(node, msg.instance))
			}

			if(msg.ignoreDependencies !== undefined) {
				let node = activeNodes.find((n) => client === n.connection)
				node.ignoreDependencies = msg.ignoreDependencies
				console.log(node.ID, "Ignore dependencies", node.ignoreDependencies)
			}
		})
	})
})

const httpServer = http.createServer(app).listen(3001)
const ws = new webSocket.Server({ server: httpServer })

function sendToNode(node, message) {
	if(node.connection !== undefined)
		node.connection.write(message + "\n")
}

function sendToAll(json) {
	ws.clients.forEach((client) => {
		if(client.authenticated) {
			client.send(JSON.stringify(json));
		}
	})
}

function informAboutNode(node, client) {
	//	Type names are shown on the website if this node isn't builtin
	const showType = builtins.find((b) => b === node.name) === undefined

	const msg = {
		cmd : "nodeadd",
		name : node.name,
		type : node.type,
		format : node.paramFormat,
		context : node.context,
		icon : node.icon,
		builtin : node.builtin,
		showType: showType
	}

	//	Send the listing if there's a connection
	if(node.connection !== undefined)
		client.send(JSON.stringify(msg));

	//	Is the connection is dead?
	else
	{
		/*	For some reason the frontend doesn't like it when the "dead"
		 *	message is sent immediately. To fix that let's add a small delay :-) */
		setTimeout(() => {
			client.send(JSON.stringify({
				cmd : "dead",
				arg : [ node.ID, node.name ]
			}));
		}, 500)
	}
}

function findInstance(node, num) {
	for(let i = 0; i < node.instances.length; i++) {
		if(node.instances[i].num == num)
			return node.instances[i]
	}

	console.log("Couldn't find instance", node.ID, num)
	return undefined
}

function sendLayout(c) {
	c.send(JSON.stringify({
		cmd : "getlayout",
		result: [ layout, nodeValues ]
	}));

	/*	FIXME
	 *	All of this probably could be sent in a single message.
	 *	It's easy to send a bunch of "passed" messages because the
	 *	frontend already has a handler for it but it's very inefficient */

	//	Send the "passed" state of each instance
	activeNodes.forEach((n) => {
		n.instances.forEach((i) => {
			c.send(JSON.stringify({
				cmd: "passed",
				arg: [ i.parent.ID, i.num, i.passed ]
			}))
		})
	})
}

ws.on("connection", (c) => {
	c.authenticated = false

	c.on("message", (payload) => {
		try {
			const msg = JSON.parse(payload.toString())
			console.log(msg)

			if(!c.authenticated && msg.cmd == "login") {
				c.authenticated = loginPasscode === msg.arg[0]
				msg.result = c.authenticated
				c.send(JSON.stringify(msg))
				
				//	Has the user logged in succesfully
				if(msg.result) {
					//	Inform about connected nodes
					activeNodes.forEach((n) => {
						informAboutNode(n, c)
					})

					//	Inform about the layout
					sendLayout(c)
				}

				return
			}

			else if(!c.authenticated)
			{
				console.log("Not logged in")
				return
			}

			if(msg.cmd === "layout") {
				layout = msg.arg[0]
			}

			else if(msg.cmd == "getlayout") {
				sendLayout(c)
			}

			else if(msg.cmd === "instance") {
				const ID = msg.arg[0]
				node = activeNodes.find((n) => ID === n.ID);

				if(node === undefined)
					msg.error = true

				else {
					sendToNode(node, msg.arg[1] + "\r" + "instance")
					msg.result = createInstance(node, msg.arg[1])

					nodeValues[ID][msg.arg[1]] = ""
					console.log(nodeValues)
				}
			}

			else if(msg.cmd === "removeinstance") {
				let node = undefined
				let instance = undefined

				console.log(layout)

				/*	Because drawflow actually removes a node before it tells the user about it,
				 *	we need to fetch information about the instance from an old version of the layout */
				checkLoop:
				for (const [modName, module] of Object.entries(layout.drawflow)) {
					for (const [key, value] of Object.entries(module.data)) {
						if(key === msg.arg[0].toString()) {
							console.log("Found")
							node = activeNodes.find((n) => value.name === n.ID)
							instance = findInstance(node, value.data.instance)
							break checkLoop
						}
					}
				}

				if(instance === undefined) {
					console.log("Instance is undefined when removing")
				}

				else {
					const index = node.instances.indexOf(instance)

					if(index > -1) {
						console.log("Removed instance", node.ID, instance.num)
						sendToNode(node, instance.num + "\r" + "removeinstance")

						delete nodeValues[node.ID][instance.num]
						console.log(nodeValues[node.ID], instance.num)
						node.instances.splice(index, 1)
					}

					else console.log("Index -1")
				}
			}

			else if(msg.cmd === "depend") {
				msg.result = addDependency(msg.arg[0], parseInt(msg.arg[1]), msg.arg[2], parseInt(msg.arg[3]))
			}

			else if(msg.cmd == "undepend") {
				removeDependency(msg.arg[0], parseInt(msg.arg[1]), msg.arg[2], parseInt(msg.arg[3]))
			}

			else if(msg.cmd === "parameters") {
				let node = activeNodes.find((n) => msg.arg[0] === n.ID);

				/*	Because the node deactivates itself when it receives new parameters,
				 *	reactivate it if it should be active */
				sendToNode(node, msg.arg[1] + "\r" + msg.arg[2])
				handleActivate(findInstance(node, msg.arg[1]))

				nodeValues[msg.arg[0]][msg.arg[1]] = msg.arg[2]
				console.log(nodeValues)
			}

			else if(msg.cmd == "save") {
				saveSession()
			}

			sendToAll(msg);
		}

		catch(e) {
			console.log(e)
		}
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
	let ignoreDependencies = instance.parent.ignoreDependencies === true
	let passed = ignoreDependencies || dependenciesPassed(instance)

	let thisPassed = instance.passed
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

function createInstance(node, num) {
	let entry = {}

	entry.dependencies = [];
	entry.passed = false;
	entry.parent = node
	entry.num = num

	node.instances.push(entry)
	console.log("Created instance", entry.num, "for", node.ID)

	return entry.num
}

function findInDependencies(from, node) {
	//	Make sure that the given node is not found in the dependency tree
	for(let i = 0; i < from.dependencies.length; i++) {
		if(findInDependencies(from.dependencies[i], node))
			return true
	}

	//	If we encounter the node that we want to find, return true
	return from === node
}

function addDependency(toID, toInstance, nodeID, nodeInstance) {
	to = activeNodes.find((n) => toID === n.ID)
	dep = activeNodes.find((n) => nodeID === n.ID)

	//	Prevent circular dependencies
	if(findInDependencies(findInstance(dep, nodeInstance), findInstance(to, toInstance)))
		return false

	findInstance(to, toInstance).dependencies.push(findInstance(dep, nodeInstance))
	console.log(to.ID, " instance ", toInstance, " now depends on ", dep.ID, " instance ", nodeInstance)

	//	Immediately notify about possible state changes
	trigger(findInstance(dep, nodeInstance))
	return true
}

function removeDependency(fromID, fromInstance, nodeID, nodeInstance) {
	from = activeNodes.find((n) => fromID === n.ID)
	dep = activeNodes.find((n) => nodeID === n.ID)

	fromInst = findInstance(from, fromInstance)
	depInst = findInstance(dep, nodeInstance)

	const index = fromInst.dependencies.indexOf(depInst)

	if (index > -1) {
		fromInst.dependencies.splice(index, 1)
		console.log(from.ID, " instance ", fromInstance, " no longer depends on ", dep.ID, " instance ", nodeInstance)

		/*	This is a little hacky, but because handle_activate can only
		 *	be called in the "forDependantInstances" callback in trigger,
		 *	once we delete a dependency here and the dependant instance is
		 *	something else than a sensor node, it's status will not change.
		 *	To fix that let's forcefully say that it didn't pass and call handleActivate */
		if(from.context !== "sensor") {
			fromInst.passed = false
			handleActivate(fromInst)
		}

		//	Immediately notify about possible state changes
		trigger(fromInst)

		return
	}

	console.log("no dependency to begin with")
}

function startBuiltinNode(scriptName, name) {
    const builtinRoot = __dirname + "/../nodes/builtin/"
    const nodePath = builtinRoot + scriptName + ".py"
    console.log(nodePath + " " + name)

	builtins.push(name)
    spawn("python3", [ nodePath, name ])
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/../site/index.html")
})

app.listen(port, () => {
	loadSession()

	server.listen(4242, () => {
		startBuiltinNode("NodeTest", "test node");
		startBuiltinNode("NodeTime", "Time");
		startBuiltinNode("NodeDay", "Day");
		startBuiltinNode("NodeLoop", "Loop");
		startBuiltinNode("NodeSleep", "Delay");
		startBuiltinNode("NodeCounter", "Pass Counter");
		startBuiltinNode("NodeProgram", "Program");
		//startBuiltinNode("NodeDiscord", "Discord");
		//startBuiltinNode("NodeTelegram", "Telegram");
		//startBuiltinNode("NodeEmail", "E-Mail");
	})
})
