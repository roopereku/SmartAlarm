from NodeBase import node_base

class node_test(node_base):
    def check(self, params):

        if(params[0] == "1"):
            return True

        else: return False

    def get_params_format(self):
        return {
            "testparam1" : "int",
            "testparam2" : "string",
        }

node = node_test("test")
