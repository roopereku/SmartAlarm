import datetime

from NodeBase import node_base

# After this node is activated by other node it will stay activated for a user specified time
class NodePersistUntil(node_base):
    def control_setup(self, params):
        # Ignore dependency nodes
        self.set_check_deactivated_control(True)
        self.control_reset_on_deactivate(False)

    def check(self, params):
        now = datetime.datetime.now()
        waiting = True

        if(params["when"] == "minute"):
            waiting = now.minute == params["trigger"].minute

        if(params["when"] == "hour"):
            waiting = now.hour == params["trigger"].hour

        if(params["when"] == "day"):
            waiting = now.day == params["trigger"].day

        if(not waiting):
            self.control_finish()

        return waiting

    def activate(self, params):
        params["trigger"] = datetime.datetime.now()

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "when": {
                "description": "How long should active state persist for",
                "strict": True,
                "hint": {
                    "minute": "Until minute changes",
                    "hour": "Until hour changes",
                    "day": "Until Day changes"
                }
            }
        }


node = NodePersistUntil("persistentuntil", 1, "control", "fa-regular fa-hourglass-half")
