from NodeBase import node_base

class node_counter(node_base):
    def control_setup(self, params):
        self.control_reset_on_deactivate(False)
        params["passed"] = 0

    def check(self, params):
        if(params["passed"] >= int(params["passes"])):
           self.control_finish()
           return True

    def activate(self, params):
        params["passed"] += 1
        print(params["passed"])

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "passes" : {
                "description" : "Enable after n passes",
                "type" : "number"
            }
        }

node = node_counter("counter", 0, "control")
