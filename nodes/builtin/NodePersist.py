import time

from NodeBase import node_base


class NodePersist(node_base):
    """
    After this node is activated by other node it will stay activated user specified time
    """

    def control_setup(self, params):
        # Don't set this node to false if master node goes to deactivate state
        self.set_check_deactivated_control(True)
        self.control_reset_on_deactivate(False)

    def check(self, params):
        """
        Check if it is time to turn the node to deactivated state
        """

        now = time.time()
        print(now)

        if now >= params["start"] + int(params["value"]) * int(params["unit"]):
            self.control_finish()
            print("aika loppu")
            return False

        return True

    def activate(self, params):
        params["start"] = time.time()
        print("Aktivoitu")

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


node = NodePersist("persistent", 0, "control", "fa-regular fa-hourglass-half")
