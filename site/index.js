const id = document.getElementById("drawflow");
const editor = new Drawflow(id);

editor.reroute = true;
editor.reroute_fix_curvature = true;
editor.force_first_input = false;
editor.draggable_inputs = false;

editor.addModule('test')

let nodeFormats = {}

function encrypt(pass) {
	return CryptoJS.PBKDF2(pass, 'salt', { keySize: 512/64, iterations: 1000, hasher:CryptoJS.algo.SHA512 }).toString(CryptoJS.enc.Hex);
}

function showLoginWindow() {
	function getCookie(name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(';').shift();
	}

	passcode = getCookie("passcode")

	if(passcode === undefined) {
		document.cookie = "passcode=; Path=/; SameSite=None; Secure"
		passcode = ""
	}

	if(passcode.length > 0)
		handleLogin(passcode)

	else {
		Swal.fire({
			title: 'Enter the passcode',
			input: 'password',
		}).then((result) => {
			handleLogin(encrypt(result.value))
			document.cookie = "passcode=" + encrypt(result.value) + "; Path=/; SameSite=None; Secure"
		})
	}
}

function logout() {
	document.cookie = "passcode=; Path=/; SameSite=None; Secure"
	location.reload()
}

function changeModulePage(module) {
	editor.changeModule(module)
}

function setLayout(layoutJSON) {
    if(Object.keys(layoutJSON).length === 0)
		return

	editor.import(layoutJSON);
}

function cutDependency(inputID, outputID)
{
	editor.removeSingleConnection(outputID, inputID, "output_1", "input_1")
	Swal.fire(
	  'Cannot do that',
	  'Circular dependencies are not allowed',
	  'error'
	)
}

function setValues(valuesJSON) {
	for(const [key, value] of Object.entries(valuesJSON)) {
		//	Find the ID's of the instances of the given node
		const ids = editor.getNodesFromName(key)

		console.log("values", key, value)

		//	Loop through each instance
		ids.forEach((id) => {
			//	Find the dom element, the inputs and values that should be inserted
			let node = document.getElementById("node-" + id)
			let inputs = node.offsetParent.querySelectorAll(".nodeValue")

			//	The id should be a key in the JSON sent by the server
			let inputValues = value[id].split("\r")

			//	Update values
			for(let i = 0; i < inputValues.length; i++)
				inputs[i].value = inputValues[i]
		})
	}
}

function addNodeFormat(type, format) {
	nodeFormats[type] = format
}

function updateParameters(e) {
	//	Find all of the inputs that are children of "box" inside some node
	let values = e.offsetParent.querySelectorAll(".nodeValue")
	let paramString = ""
	let valid = 0

	values.forEach((v) => {
		paramString += v.value + "\r"
		valid += v.reportValidity()
	})

	if(valid === values.length) {
		console.log("id", e.offsetParent.id)
		let node = editor.getNodeFromId(e.offsetParent.id.split("-")[1])
		setParameters(node, paramString.trim())
	}
}

function addNodeListing(type, name, context, icon, showType) {
	let listings = document.getElementById("listings")
	let entry = document.createElement("div")

	entry.className = "drag-drawflow"
	entry.draggable = true
	entry.setAttribute("ondragstart", "drag(event)")
	entry.setAttribute("data-node", type + ":" + name)
	entry.setAttribute("context", context)

	let iconElement = document.createElement("i")
	iconElement.className = icon

	let typeText = document.createElement("span")
	let text = document.createElement("span")
	text.innerHTML = name

	if(showType) {
		typeText.innerHTML = type
		typeText.className = "node-type"
	}

	text.style.margin = "10px"

	entry.appendChild(iconElement)
	entry.appendChild(text)
	entry.appendChild(typeText)

	listings.appendChild(entry)
}

function showNodesWithContext(context) {
	let listings = document.getElementById("listings")
	let children = listings.children

	for (let i = 0; i < children.length; i++) {
		if (children[i].className === 'drag-drawflow') {
			if (children[i].getAttribute("context") !== context && context !== "all") {
				children[i].style.display = "none"
			} else {
				children[i].style.display = "block"
			}
		}
	}
}

