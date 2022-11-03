const addTime = document.getElementById("time");
const addDay = document.getElementById("day");
const addDep = document.getElementById("addDep");
const instances = document.getElementById("instances");

const ws = new WebSocket("ws://localhost:3001");

ws.addEventListener('message', (event) => {
	const msg = JSON.parse(event.data.toString())
	console.log(msg)

	if(msg.error)
		return;

	if(msg.cmd === "instance")
		showInstance(msg.arg[0], msg.result);

	if(msg.cmd == "dependency")
	{
		const target = document.getElementById(msg.arg[0] + ":" + msg.arg[1].toString());
		target.appendChild(document.createElement("br"));
		target.appendChild(document.createTextNode(msg.arg[2] + ":" + msg.arg[3].toString()));
	}

	if(msg.cmd == "trigger")
	{
		const target = document.getElementById(msg.arg[0])
		target.style.backgroundColor = "green";
	}
});

function sendMessage(json)
{
	ws.send(JSON.stringify(json))
}

function showInstance(id, index) {
	let box = document.createElement("div");
	box.className = "instance";
	box.id = id + ":" + index.toString()

	box.appendChild(document.createTextNode("ID: " + id + " index: " + index.toString()))

	instances.appendChild(box);
}

addDep.onclick = () => {
	const depToID = document.getElementById("depToID").value;
	const depToIndex = document.getElementById("depTo").value;

	const depID = document.getElementById("depID").value;
	const depIndex = document.getElementById("dep").value;

	sendMessage({
		cmd: "dependency",
		arg: [ depToID, depToIndex, depID, depIndex ]
	})
}

addTime.onclick = () => {
	sendMessage({
		cmd: "instance",
		arg: [ "time:1" ]
	})
}

addDay.onclick = () => {
	sendMessage({
		cmd: "instance",
		arg: [ "day:1" ]
	})
}

function resetBackgrounds()
{
	for(let i = 0; i < instances.children.length; i++)
		instances.children[i].style.backgroundColor = "red"
}

setInterval(resetBackgrounds, 1000)
