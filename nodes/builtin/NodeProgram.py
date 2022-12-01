from NodeBase import node_base
import subprocess

class node_test(node_base):
    def activate(self, params):
        params["process"] = subprocess.Popen(params["program"])

    def deactivate(self, params):
        params["process"].kill()

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "program": {
                "description" : "What program to start",
                "strict": True,
                "hint": {
                    "glxgears" : "GLX Gears"
                }
            }
        }

node = node_test("program", 0.5, "action", "fa-brands fa-uncharted")