function getNodeTitle(node)
{
	let actualID = "node-" + node.id
	let real = document.getElementById(actualID)
	let title = real.getElementsByClassName("title-box")[0]

	return title
}

function highlightNodeByID(name, instance, color)
{
	let nodes = editor.getNodesFromName(name)
	console.log(nodes)

	nodes.forEach((id) => {
		let node = editor.getNodeFromId(id)
		if(node.data.instance === instance)
			highlightNode(node, color)
	})
}

function highlightNode(node, color)
{
	let title = getNodeTitle(node)
	title.style.backgroundColor = color
	title.style.borderBottom = "1px solid " + color
}

let disabledNodes = []
function disableNode(name) {
	if (!disabledNodes.includes(name)) {
		disabledNodes.push(name)
	}

	let nodes = editor.getNodesFromName(name)
	console.log("nodes: " + nodes)

	nodes.forEach((id) => {
		let node = document.getElementById("node-" + id)
		node.classList.add("grayout")

		let inputs = node.getElementsByClassName("nodeValue")
		for (let i = 0; i < inputs.length; i++) {
			inputs[i].setAttribute("disabled", "")
		}
	})
}

function enableNode(name) {
	let index = disabledNodes.indexOf(name);
	if (index > -1) {
		disabledNodes.splice(index, 1);
	}

	let nodes = editor.getNodesFromName(name)
	console.log("nodes: " + nodes)

	nodes.forEach((id) => {
		let node = document.getElementById("node-" + id)
		node.classList.remove("grayout")

		let inputs = node.getElementsByClassName("nodeValue")
		for (let i = 0; i < inputs.length; i++) {
			inputs[i].removeAttribute("disabled")
		}
	})
}

editor.start();

// Events!
editor.on('nodeCreated', function(id) {
	console.log("Node created " + id);
	editor.updateNodeDataFromId(id, { instance: parseInt(id) })
	let node = editor.getNodeFromId(id)

	if (disabledNodes.includes(node.name)) {
		disableNode(node.name)
	}

	console.log(node)

	addInstance(node)
	sendLayout(editor.export())
})

editor.on('nodeRemoved', function(id) {
	removeInstance(id)
	console.log("Node removed " + id);
	sendLayout(editor.export())
})

editor.on('nodeSelected', function(id) {
  console.log("Node selected " + id);
})

editor.on('moduleCreated', function(name) {
  console.log("Module Created " + name);
})

editor.on('moduleChanged', function(name) {
  console.log("Module Changed " + name);
})

editor.on('connectionCreated', function(connection) {
	console.log('Connection created');

	from = editor.getNodeFromId(connection.output_id)
	to = editor.getNodeFromId(connection.input_id)

	console.log(from)
	addDependency(to, from)

	sendLayout(editor.export())
})

editor.on('connectionRemoved', function(connection) {
	console.log('Connection removed');

	from = editor.getNodeFromId(connection.output_id)
	to = editor.getNodeFromId(connection.input_id)

	console.log(from)
	removeDependency(to, from)

	sendLayout(editor.export())
})
/*
editor.on('mouseMove', function(position) {
  console.log('Position mouse x:' + position.x + ' y:'+ position.y);
})
*/
editor.on('nodeMoved', function(id) {
	console.log("Node moved " + id);
	sendLayout(editor.export())
})

editor.on('zoom', function(zoom) {
  console.log('Zoom level ' + zoom);
})

editor.on('translate', function(position) {
  console.log('Translate x:' + position.x + ' y:'+ position.y);
})

editor.on('addReroute', function(id) {
  console.log("Reroute added " + id);
})

editor.on('removeReroute', function(id) {
  console.log("Reroute removed " + id);
})

/* DRAG EVENT */

/* Mouse and Touch Actions */

