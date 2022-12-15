import time

from NodeBase import node_base

# After this node is activated by other node it will stay activated for a user specified time
class NodePersist(node_base):

    def control_setup(self, params):
        # Ignore dependency nodes
        self.set_check_deactivated_control(True)
        self.control_reset_on_deactivate(False)

    def check(self, params):
        now = time.time()

        # If the given duration has elapsed, disable the control
        if now >= params["start"] + int(params["value"]) * int(params["unit"]):
            self.control_finish()
            return False

        return True

    def activate(self, params):
        params["start"] = time.time()

    def validate_params(self, params):
        pass

    def get_params_format(self):
        return {
            "unit": {
                "description": "Unit of the persistent activated state duration",
                "strict": True,
                "hint": {
                    "1": "Seconds",
                    "60": "Minutes",
                    "3600": "Hours"
                }
            },

            "value": {
                "description": "Stay activated duration",
                "type": "number"
            }
        }


node = NodePersist("persistent", 1, "control", "fa-regular fa-hourglass-half")
