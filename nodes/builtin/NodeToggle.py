from NodeBase import node_base

class NodeToggle(node_base):
    def control_setup(self, params):
        # Ignore dependency nodes
        self.set_check_deactivated_control(True)
        self.control_reset_on_deactivate(False)

    def check(self, params):
        return params["enabled"]

    def activate(self, params):
        params["enabled"] = not params["enabled"]

    def validate_params(self, params):
        params["enabled"] = int(params["default"])

    def get_params_format(self):
        return {
            "default": {
                "description": "Default state of the toggle switch",
                "strict": True,
                "hint": {
                    "1": "On",
                    "0": "Off",
                }
            }
        }


node = NodeToggle("toggle", 1, "control", "fa-regular fa-hourglass-half")
