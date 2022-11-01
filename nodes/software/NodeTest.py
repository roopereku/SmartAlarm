from NodeBase import node_base

class node_test(node_base):
    def check(self):
        print("moi")

    def get_params_format(self):
        return {
            "testparam1" : {
                "type": "int",
            }
        }

node = node_test("test", 1)
