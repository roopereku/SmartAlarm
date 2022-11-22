from NodeBase import node_base
import subprocess
import time

class node_loop(node_base):
    def control_setup(self, params):
        print("setup")
        params["i"] = 0
        params["time"] = 0
        params["limit"] = 0
        params["on"] = False

    def check(self, params):
        now = time.time()

        if(now - params["time"] >= float(params["duration"])):
            params["time"] = now
            params["on"] = not params["on"]

            if(not params["on"]):
                params["i"] += 1
                if(params["i"] >= params["limit"]):
                    self.control_finish()

                print("i is now", params["i"])

        return params["on"]

    def activate(self, params):
        params["limit"] += int(params["iterations"])

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "iterations": {
                "description" : "How many iterations",
                "type" : "number"
            },

            "duration": {
                "description" : "How long does an iteration last",
                "type" : "number"
            },
        }

node = node_loop("loop", 0, "control")
