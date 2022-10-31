import paho.mqtt.client as mqtt
import sys

broker_ip = "localhost"
broker_port = 1883

class node_base:
    def __init__(self, name: str):
        self.name = name
        print("Node %s" % (self.name))

        if(len(sys.argv) == 1):
            print("Expected ID for node %s" % (name))
            quit(1)
    
        self.ID = sys.argv[1]

        self.client = mqtt.Client(name + ":" + self.ID)
        self.client.connect(broker_ip, broker_port)
        print("Connected to %s:%d" % (broker_ip, broker_port))

        self.client.on_message = self.__handle_message
        self.client.subscribe("nodes/" + name)
        print("Subscribed to nodes/" + name)

        self.client.loop_forever()

    def __respond(self, response):
        print(response)

    def __handle_message(self, client, userdata, message):
        params = message.payload.decode("utf-8").split()
        params_format = self.get_params_format()
        result = { "valid" : True }

        if(params[0] == "paramsformat"):
            result["value"] = self.get_params_format()

        elif(len(params) != len(params_format)):
            result["valid"] = False

        else: result["value"] = self.check(params)
        self.__respond(result)

    def check(self, params):
        raise NotImplementedError()

    def get_params_format(self, params):
        raise NotImplementedError()
