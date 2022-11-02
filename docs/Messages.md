# Messages

Messages are sent to different nodes by publishing to an MQTT topic that looks like `nodes/nodetype`,
so if you want to send a message to `NodeTime.py`, the topic should be `nodes/time`.

## General syntax
Messages consist of
* Node ID
	* Node type
	* Node name
* Node instance number
* Parameters

For an example a message could look like `time:anyname:0 12:44 before`. This instructs `NodeTime.py` to pass when it thinks that the current time is before 12:44.

If invalid parameters are passed, an error will be returned and the node will won't even check if it's condition passed. To prevent this you can send `time:anyname:0 paramsformat` to the node and it will respond with the format that it expects the parameters to be in. The format contains parameter names, their types and hints for what the values could be.

To create multiple instances of the node you can just change the instance number, so if the message looks like `time:anyname:1 12:44 before`, we're instructing instance 1 of `NodeTime.py` to pass if the current time is before 12:44.

## Handling responses
Responses are sent to the MQTT topic `noderesult`.

The response will be a JSON which has some of the following information:
* Who the message came from
* Which instance of the node the message came from
* Was there an error?
* The reason for the error
* Did the instances condition pass?
* Format of the node's parameters
