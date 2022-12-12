const serverURL = "ws://localhost:8765"

function openConfigWindow() {
	Swal.fire({
		title: "Connecting..."
	})
	connectConfigServer().then((configSocket) => {
		console.log("Called then")
        configSocket.send("read")

		configSocket.addEventListener('message', (data) => {
			if(data.data === "nodevice")
			{
				Swal.fire(
				  'No device connected!',
				  'Make sure that your external node is connected via USB',
				  'error'
				)

				return
			}

			console.log(data)
			let config = data.data.split("\r")

			let configDiv = document.getElementById("configInputs")
			configDiv.innerHTML = ""

			for (let i = 0; i < config.length; i += 2) {
				configDiv.innerHTML += '<p>' + config[i] + '</p>' +
					'<input type=text class=configInput placeholder="' + config[i + 1] + '">'
			}
		})

		Swal.fire({
			title: 'Config',
			html: '<div id=configInputs><p>Python script has not started...</p></div>',
			showCancelButton: true,

		}).then((result) => {
			if(result.isConfirmed) {
				let configDiv = document.getElementById("configInputs")
				let inputs = configDiv.querySelectorAll(".configInput")

				let message = ""
				for (let i = 0; i < inputs.length; i++) {
					let key = inputs[i].previousSibling.innerHTML
					let value = inputs[i].value || inputs[i].placeholder

					console.log(key, value)
					message += key + "\r" + value + "\r"
				}

				console.log(message)
				configSocket.send("write\n" + message)
			}

			else configSocket.send("cancel")
		})
	
	}).catch(() => {
		Swal.fire({
			title: 'Unable to connect!',
			text: 'Make sure that the python configuration server is running',
			icon: 'error',

			showCancelButton: true,
			confirmButtonText: "Download python script"

		}).then((result) => {
			if(result.isConfirmed) {
				location.href += "configserver.py"
			}
		})
	})
}

function connectConfigServer() {
	const promise = new Promise((resolve, reject) => {
		console.log("Trying to connect to config server")
		const configSocket = new WebSocket(serverURL)

		configSocket.addEventListener("open", () => {
			console.log("connection opened")
			resolve(configSocket)
		})

		configSocket.addEventListener("close", () => {
			console.log("connection closed")
			reject()
		})
	})

	return promise
}
