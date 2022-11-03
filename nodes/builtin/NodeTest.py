from NodeBase import node_base

class node_test(node_base):
    def check(self, params):
        print("check")
        return params["message"] == "moi"

    def activate(self, params):
        print("activate")

    def deactivate(self, params):
        print("deactivate")

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "message" : {
                "type": "string",
            }
        }

node = node_test("test", 1, False)
