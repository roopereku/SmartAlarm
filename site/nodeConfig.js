let ws2url = "ws://192.168.91.223:8765"
let ws2 = new WebSocket(ws2url)
let readCallback, connectCallback

function connectToWS(callback) {
    connectCallback = callback
    if (!ws2) {
        console.log("Trying to connect to ws")
        ws2 = new WebSocket(ws2url)
    } else if (ws2.readyState === WebSocket.OPEN) {
        connectCallback()
    } else {
        let interval = setInterval(() => {
            if (ws2.readyState === WebSocket.OPEN){
                clearInterval(interval)
            } else {
                console.log("Trying to connect to ws")
                ws2 = new WebSocket(ws2url)
            }
        }, 3000);
    }
}

function sendConfig(message) {
    ws2.send("write\n" + message)
}

function readConfig(callback) {
    readCallback = callback
    connectToWS(() => {
        ws2.send("read")
    })
}

ws2.addEventListener("close", () => {
    console.log("connection closed")
})

ws2.addEventListener("open", () => {
    console.log("connection opened")
    if (connectCallback) {
        connectCallback()
    }
})

ws2.addEventListener('message', (data) => {
    console.log(data)
    let config = data.data.split("\r")
    readCallback(config)
})