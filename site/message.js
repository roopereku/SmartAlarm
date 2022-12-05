const ws = new WebSocket("ws://localhost:3001");

ws.addEventListener("open", () => {
	showLoginWindow()
})

ws.addEventListener('message', (event) => {
	const msg = JSON.parse(event.data.toString())
	console.log(msg)

	if(msg.error)
		return;

	if(msg.cmd == "getlayout") {
		setLayout(msg.result[0])
		setValues(msg.result[1])
	}

	else if(msg.cmd == "nodeadd") {
		console.log("node type", msg.type)
		console.log("node name", msg.name)
		console.log("context", msg.context)
		console.log("icon", msg.icon)

		addNodeListing(msg.type, msg.name, msg.context, msg.icon, msg.showType)
		addNodeFormat(msg.type, msg.format)
	}

	else if(msg.cmd === "depend") {
		if(msg.result === false)
			cutDependency(msg.arg[1], msg.arg[3])
	}

	else if(msg.cmd === "passed") {
		console.log(msg.arg)
		highlightNodeByID(msg.arg[0], msg.arg[1], msg.arg[2] ? "green" : "red")
	}

	else if(msg.cmd == "dead") {
		disableNode(msg.arg[0])
		Swal.fire(
		  'Connection dead',
		  "Node " + msg.arg[1] + " has lost it's connection",
		  'error'
		)
	}

	else if(msg.cmd == "alive") {
		enableNode(msg.arg[0])
	}

	else if(msg.cmd == "login") {
		if(msg.result === false) {
			document.cookie = "passcode=; Path=/; SameSite=None; Secure"
			showLoginWindow()
		}
	}
});

function sendMessage(json)
{
	ws.send(JSON.stringify(json))
}

function handleLogin(passcode) {
	sendMessage({
		cmd : "login",
		arg : [ passcode ]
	})
}

function sendLayout(layoutJSON) {
	console.log(layoutJSON)
	sendMessage({
		cmd : "layout",
		arg : [ layoutJSON ]
	})
}

function setParameters(node, params) {
	sendMessage({
		cmd: "parameters",
		arg: [ node.name, node.data.instance, params ]
	})
}

function addDependency(to, node) {
	sendMessage({
		cmd: "depend",
		arg: [ to.name, to.data.instance, node.name, node.data.instance ]
	})
}

function removeDependency(from, node) {
	sendMessage({
		cmd: "undepend",
		arg: [ from.name, from.data.instance, node.name, node.data.instance ]
	})
}

function addInstance(node) {
	console.log("adding instance", node.data.instance)

	sendMessage({
		cmd: "instance",
		arg: [ node.name, node.data.instance ]
	})
}

function save() {
	console.log("Saving!")

	sendMessage({
		cmd: "save",
		arg: []
	})
}

function removeInstance(id) {
	sendMessage({
		cmd: "removeinstance",
		arg: [ id ]
	})
}
