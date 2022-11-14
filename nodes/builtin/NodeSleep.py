from NodeBase import node_base
import subprocess
import time

class node_sleep(node_base):
    def control_setup(self, params):
        pass

    def check(self, params):
        now = time.time()

        if(now >= params["start"] + int(params["value"]) * int(params["unit"])):
            self.control_finish()
            return True

        return False

    def activate(self, params):
        params["start"] = time.time()

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "unit" : {
                "strict" : True,
                "hint" : {
                    "1" : "Seconds",
                    "60" : "Minutes",
                    "3600" : "Hours"
                }
            },

            "value" : {
                "type" : "number"
            }
        }

node = node_sleep("sleep", 0, "control")