var elements = document.getElementsByClassName('drag-drawflow');
for (var i = 0; i < elements.length; i++) {
  elements[i].addEventListener('touchend', drop, false);
  elements[i].addEventListener('touchmove', positionMobile, false);
  elements[i].addEventListener('touchstart', drag, false );
}

var mobile_item_selec = '';
var mobile_last_move = null;
function positionMobile(ev) {
 mobile_last_move = ev;
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  if (ev.type === "touchstart") {
	mobile_item_selec = ev.target.closest(".drag-drawflow").getAttribute('data-node');
  } else {
  ev.dataTransfer.setData("node", ev.target.getAttribute('data-node'));
  }
}

function drop(ev) {
  if (ev.type === "touchend") {
	var parentdrawflow = document.elementFromPoint( mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow");
	if(parentdrawflow != null) {
	  addNodeToDrawFlow(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY);
	}
	mobile_item_selec = '';
  } else {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("node");
	addNodeToDrawFlow(data, ev.clientX, ev.clientY);
  }

}

function addNodeToDrawFlow(id, pos_x, pos_y) {
	if(editor.editor_mode === 'fixed')
		return false;

	pos_x = pos_x * ( editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * ( editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
	pos_y = pos_y * ( editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * ( editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

	let [type, name] = id.split(":")
	console.log(type, name)

	let html = '<div><div class="title-box">' + name +
		'</div><div class="box"><form onchange=updateParameters(this) onsubmit="return false">'

	for (const [nodeType, format] of Object.entries(nodeFormats)) {
		if(nodeType == type)
		{
			for (const [key, param] of Object.entries(format)) {
				html += '<p>' + param.description + '</p>'

				if(param.strict) {

					html += '<select class="nodeValue" required>'
					html += '<option hidden selected></option>'

					for (const [k, p] of Object.entries(param.hint))
						html += '<option value="' + k + '">' + p + '</option>'

					html += '</select>'
				}

				else {
					html += '<input type="' + param.type + '" class="nodeValue" required>'
				}
			}

			html += '</div></form></div>'

			let count = editor.getNodesFromName(type + ":" + name).length + 1
			console.log("nodes", editor.getNodesFromName(type + ":" + name))

			editor.addNode(type + ":" + name, 1, 1, pos_x, pos_y, type, {}, html );
			break
		}
	}
}

var transform = '';
function showpopup(e) {
e.target.closest(".drawflow-node").style.zIndex = "9999";
e.target.children[0].style.display = "block";
//document.getElementById("modalfix").style.display = "block";

//e.target.children[0].style.transform = 'translate('+translate.x+'px, '+translate.y+'px)';
transform = editor.precanvas.style.transform;
editor.precanvas.style.transform = '';
editor.precanvas.style.left = editor.canvas_x +'px';
editor.precanvas.style.top = editor.canvas_y +'px';
console.log(transform);

//e.target.children[0].style.top  =  -editor.canvas_y - editor.container.offsetTop +'px';
//e.target.children[0].style.left  =  -editor.canvas_x  - editor.container.offsetLeft +'px';
editor.editor_mode = "fixed";
}

function closemodal(e) {
 e.target.closest(".drawflow-node").style.zIndex = "2";
 e.target.parentElement.parentElement.style.display  ="none";
 //document.getElementById("modalfix").style.display = "none";
 editor.precanvas.style.transform = transform;
   editor.precanvas.style.left = '0px';
   editor.precanvas.style.top = '0px';
  editor.editor_mode = "edit";
}

function changeModule(event) {
  var all = document.querySelectorAll(".menu ul li");
	for (var i = 0; i < all.length; i++) {
	  all[i].classList.remove('selected');
	}
  event.target.classList.add('selected');
}

function changeMode(option) {

//console.log(lock.id);
  if(option == 'lock') {
	lock.style.display = 'none';
	unlock.style.display = 'block';
  } else {
	lock.style.display = 'block';
	unlock.style.display = 'none';
  }

}
