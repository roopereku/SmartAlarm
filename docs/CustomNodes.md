# Creating custom nodes

Nodes can be easily made in Python or C++ by utilizing `NodeBase`.
There are two types of nodes, sensors and alarms.

## Node Parameters
Python example
```py
from NodeBase import node_base

class example_node(node_base):
	def check(self, params):
		return True

	def validate_params(self, params):
		pass

	def get_params_format(self):
		return {}
		
node = example_node("example", 1, True)
```
This code snippet creates a node that is a sensor and checks if it's condition has passed every second. It does not take any parameters and always passes the condition. To make it so that it takes 1 parameter which takes some text as it's parameter we can change `get_params_format` as follows
```py
def get_params_format(self):
		return {
			"exampleparam" : {
				type: "text"
			}
		}
```
When an instance of this node is created on the website, the user can see a text box with the text "exampleparam". Now let's utilize this parameter.

```py
def check(self, params):
	return params["exampleparam"] == "examplevalue"
```
If the user types "examplevalue" into said text box, the instance will pass and allow other nodes to do something if they depend on an instance of the example node.

It's also possible to validate parameters sent by the user
```py
def validate_params(self, params):
	if(params["exampleparam"] == "unwantedvalue"):
		return {
			"valid": False,
			"reason": "Value is unwanted"
		}
```
If the user passes "unwantedvalue" to "exampleparam", they will receive a message telling them that this value is not valid.

If you want to save something in validate_params, save it directly to `params` if it isn't supposed be shared among all of the instances
```py
def validate_params(self, params):
	params["valueToSave"] = 12
```

If you want to have a known collection of possible values for a parameter, you use the `hint` field

```py
def get_params_format(self):
		return {
			"exampleparam" : {
				strict: "True",
				"hint" : {
					"value" : "This is displayed on the site",
					"othervalue" : "This too is displayed on the site",
				}
			}
		}
```

## Sensor Nodes
Sensor nodes require the following methods
* `def check(self, params):`
	- Called at a user defined interval
	- Returns true / false

## Alarm Nodes
Alarm nodes require the following methods
* `def activate(self, params):`
	- Called when at least one of the dependencies passes
* `def deactivate(self, params):`
	- Called when parameters change or no dependencies pass
