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
            print("Expected a name for node %s" % (node_type))
            quit(1)
    
        self.name = sys.argv[1]
        self.node_type = node_type
        self.ID = node_type + ":" + self.name
        self.context = context
        self.delay = delay

        # If the node takes no parameters, it's ready by default
        self.defaultReady = len(self.get_params_format()) == 0
        self.instances = []

        self.control_reset_on_deactivate(True)
        print("Default ready", self.defaultReady)

        self.connection = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.connection.connect((server_ip, server_port))

        # Send out relevant information
        self.__respond({
            "format": self.__patched_format(),
            "context": self.context,
            "id" : self.ID,
            "name" : self.name,
            "type" : self.node_type
        })

        while(True):
            # Because Windows doesn't support poll(), use select() here.
            # Select will tell us when the server has sent us a message
            inputs, _, _ = select.select([self.connection], [],[], 0.01)
            for inp in inputs:
                data = self.connection.recv(2048)
                self.__handle_single_messages(data)

            # Only sensors and control nodes call check and send messages
            if(self.context == "action"):
                continue

            should_sleep = False

            # Loop through each instance
            for i in range(len(self.instances)):
                instance = self.instances[i]

                # If the instance is ready for checking, call check()
                if(instance["ready"]):

                    # If a control node instance hasn't been activated, don't perform check
                    if(self.context == "control" and not instance["activated"]):
                        continue

                    self.current_instance = instance["num"]
                    result = self.check(instance["params"])

                    # Only send messages if the value differs to minimize traffic
                    if(result != instance["lastResult"]):
                        message = {
                            "result" : result,
                            "instance" : instance["num"]
                        }

                        self.__respond(message)

                    instance["lastResult"] = result
                    should_sleep = True

            # Sleep for the user specified amount
            if(should_sleep):
                time.sleep(delay)

    def __handle_activate(self, instance, value):
        print(value, " Passed to __handle_activate")

        if(not "activated" in instance):
            instance["activated"] = False

        # If the action node is already in the given state, do nothing.
        # Control nodes can accept the previous state
        if(self.context == "action" and instance["activated"] == value):
            return

        # Are the parameters set?
        if(not instance["ready"]):
            # TODO return a status indicating error
            return

        # Update the state
        instance["activated"] = value

        # Activate or deactivate
        if(value):
            self.activate(instance["params"])

        else:
            if(self.context == "control"):
                # There may be a situation (Such as in NodeCounter) where
                # it shouldn't reset the control nodes state when all dependencies
                # are inactive because the state needs to persist.
                if(self.reset_control):
                    self.__disable_control(instance)

            else: self.deactivate(instance["params"])

        if(self.context == "action"):
            message = {
                "result" : value,
                "instance" : instance["num"]
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
            if(len(msg) > 0):
                self.__handle_message(msg)

    def __handle_message(self, message):
        p = message.split("\r")
        if(len(p) == 0):
            return

        print(p)

        instance_number = int(p[0])
        print("Number", instance_number)

        # Delete the instance number from the incoming parameters
        del p[0]

        # Ignore empty messages
        if(len(p) == 0):
            return

        # FIXME The instancing command probably should respond to the server
        if(p[0] == "instance"):
            self.instances.append({"ready" : self.defaultReady, "params" : {}, "lastResult" : None, "num" : instance_number })
            instance = self.instances[-1]
            self.__disable_control(instance)
            print("Added instance", instance["num"])
            return

        params_format = self.__patched_format()
        result = { "valid" : True, "reason" : "", "instance" : instance_number }

        instance = self.find_instance(instance_number)
        print(instance)

        if(p[0] == "removeinstance"):
            for i in self.instances:
                if(instance["num"] == i["num"]):
                    print("Remove", instance, i["num"])
                    break

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

                instance["params"][params_keys[i]] = p[i]

            # If there's no error so far, validate the parameters
            if(result["valid"]):
                res = self.validate_params(instance["params"])
                instance["ready"] = True
                if(res): result.update(res)

            # If the parameter validation failed, clear the parameters
            if(not result["valid"]):
                instance["params"] = {}
                instance["ready"] = False
                instance["lastResult"] = None

        self.__respond(result)

    def __disable_control(self, instance):
        # If a control node is to be disabled, disable it and re-setup it
        if(self.context == "control"):
            instance["activated"] = False
            self.control_setup(instance["params"])

    def find_instance(self, instance_number):
        for i in self.instances:
            if(i["num"] == instance_number):
                return i

        return None

    def control_finish(self):
        self.__disable_control(self.find_instance(self.current_instance))

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
