from NodeBase import node_base
import subprocess

class node_test(node_base):
    def check(self, params):
        return int(params["valtteri"]) >= 50

    def activate(self, params):
        self.process = subprocess.Popen('glxgears')
        print("activate", self.process.pid)

    def deactivate(self, params):
        self.process.terminate()
        print("deactivate", self.process.pid)

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "valtteri": {
                "type" : "range"
            }
        }

node = node_test("test", 0.5, True)
