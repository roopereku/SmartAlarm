import paho.mqtt.client as mqtt
import json
import time
import sys

broker_ip = "localhost"
broker_port = 1883

class node_base:
    def __init__(self, node_type, delay, is_sensor):
        print("Node %s" % (node_type))

        if(len(sys.argv) == 1):
            print("Expected a name for node %s" % (nodetype))
            quit(1)
    
        self.name = sys.argv[1]
        self.node_type = node_type
        self.ID = node_type + ":" + self.name
        self.is_sensor = is_sensor
        self.delay = delay
        self.instances = [ { "ready" : False, "params" : {}, "lastResult": False } ]

        self.client = mqtt.Client(self.ID)
        self.client.connect(broker_ip, broker_port)
        print("%s Connected to %s:%d" % (self.ID, broker_ip, broker_port))

        self.client.on_message = self.__handle_message
        self.client.subscribe("nodes/" + node_type)
        print("Subscribed to nodes/" + node_type)

        self.client.loop_start()
        while(True):
            should_sleep = False

            # Only sensors call check and send messages
            if(not self.is_sensor):
                time.sleep(0.01)
                continue

            # Loop through each instance
            for i in range(len(self.instances)):
                # If the instance is ready for checking, call check()
                if(self.instances[i]["ready"]):
                    result = self.check(self.instances[i]["params"])

                    # Only send messages if the value differs to minimize traffic
                    if(result != self.instances[i]["lastResult"]):
                        message = {
                            "result" : result,
                            "instance" : i
                        }

                        should_sleep = True
                        self.__respond(message)

                    self.instances[i]["lastResult"] = result

            # Sleep for the user specified amount
            if(should_sleep):
                time.sleep(delay)

            # Minimize CPU usage but don't have a big delay
            else: time.sleep(0.01)

    def __handle_activate(self, instance, value):
        if(not "activated" in self.instances[instance]):
            self.instances[instance]["activated"] = False

        # If the node is already in the given state, do nothing
        if(self.instances[instance]["activated"] == value):
            return

        # Update the state
        self.instances[instance]["activated"] = value

        # Activate or deactivate
        if(value): self.activate(self.instances[instance]["params"])
        else: self.deactivate(self.instances[instance]["params"])

    def __respond(self, response):
        response["from"] = self.ID
        self.client.publish("noderesult", json.dumps(response))

    def __patched_format(self):
        format_preset = {
            "default" : "",
            "type" : "string",
            "strict" : False,
            "hint": {}
        }

        fmt = self.get_params_format()
        result = {}

        # Complete each field of the format if they're missing some field in preset
        for i in fmt:
            result[i] = format_preset.copy()
            result[i].update(fmt[i])

        return result

    def __handle_message(self, client, userdata, message):
        p = message.payload.decode("utf-8").split()
        msg_id = p[0].split(":")

        # Ignore the message if ID doesn't contain type, name and instance
        if(len(msg_id) != 3):
            return;

        # Only handle messages meant for this node
        if(msg_id[0] != self.node_type or msg_id[1] != self.name):
            return

        # If the instance number is more than there are instances, add instances
        instance = int(msg_id[2])
        for i in range(len(self.instances), instance + 1):
            self.instances.append({ "ready" : False, "params" : {}, "lastResult": False })

        # Delete the ID from the incoming parameters
        del p[0]

        params_format = self.__patched_format()
        result = { "valid" : True, "reason" : "", "instance" : instance }

        # Ignore empty messages
        if(len(p) == 0):
            return

        # Is the server asking for information about this node
        elif(p[0] == "info"):
            result["format"] = params_format
            result["sensor"] = self.is_sensor

        # Is the first parameter "activate" and is this node a sensor
        elif(p[0] == "activate" and not self.is_sensor):
            self.__handle_activate(instance, True)

        elif(p[0] == "deactivate" and not self.is_sensor):
            self.__handle_activate(instance, False)

        # Does the the parameter count match
        elif(len(p) != len(params_format)):
            result["reason"] = "Number of parameters should be %d" % (len(params_format))
            result["valid"] = False

        else:
            # What keys are in params_format
            params_keys = list(params_format)

            # Loop through each incoming parameter
            for i in range(len(p)):
                typename = params_format[params_keys[i]]
                value = None

                # Attempt to convert the parameter to it's real type
                try:
                    if(typename == "int"): value = int(p[i])
                    elif(typename == "float"): value = float(p[i])

                    if(value == None):
                        value = p[i]

                    self.instances[instance]["params"][params_keys[i]] = value

                    if(params_format[params_keys[i]]["strict"]):
                        matches = 0
                        for h in params_format[params_keys[i]]["hint"]:
                            matches += p[i] == h

                        if(matches == 0):
                            result["reason"] = "Parameter '%s' doesn't match hints" % (params_keys[i])
                            result["valid"] = False
                            break

                # The type of the parameter is invalid
                except ValueError:
                    result["reason"] = "Parameter '%s' should be of type '%s'" % (params_keys[i], typename)
                    result["valid"] = False
                    break

            # If there's no error so far, validate the parameters
            if(result["valid"]):
                res = self.validate_params(self.instances[instance]["params"])
                self.instances[instance]["ready"] = True
                if(res): result.update(res)

            # If the parameter validation failed, clear the parameters
            if(not result["valid"]):
                self.instances[instance]["params"] = {}
                self.instances[instance]["ready"] = False
                self.instances[instance]["lastResult"] = False

                # If the parameters of a non-sensor are invalid, might aswell deactivate the instance
                if(not self.is_sensor):
                    self.__handle_activate(instance, False)

        self.__respond(result)

    def check(self, params):
        raise NotImplementedError()

    def activate(self, params):
        raise NotImplementedError()

    def deactivate(self, params):
        raise NotImplementedError()

    def validate_params(self, params):
        raise NotImplementedError()

    def get_params_format(self, params):
        raise NotImplementedError()
