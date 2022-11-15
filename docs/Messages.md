# Messages

Messages are sent between nodes and the server using plain TCP sockets.

Why TCP? Because the nodes will never talk to eachother, using something like MQTT is a bit overkill.
Another downside of MQTT is that it requires a broker which everyone connects to it which is unnecessary.

## General syntax
Messages consist of
* Node instance number
* Parameters

Let's assume that we have a connection to NodeTime.py.
For an example a message could look like `0\r12:44\rbefore`. This instructs `NodeTime.py` to pass when it thinks that the current time is before 12:44.
The parameter values are separated by a carriage return

If invalid parameters are passed, an error will be returned and the node won't even try check if it's condition has passed.
To prevent this you can save and utilize the parameter format sent by the node when it first connects.

To create multiple instances of the node you can just change the instance number, so if the message looks like `1\r12:44\rbefore`,
we're instructing instance 1 of `NodeTime.py` to pass if the current time is before 12:44.

## Message contents

The first message a node sends will always contain:
* ID, Type, Name
* Who the message came from
* Format of the node's parameters
* Is the node a sensor

Messages sent after the first message might contain
* Which instance of the node the message came from
* Was there an error?
* The reason for the error
* Did the instance's condition pass?
