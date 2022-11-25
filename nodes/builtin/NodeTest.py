from NodeBase import node_base
import subprocess

class node_test(node_base):
    def check(self, params):
        return int(params["value"]) >= 50

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "value": {
                "description" : "Set past halfway point to enable",
                "type" : "range"
            }
        }

node = node_test("test", 0.5, "sensor", "fa-solid fa-poo")
