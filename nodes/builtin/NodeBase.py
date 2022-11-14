import socket
import select
import json
import time
import sys

server_ip = "localhost"
server_port = 4242

class node_base:
    def __init__(self, node_type, delay, context):
        print("Node %s" % (node_type))

        if(len(sys.argv) == 1):
            print("Expected a name for node %s" % (nodetype))
            quit(1)
    
        self.name = sys.argv[1]
        self.node_type = node_type
        self.ID = node_type + ":" + self.name
        self.context = context
        self.delay = delay

        # If the node takes no parameters, it's ready by default
        self.defaultReady = len(self.get_params_format()) == 0
        self.instances = [ { "ready" : self.defaultReady, "params" : {}, "lastResult": None } ]

        self.control_reset_on_deactivate(True)
        self.__disable_control(0)

        print("Default ready", self.defaultReady)

        self.connection = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.connection.connect((server_ip, server_port))

        self.poller = select.poll()
        self.poller.register(self.connection, select.POLLIN)

        # Send out relevant information
        self.__respond({
            "format": self.__patched_format(),
            "context": self.context,
            "id" : self.ID,
            "name" : self.name,
            "type" : self.node_type
        })

        while(True):
            event = self.poller.poll(0)
            for desc, ev in event:
                data = self.connection.recv(2048)
                self.__handle_single_messages(data)

            # Only sensors and control nodes call check and send messages
            if(self.context == "action"):
                time.sleep(0.01)
                continue

            should_sleep = False

            # Loop through each instance
            for i in range(len(self.instances)):
                # If the instance is ready for checking, call check()
                if(self.instances[i]["ready"]):

                    # If a control node instance hasn't been activated, don't perform check
                    if(self.context == "control" and not self.instances[i]["activated"]):
                        continue

                    self.current_instance = i
                    result = self.check(self.instances[i]["params"])

                    # Only send messages if the value differs to minimize traffic
                    if(result != self.instances[i]["lastResult"]):
                        message = {
                            "result" : result,
                            "instance" : i
                        }

                        self.__respond(message)

                    self.instances[i]["lastResult"] = result
                    should_sleep = True

            # Sleep for the user specified amount
            if(should_sleep):
                time.sleep(delay)

            # Minimize CPU usage but don't have a big delay
            else: time.sleep(0.01)

    def __handle_activate(self, instance, value):
        print(value, " Passed to __handle_activate")

        if(not "activated" in self.instances[instance]):
            self.instances[instance]["activated"] = False

        # If the action node is already in the given state, do nothing.
        # Control nodes can accept the previous state
        if(self.context == "action" and self.instances[instance]["activated"] == value):
            return

        # Are the parameters set?
        if(not self.instances[instance]["ready"]):
            # TODO return a status indicating error
            return

        # Update the state
        self.instances[instance]["activated"] = value

        # Activate or deactivate
        if(value):
            self.activate(self.instances[instance]["params"])

        else:
            if(self.context == "control"):
                # There may be a situation (Such as in NodeCounter) where
                # it shouldn't reset the control nodes state when all dependencies
                # are inactive because the state needs to persist.
                if(self.reset_control):
                    self.__disable_control(instance)

            else: self.deactivate(self.instances[instance]["params"])

        if(self.context == "action"):
            message = {
                "result" : value,
                "instance" : instance
            }

            self.__respond(message)

    def __respond(self, response):
        self.connection.sendall(bytes(json.dumps(response) + "\n", encoding="utf8"))

    def __patched_format(self):
        format_preset = {
            "default" : "",
            "type" : "text",
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

    def __handle_single_messages(self, buffer):
        p = buffer.decode("utf-8").split("\n")
        for msg in p:
            self.__handle_message(msg)

    def __handle_message(self, message):
        p = message.split()
        if(len(p) == 0):
            return

        print(p)

        # If the instance number is more than there are instances, add instances
        instance = int(p[0])
        for i in range(len(self.instances), instance + 1):
            self.instances.append({ "ready" : self.defaultReady, "params" : {}, "lastResult": None })
            self.__disable_control(len(self.instances) - 1)

        # Delete the ID from the incoming parameters
        del p[0]

        params_format = self.__patched_format()
        result = { "valid" : True, "reason" : "", "instance" : instance }

        # Ignore empty messages
        if(len(p) == 0):
            return

        # Is the first parameter "activate" and is this node a sensor
        elif(p[0] == "activate" and self.context != "sensor"):
            return self.__handle_activate(instance, True)

        elif(p[0] == "deactivate" and self.context != "sensor"):
            return self.__handle_activate(instance, False)

        # Does the the parameter count match
        elif(len(p) != len(params_format)):
            result["reason"] = "Number of parameters should be %d" % (len(params_format))
            result["valid"] = False

        else:
            # If new parameters are being set, call deactivate with the old parameters
            if(self.context != "sensor"):
                self.__handle_activate(instance, False)

            # What keys are in params_format
            params_keys = list(params_format)

            # Loop through each incoming parameter
            for i in range(len(p)):
                if(params_format[params_keys[i]]["strict"]):
                    matches = 0
                    for h in params_format[params_keys[i]]["hint"]:
                        matches += p[i] == h

                    if(matches == 0):
                        result["reason"] = "Parameter '%s' doesn't match hints" % (params_keys[i])
                        result["valid"] = False
                        break

                self.instances[instance]["params"][params_keys[i]] = p[i]

            # If there's no error so far, validate the parameters
            if(result["valid"]):
                res = self.validate_params(self.instances[instance]["params"])
                self.instances[instance]["ready"] = True
                if(res): result.update(res)

            # If the parameter validation failed, clear the parameters
            if(not result["valid"]):
                self.instances[instance]["params"] = {}
                self.instances[instance]["ready"] = False
                self.instances[instance]["lastResult"] = None

        self.__respond(result)

    def __disable_control(self, instance):
        # If a control node is to be disabled, disable it and re-setup it
        if(self.context == "control"):
            self.instances[instance]["activated"] = False
            self.control_setup(self.instances[instance]["params"])

    def control_finish(self):
        self.__disable_control(self.current_instance)

    def control_reset_on_deactivate(self, value):
        self.reset_control = value

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
