const ws = new WebSocket("ws://localhost:3001");

ws.addEventListener('message', (event) => {
	const msg = JSON.parse(event.data.toString())
	console.log(msg)

	if(msg.error)
		return;

	//if(msg.cmd === "instance")
	//	showInstance(msg.arg[0], msg.result);

	if(msg.cmd == "nodeadd")
	{
		console.log("node type", msg.type)
		console.log("node name", msg.name)
		console.log("is sensor", msg.sensor)

		addNodeListing(msg.type, msg.name, msg.sensor)
		addNodeFormat(msg.type, msg.format)
	}

	else if(msg.cmd === "dependency")
	{
	}

	else if(msg.cmd === "passed")
	{
		console.log(msg.arg)
		highlightNodeByID(msg.arg[0], msg.arg[1], msg.arg[2] ? "green" : "red")
	}
});

function sendMessage(json)
{
	ws.send(JSON.stringify(json))
}

/*function addDependency(to, dep)
{
	let delim = dep.lastIndexOf(":");
	let depID = dep.slice(0, delim);
	let depInst = dep.slice(delim + 1);

	delim = to.lastIndexOf(":");
	let toID = to.slice(0, delim);
	let toInst = to.slice(delim + 1);

	sendMessage({
		cmd: "dependency",
		arg: [ toID, toInst, depID, depInst ]
	})
}
*/

function setParameters(node, params) {
	sendMessage({
		cmd: "parameters",
		arg: [ node.name, node.data.instance, params ]
	})
}

function addDependency(to, node) {
	sendMessage({
		cmd: "dependency",
		arg: [ to.name, to.data.instance, node.name, node.data.instance ]
	})
}

function addInstance(node) {
	sendMessage({
		cmd: "instance",
		arg: [ node.name ]
	})
}
